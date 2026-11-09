"""Pure geometry and firmware-format helpers (no Home Assistant imports).

Coordinate conventions
----------------------
Floor plan frame: millimetres, x to the east, y to the north (right-handed,
y up). The UI flips y when drawing.

Radar frame (what the firmware expects): millimetres, x lateral, y forward,
origin at the radar. A node is placed at (x, y) on the floor plan and has a
``rotation`` (compass-style: 0 = radar looks north, positive = clockwise) and an
optional ``flip_x`` for radars whose lateral axis is mirrored.

Firmware string formats (see roomnode/vendor/ld2460/packages/ld2460-polygon-zones.yaml):
    polygon:    "x:y;x:y;x:y"            (max 20 vertices, integers, >= 3 to be active)
    entry line: "x1:y1;x2:y2;left|right" (``left``/``right`` = side counted as "in")
Template text entities default to a 255 character limit.
"""

from __future__ import annotations

import math
from typing import Any, Iterable, Sequence

Point = Sequence[float]

MAX_VERTICES = 20
MAX_TEXT_LENGTH = 255
ZONE_SLOTS = 4
EXCLUSION_SLOTS = 2
LINE_SLOTS = 2


class GeometryError(ValueError):
    """Raised when a shape cannot be represented on the firmware."""


def _basis(rotation_deg: float, flip_x: bool) -> tuple[tuple[float, float], tuple[float, float]]:
    """Return (right, forward) unit vectors of the radar frame in floor coordinates."""
    h = math.radians(rotation_deg)
    forward = (math.sin(h), math.cos(h))
    right = (math.cos(h), -math.sin(h))
    if flip_x:
        right = (-right[0], -right[1])
    return right, forward


def floor_to_radar(point: Point, node: dict[str, Any]) -> tuple[float, float]:
    """Convert a floor-plan point to the node's radar frame."""
    right, forward = _basis(float(node.get("rotation", 0)), bool(node.get("flip_x", False)))
    dx = float(point[0]) - float(node["x"])
    dy = float(point[1]) - float(node["y"])
    return (dx * right[0] + dy * right[1], dx * forward[0] + dy * forward[1])


def radar_to_floor(point: Point, node: dict[str, Any]) -> tuple[float, float]:
    """Convert a point in the node's radar frame to floor-plan coordinates."""
    right, forward = _basis(float(node.get("rotation", 0)), bool(node.get("flip_x", False)))
    lx, ly = float(point[0]), float(point[1])
    return (
        float(node["x"]) + lx * right[0] + ly * forward[0],
        float(node["y"]) + lx * right[1] + ly * forward[1],
    )


def encode_polygon(points: Iterable[Point], node: dict[str, Any]) -> str:
    """Encode a floor-plan polygon as a firmware string in the node's radar frame."""
    pts = [floor_to_radar(p, node) for p in points]
    if len(pts) < 3:
        raise GeometryError("A polygon needs at least 3 points")
    if len(pts) > MAX_VERTICES:
        raise GeometryError(f"A polygon can have at most {MAX_VERTICES} points")
    text = ";".join(f"{round(x)}:{round(y)}" for x, y in pts)
    _check_length(text)
    return text


def encode_entry_line(line: dict[str, Any], node: dict[str, Any]) -> str:
    """Encode an entry line ``{p1, p2, in_side}`` for the firmware."""
    p1 = floor_to_radar(line["p1"], node)
    p2 = floor_to_radar(line["p2"], node)
    side = line.get("in_side", "left")
    if side not in ("left", "right"):
        raise GeometryError("in_side must be 'left' or 'right'")
    # A mirrored radar frame reverses handedness, so left and right swap.
    if node.get("flip_x"):
        side = "right" if side == "left" else "left"
    text = f"{round(p1[0])}:{round(p1[1])};{round(p2[0])}:{round(p2[1])};{side}"
    _check_length(text)
    return text


def _check_length(text: str) -> None:
    if len(text) > MAX_TEXT_LENGTH:
        raise GeometryError(
            f"Encoded shape is {len(text)} characters; the device accepts {MAX_TEXT_LENGTH}. "
            "Use fewer points or move the node closer to the shape."
        )


def decode_polygon(text: str, node: dict[str, Any]) -> list[list[float]]:
    """Decode a firmware polygon string into floor-plan points."""
    points: list[list[float]] = []
    for part in (text or "").split(";"):
        if not part:
            continue
        try:
            x, y = part.split(":")
            points.append(list(radar_to_floor((float(x), float(y)), node)))
        except ValueError:
            break  # the firmware stops parsing at the first bad vertex
        if len(points) >= MAX_VERTICES:
            break
    return points if len(points) >= 3 else []


def decode_entry_line(text: str, node: dict[str, Any]) -> dict[str, Any] | None:
    """Decode a firmware entry line string, or ``None`` when empty/invalid."""
    parts = (text or "").split(";")
    if len(parts) < 2:
        return None
    try:
        x1, y1 = parts[0].split(":")
        x2, y2 = parts[1].split(":")
        p1 = radar_to_floor((float(x1), float(y1)), node)
        p2 = radar_to_floor((float(x2), float(y2)), node)
    except ValueError:
        return None
    side = parts[2] if len(parts) > 2 and parts[2] in ("left", "right") else "left"
    if node.get("flip_x"):
        side = "right" if side == "left" else "left"
    return {"p1": list(p1), "p2": list(p2), "in_side": side}


def build_payload(node: dict[str, Any]) -> dict[str, str]:
    """Build every text value for a node, keyed by firmware entity name.

    Unused slots map to an empty string so removing a shape in the designer
    also clears it on the device.
    """
    payload: dict[str, str] = {}
    for slot in range(1, ZONE_SLOTS + 1):
        payload[f"Polygon Zone {slot}"] = ""
    for slot in range(1, EXCLUSION_SLOTS + 1):
        payload[f"Polygon Exclusion {slot}"] = ""
    for slot in range(1, LINE_SLOTS + 1):
        payload[f"Entry Line {slot}"] = ""

    seen: set[str] = set()
    for shape in node.get("zones", []):
        kind = shape.get("kind")
        slot = int(shape.get("slot", 0))
        if kind == "zone" and 1 <= slot <= ZONE_SLOTS:
            key = f"Polygon Zone {slot}"
        elif kind == "exclusion" and 1 <= slot <= EXCLUSION_SLOTS:
            key = f"Polygon Exclusion {slot}"
        else:
            raise GeometryError(f"Invalid zone kind/slot: {kind} {slot}")
        if key in seen:
            raise GeometryError(f"{key} is defined twice")
        seen.add(key)
        payload[key] = encode_polygon(shape.get("points", []), node)

    for line in node.get("lines", []):
        slot = int(line.get("slot", 0))
        if not 1 <= slot <= LINE_SLOTS:
            raise GeometryError(f"Invalid entry line slot: {slot}")
        key = f"Entry Line {slot}"
        if key in seen:
            raise GeometryError(f"{key} is defined twice")
        seen.add(key)
        payload[key] = encode_entry_line(line, node)
    return payload


def parse_payload(values: dict[str, str], node: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Inverse of :func:`build_payload`: device strings to floor-plan shapes."""
    zones: list[dict[str, Any]] = []
    lines: list[dict[str, Any]] = []
    for slot in range(1, ZONE_SLOTS + 1):
        pts = decode_polygon(values.get(f"Polygon Zone {slot}", ""), node)
        if pts:
            zones.append({"kind": "zone", "slot": slot, "points": pts})
    for slot in range(1, EXCLUSION_SLOTS + 1):
        pts = decode_polygon(values.get(f"Polygon Exclusion {slot}", ""), node)
        if pts:
            zones.append({"kind": "exclusion", "slot": slot, "points": pts})
    for slot in range(1, LINE_SLOTS + 1):
        line = decode_entry_line(values.get(f"Entry Line {slot}", ""), node)
        if line:
            lines.append({"slot": slot, **line})
    return {"zones": zones, "lines": lines}
