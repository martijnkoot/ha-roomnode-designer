"""Discover roomnodes and read/write their zone entities."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .const import (
    ENTITY_NAME_PREFIXES,
    ENTITY_NAMES_EXACT,
    NAME_RADAR_DISTANCE,
    NAME_RADAR_END,
    NAME_RADAR_MODE,
    NAME_RADAR_START,
    REQUIRED_ENTITY,
    WRITABLE_DOMAINS,
)
from .geometry import GeometryError, build_payload, parse_payload
from .radar import differs, mode_for_mounting, validate_detection, write_order


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
        if not name or not _wanted(name):
            continue
        # Prefer the writable entity when two share a name (radar mode: select + text sensor).
        if name in result and entry.domain not in WRITABLE_DOMAINS:
            continue
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


_TO_METRES = {"m": 1.0, "cm": 0.01, "mm": 0.001}


def _number(hass: HomeAssistant, entity_id: str | None) -> tuple[float | None, str | None]:
    """Numeric state and its unit, or (None, None) when unknown/unavailable."""
    state = hass.states.get(entity_id) if entity_id else None
    if state is None:
        return None, None
    try:
        return float(state.state), state.attributes.get("unit_of_measurement")
    except (TypeError, ValueError):
        return None, None


def _distance_m(hass: HomeAssistant, entity_id: str | None) -> float | None:
    value, unit = _number(hass, entity_id)
    if value is None:
        return None
    return value * _TO_METRES.get(unit or "m", 1.0)


def _radar_mode(hass: HomeAssistant, entity_id: str | None) -> str | None:
    state = hass.states.get(entity_id) if entity_id else None
    return state.state if state is not None and state.state in ("side", "top") else None


def pull_radar(hass: HomeAssistant, node: dict[str, Any]) -> dict[str, Any]:
    """Current detection settings of the radar, in plan units. Missing values are omitted."""
    if not node.get("device_id"):
        raise HomeAssistantError("This node is not linked to a device")
    ent = entity_map(hass, node["device_id"])
    if NAME_RADAR_START not in ent or NAME_RADAR_END not in ent:
        raise HomeAssistantError(
            "The device does not expose the radar detection angles. "
            "Is it running the Jarvis roomnode firmware?"
        )
    result: dict[str, Any] = {}
    mode = _radar_mode(hass, ent.get(NAME_RADAR_MODE))
    if mode:
        result["mode"] = mode
        result["mounting"] = "ceiling" if mode == "top" else "wall"
    start, _ = _number(hass, ent[NAME_RADAR_START])
    end, _ = _number(hass, ent[NAME_RADAR_END])
    distance = _distance_m(hass, ent.get(NAME_RADAR_DISTANCE))
    if start is not None:
        result["angle_start"] = start
    if end is not None:
        result["angle_end"] = end
    if distance is not None:
        result["range"] = round(distance * 1000)
    return result


async def async_push_radar(hass: HomeAssistant, node: dict[str, Any]) -> dict[str, Any]:
    """Write detection distance and start/end angle to the radar, validated like the firmware."""
    if not node.get("device_id"):
        raise HomeAssistantError("This node is not linked to a device")
    ent = entity_map(hass, node["device_id"])
    missing = [n for n in (NAME_RADAR_MODE, NAME_RADAR_DISTANCE, NAME_RADAR_START, NAME_RADAR_END) if n not in ent]
    if missing:
        raise HomeAssistantError(
            "The device does not expose: " + ", ".join(missing) + ". Is it running the Jarvis roomnode firmware?"
        )
    mode = _radar_mode(hass, ent[NAME_RADAR_MODE])
    if mode is None:
        raise HomeAssistantError("The radar installation mode is not known yet (device offline?)")
    wanted = mode_for_mounting(node.get("mounting", "wall"))
    if wanted != mode:
        raise HomeAssistantError(
            f"The radar is in '{mode}' mode but this roomnode is set to "
            f"'{node.get('mounting', 'wall')}' in the plan. Change the installation mode of the radar "
            "in Home Assistant, or the mounting in the plan, so they agree."
        )

    distance = round(float(node["range"]) / 1000, 1)
    start = round(float(node["angle_start"]), 1)
    end = round(float(node["angle_end"]), 1)
    errors = validate_detection(mode, distance, start, end)
    if errors:
        raise HomeAssistantError("; ".join(errors))

    cur_start, _ = _number(hass, ent[NAME_RADAR_START])
    cur_end, _ = _number(hass, ent[NAME_RADAR_END])
    cur_distance = _distance_m(hass, ent[NAME_RADAR_DISTANCE])
    _, distance_unit = _number(hass, ent[NAME_RADAR_DISTANCE])
    factor = _TO_METRES.get(distance_unit or "m", 1.0)

    plan = {
        "distance": (NAME_RADAR_DISTANCE, distance, differs(cur_distance, distance), distance / factor),
        "start": (NAME_RADAR_START, start, differs(cur_start, start), start),
        "end": (NAME_RADAR_END, end, differs(cur_end, end), end),
    }
    sent: dict[str, float] = {}
    for key in ["distance", *write_order(cur_end, start)]:
        name, shown, needed, value = plan[key]
        if not needed:
            continue
        await hass.services.async_call(
            "number", "set_value", {"entity_id": ent[name], "value": round(value, 3)}, blocking=True
        )
        sent[key] = shown
    return {"mode": mode, "sent": sent}
