"""LD2460 detection-range rules (no Home Assistant imports).

These mirror ``validate_detection_range_`` in the Jarvis roomnode firmware
(roomnode/vendor/ld2460/components/ld2460/ld2460.cpp). The firmware silently refuses
a combination it considers invalid, so the same rules are checked before writing.

Installation modes (the ``Tracking Radar Installation Mode`` select):
    side - wall mounting: distance 0.1-6 m, start/end angle within -60..60, start < end
    top  - ceiling mounting: distance 0.1-4 m, start/end angle within 0..360, start < end
"""

from __future__ import annotations

SIDE = "side"
TOP = "top"

LIMITS = {
    SIDE: {"max_distance": 6.0, "min_angle": -60.0, "max_angle": 60.0},
    TOP: {"max_distance": 4.0, "min_angle": 0.0, "max_angle": 360.0},
}


def mode_for_mounting(mounting: str) -> str:
    """Plan mounting type ('wall' or 'ceiling') to the radar's installation mode."""
    return TOP if mounting == "ceiling" else SIDE


def default_angles(mounting: str) -> tuple[float, float]:
    return (0.0, 360.0) if mounting == "ceiling" else (-60.0, 60.0)


def validate_detection(mode: str, distance_m: float, start: float, end: float) -> list[str]:
    """Return human-readable problems; an empty list means the firmware accepts it."""
    if mode not in LIMITS:
        return [f"Unknown installation mode '{mode}'"]
    lim = LIMITS[mode]
    errors: list[str] = []
    if not 0.1 <= distance_m <= lim["max_distance"]:
        errors.append(
            f"Detection distance must be between 0.1 and {lim['max_distance']:g} m in {mode} mode "
            f"(now {distance_m:g} m)"
        )
    if not start < end:
        errors.append("The start angle must be smaller than the end angle")
    if start < lim["min_angle"] or end > lim["max_angle"]:
        errors.append(
            f"Angles must stay between {lim['min_angle']:g}° and {lim['max_angle']:g}° in {mode} mode "
            f"(now {start:g}° to {end:g}°)"
        )
    return errors


def write_order(current_end: float | None, new_start: float) -> list[str]:
    """Which angle to write first so the device never sees start >= end half-way.

    The firmware keeps the written values and validates the combination, so the order is
    only a courtesy that avoids a refused intermediate state.
    """
    if current_end is not None and new_start >= current_end:
        return ["end", "start"]
    return ["start", "end"]


def differs(current: float | None, new: float, tolerance: float = 0.05) -> bool:
    return current is None or abs(current - new) >= tolerance
