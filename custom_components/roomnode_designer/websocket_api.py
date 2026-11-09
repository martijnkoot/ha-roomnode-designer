"""WebSocket API used by the designer panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .devices import async_push_node, discover_nodes, pull_node
from .model import ModelError, find_node, validate_model


def _store(hass: HomeAssistant):
    return hass.data.get(DOMAIN, {}).get("store")


@callback
def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_load)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_push)
    websocket_api.async_register_command(hass, ws_pull)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/load"})
@websocket_api.require_admin
@callback
def ws_load(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Return the saved floor plan and the roomnodes Home Assistant can see."""
    store = _store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Roomnode Designer is not set up")
        return
    connection.send_result(
        msg["id"],
        {"model": store.model, "revision": store.revision, "devices": discover_nodes(hass)},
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/save",
        vol.Required("model"): dict,
        vol.Required("revision"): int,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    store = _store(hass)
    if store is None:
        connection.send_error(msg["id"], "not_loaded", "Roomnode Designer is not set up")
        return
    if msg["revision"] != store.revision:
        connection.send_error(
            msg["id"], "conflict", "The floor plan was changed elsewhere. Reload the page."
        )
        return
    try:
        model = validate_model(msg["model"])
    except ModelError as err:
        connection.send_error(msg["id"], "invalid_model", str(err))
        return
    revision = await store.async_save(model)
    connection.send_result(msg["id"], {"revision": revision})


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/push", vol.Required("node_id"): str}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_push(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Write a *saved* node to its device."""
    store = _store(hass)
    node = find_node(store.model, msg["node_id"]) if store else None
    if node is None:
        connection.send_error(msg["id"], "not_found", "Node not found. Save the floor plan first.")
        return
    try:
        sent = await async_push_node(hass, node)
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "push_failed", str(err))
        return
    connection.send_result(msg["id"], {"sent": sent})


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/pull", vol.Required("node_id"): str}
)
@websocket_api.require_admin
@callback
def ws_pull(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Read the zones currently on the device, positioned using the saved node."""
    store = _store(hass)
    node = find_node(store.model, msg["node_id"]) if store else None
    if node is None:
        connection.send_error(msg["id"], "not_found", "Node not found. Save the floor plan first.")
        return
    try:
        shapes = pull_node(hass, node)
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "pull_failed", str(err))
        return
    connection.send_result(msg["id"], shapes)
