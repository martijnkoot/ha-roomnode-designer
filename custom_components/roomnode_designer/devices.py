"""Discover roomnodes and read/write their zone entities."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import ENTITY_NAME_PREFIXES, ENTITY_NAMES_EXACT, REQUIRED_ENTITY
from .geometry import GeometryError, build_payload, parse_payload


def _wanted(name: str) -> bool:
    return name in ENTITY_NAMES_EXACT or name.startswith(ENTITY_NAME_PREFIXES)


def entity_map(hass: HomeAssistant, device_id: str) -> dict[str, str]:
    """Map firmware entity names to entity ids for one device."""
    registry = er.async_get(hass)
    result: dict[str, str] = {}
    for entry in er.async_entries_for_device(registry, device_id):
        if entry.disabled_by is not None:
            continue
        name = entry.original_name or entry.name
        if name and _wanted(name):
            result[name] = entry.entity_id
    return result


def discover_nodes(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Return every device that exposes the roomnode zone entities."""
    device_registry = dr.async_get(hass)
    found = []
    for device in device_registry.devices.values():
        if device.disabled_by is not None:
            continue
        entities = entity_map(hass, device.id)
        if REQUIRED_ENTITY not in entities:
            continue
        found.append(
            {
                "device_id": device.id,
                "name": device.name_by_user or device.name or device.id,
                "area_id": device.area_id,
                "entities": entities,
            }
        )
    found.sort(key=lambda d: d["name"].casefold())
    return found


def _value(hass: HomeAssistant, entity_id: str | None) -> str:
    state = hass.states.get(entity_id) if entity_id else None
    if state is None or state.state in ("unknown", "unavailable"):
        return ""
    return state.state


async def async_push_node(hass: HomeAssistant, node: dict[str, Any]) -> dict[str, str]:
    """Write a node's zones and entry lines to its device. Returns what was sent."""
    if not node.get("device_id"):
        raise HomeAssistantError("This node is not linked to a device")
    entities = entity_map(hass, node["device_id"])
    try:
        payload = build_payload(node)
    except GeometryError as err:
        raise HomeAssistantError(str(err)) from err

    missing = [name for name in payload if name not in entities]
    if missing:
        raise HomeAssistantError(
            "The device does not expose: " + ", ".join(sorted(missing))
            + ". Is it running the Jarvis roomnode firmware?"
        )
    for name, value in payload.items():
        await hass.services.async_call(
            "text",
            "set_value",
            {"entity_id": entities[name], "value": value},
            blocking=True,
        )
    return payload


def pull_node(hass: HomeAssistant, node: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Read the zones currently stored on the device as floor-plan shapes."""
    if not node.get("device_id"):
        raise HomeAssistantError("This node is not linked to a device")
    entities = entity_map(hass, node["device_id"])
    values = {
        name: _value(hass, entity_id)
        for name, entity_id in entities.items()
        if name.startswith(("Polygon Zone ", "Polygon Exclusion ", "Entry Line "))
        and not name.endswith(("Presence", "Count"))
    }
    return parse_payload(values, node)
