"""Roomnode Designer: a graphical floor plan editor for Jarvis roomnodes."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.loader import async_get_integration

from . import websocket_api
from .const import (
    DOMAIN,
    PANEL_ELEMENT,
    PANEL_URL_PATH,
    STATIC_URL,
    STORAGE_KEY,
    STORAGE_VERSION,
)
from .model import ModelError, empty_model, validate_model

_LOGGER = logging.getLogger(__name__)


class DesignerStore:
    """Persists the floor plan in .storage and tracks a revision for conflict detection."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.model: dict = empty_model()
        self.revision: int = 0

    async def async_load(self) -> None:
        data = await self._store.async_load()
        if not data:
            return
        try:
            self.model = validate_model(data.get("model"))
        except ModelError as err:
            _LOGGER.error("Stored floor plan is invalid and was ignored: %s", err)
            return
        self.revision = int(data.get("revision", 0))

    async def async_save(self, model: dict) -> int:
        self.model = model
        self.revision += 1
        await self._store.async_save({"model": self.model, "revision": self.revision})
        return self.revision


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    domain_data = hass.data.setdefault(DOMAIN, {})

    store = DesignerStore(hass)
    await store.async_load()
    domain_data["store"] = store

    if not domain_data.get("static_registered"):
        frontend_dir = Path(__file__).parent / "frontend"
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(frontend_dir), False)]
        )
        websocket_api.async_register(hass)
        domain_data["static_registered"] = True

    integration = await async_get_integration(hass, DOMAIN)
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL_PATH,
        # The version query string busts the browser cache when HACS updates the files.
        module_url=f"{STATIC_URL}/{PANEL_ELEMENT}.js?v={integration.version}",
        sidebar_title="Roomnodes",
        sidebar_icon="mdi:floor-plan",
        require_admin=True,
        config={},
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    hass.data.get(DOMAIN, {}).pop("store", None)
    return True
