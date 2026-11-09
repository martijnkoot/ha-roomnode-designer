"""Floor plan data model validation (no Home Assistant imports)."""

from __future__ import annotations

import math
from typing import Any

MAX_FLOORS = 50
MAX_ROOMS = 100
MAX_NODES = 50
MAX_ROOM_POINTS = 64
MAX_ZONE_POINTS = 20
MOUNTINGS = ("wall", "ceiling")
COORD_LIMIT = 1_000_000  # mm; keeps encoded strings and the canvas sane


class ModelError(ValueError):
    """The submitted floor plan is malformed."""


def empty_model() -> dict[str, Any]:
    return {"floors": {}}


def _num(value: Any, name: str, default: float | None = None, lo: float = -COORD_LIMIT, hi: float = COORD_LIMIT) -> float:
    if value is None:
        if default is None:
            raise ModelError(f"{name} is required")
        return float(default)
    try:
        number = float(value)
    except (TypeError, ValueError) as err:
        raise ModelError(f"{name} must be a number") from err
    if not math.isfinite(number) or not lo <= number <= hi:
        raise ModelError(f"{name} is out of range")
    return number


def _str(value: Any, name: str, default: str = "", max_len: int = 120) -> str:
    if value is None:
        return default
    if not isinstance(value, str) or len(value) > max_len:
        raise ModelError(f"{name} must be a string of at most {max_len} characters")
    return value


def _point(value: Any, name: str) -> list[float]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise ModelError(f"{name} must be an [x, y] pair")
    return [round(_num(value[0], name), 1), round(_num(value[1], name), 1)]


def _points(value: Any, name: str, minimum: int, maximum: int) -> list[list[float]]:
    if not isinstance(value, list) or not minimum <= len(value) <= maximum:
        raise ModelError(f"{name} needs {minimum} to {maximum} points")
    return [_point(p, name) for p in value]


def _list(value: Any, name: str, maximum: int) -> list[Any]:
    if value is None:
        return []
    if not isinstance(value, list) or len(value) > maximum:
        raise ModelError(f"{name} must be a list of at most {maximum} items")
    return value


def _validate_room(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ModelError("room must be an object")
    return {
        "id": _str(raw.get("id"), "room.id", max_len=64) or _fail("room.id is required"),
        "name": _str(raw.get("name"), "room.name"),
        "area_id": _str(raw.get("area_id"), "room.area_id", max_len=128) or None,
        "points": _points(raw.get("points"), "room.points", 3, MAX_ROOM_POINTS),
    }


def _fail(message: str) -> Any:
    raise ModelError(message)


def _validate_shape(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ModelError("zone must be an object")
    kind = raw.get("kind")
    if kind not in ("zone", "exclusion"):
        raise ModelError("zone.kind must be 'zone' or 'exclusion'")
    limit = 4 if kind == "zone" else 2
    slot = int(_num(raw.get("slot"), "zone.slot", lo=1, hi=limit))
    return {
        "kind": kind,
        "slot": slot,
        "name": _str(raw.get("name"), "zone.name", max_len=60),
        "points": _points(raw.get("points"), "zone.points", 3, MAX_ZONE_POINTS),
    }


def _validate_line(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ModelError("entry line must be an object")
    side = raw.get("in_side", "left")
    if side not in ("left", "right"):
        raise ModelError("in_side must be 'left' or 'right'")
    return {
        "slot": int(_num(raw.get("slot"), "line.slot", lo=1, hi=2)),
        "p1": _point(raw.get("p1"), "line.p1"),
        "p2": _point(raw.get("p2"), "line.p2"),
        "in_side": side,
    }


def _unique_slots(items: list[dict[str, Any]], what: str) -> None:
    seen = set()
    for item in items:
        key = (item.get("kind"), item["slot"])
        if key in seen:
            raise ModelError(f"{what} slot {item['slot']} is used twice")
        seen.add(key)


def _validate_node(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ModelError("node must be an object")
    mounting = raw.get("mounting", "wall")
    if mounting not in MOUNTINGS:
        raise ModelError("node.mounting must be 'wall' or 'ceiling'")
    zones = [_validate_shape(z) for z in _list(raw.get("zones"), "node.zones", 6)]
    lines = [_validate_line(l) for l in _list(raw.get("lines"), "node.lines", 2)]
    _unique_slots(zones, "zone")
    _unique_slots(lines, "entry line")
    return {
        "id": _str(raw.get("id"), "node.id", max_len=64) or _fail("node.id is required"),
        "device_id": _str(raw.get("device_id"), "node.device_id", max_len=128) or None,
        "name": _str(raw.get("name"), "node.name"),
        "x": _num(raw.get("x"), "node.x"),
        "y": _num(raw.get("y"), "node.y"),
        "rotation": _num(raw.get("rotation"), "node.rotation", default=0, lo=-720, hi=720),
        "flip_x": bool(raw.get("flip_x", False)),
        "mounting": mounting,
        "height": _num(raw.get("height"), "node.height", default=1500, lo=0, hi=10000),
        "range": _num(raw.get("range"), "node.range", default=6000, lo=500, hi=20000),
        "fov": _num(raw.get("fov"), "node.fov", default=120, lo=10, hi=360),
        "zones": zones,
        "lines": lines,
    }


def validate_model(raw: Any) -> dict[str, Any]:
    """Return a cleaned copy of ``raw`` or raise :class:`ModelError`."""
    if not isinstance(raw, dict) or not isinstance(raw.get("floors"), dict):
        raise ModelError("model must contain a 'floors' object")
    if len(raw["floors"]) > MAX_FLOORS:
        raise ModelError("too many floors")
    floors: dict[str, Any] = {}
    node_ids: set[str] = set()
    for floor_id, floor in raw["floors"].items():
        if not isinstance(floor_id, str) or not isinstance(floor, dict) or len(floor_id) > 128:
            raise ModelError("invalid floor entry")
        rooms = [_validate_room(r) for r in _list(floor.get("rooms"), "rooms", MAX_ROOMS)]
        nodes = [_validate_node(n) for n in _list(floor.get("nodes"), "nodes", MAX_NODES)]
        for node in nodes:
            if node["id"] in node_ids:
                raise ModelError(f"node id {node['id']} is used twice")
            node_ids.add(node["id"])
        floors[floor_id] = {"rooms": rooms, "nodes": nodes}
    return {"floors": floors}


def find_node(model: dict[str, Any], node_id: str) -> dict[str, Any] | None:
    for floor in model.get("floors", {}).values():
        for node in floor.get("nodes", []):
            if node["id"] == node_id:
                return node
    return None
