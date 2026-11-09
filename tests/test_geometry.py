"""Geometry tests. Loads geometry.py directly so Home Assistant is not required."""

import importlib.util
import math
import pathlib
import unittest

_PATH = (
    pathlib.Path(__file__).parents[1]
    / "custom_components"
    / "roomnode_designer"
    / "geometry.py"
)
_spec = importlib.util.spec_from_file_location("rd_geometry", _PATH)
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)


def node(**kw):
    base = {"x": 1000, "y": 2000, "rotation": 0, "flip_x": False}
    base.update(kw)
    return base


class TransformTests(unittest.TestCase):
    def test_facing_north_forward_is_plus_y(self):
        lx, ly = g.floor_to_radar((1000, 3000), node())
        self.assertAlmostEqual(lx, 0)
        self.assertAlmostEqual(ly, 1000)

    def test_facing_north_right_is_east(self):
        lx, ly = g.floor_to_radar((2000, 2000), node())
        self.assertAlmostEqual(lx, 1000)
        self.assertAlmostEqual(ly, 0)

    def test_rotation_clockwise_90_faces_east(self):
        lx, ly = g.floor_to_radar((2000, 2000), node(rotation=90))
        self.assertAlmostEqual(lx, 0)
        self.assertAlmostEqual(ly, 1000)

    def test_flip_mirrors_lateral_axis(self):
        lx, _ = g.floor_to_radar((2000, 2000), node(flip_x=True))
        self.assertAlmostEqual(lx, -1000)

    def test_round_trip(self):
        n = node(rotation=37.5, flip_x=True)
        p = (123.0, -456.0)
        back = g.radar_to_floor(g.floor_to_radar(p, n), n)
        self.assertAlmostEqual(back[0], p[0])
        self.assertAlmostEqual(back[1], p[1])


class EncodeTests(unittest.TestCase):
    def test_polygon_string(self):
        pts = [(1000, 2000), (2000, 2000), (2000, 3000)]
        self.assertEqual(g.encode_polygon(pts, node()), "0:0;1000:0;1000:1000")

    def test_polygon_needs_three_points(self):
        with self.assertRaises(g.GeometryError):
            g.encode_polygon([(0, 0), (1, 1)], node())

    def test_polygon_vertex_limit(self):
        pts = [(i, i * i % 97) for i in range(21)]
        with self.assertRaises(g.GeometryError):
            g.encode_polygon(pts, node())

    def test_text_length_limit(self):
        pts = [(i * 100000 - 900000, (i % 2) * 9999999) for i in range(20)]
        with self.assertRaises(g.GeometryError):
            g.encode_polygon(pts, node())

    def test_entry_line_flip_swaps_side(self):
        line = {"p1": (1000, 2000), "p2": (1000, 3000), "in_side": "left"}
        self.assertTrue(g.encode_entry_line(line, node()).endswith(";left"))
        self.assertTrue(g.encode_entry_line(line, node(flip_x=True)).endswith(";right"))

    def test_polygon_round_trip_with_rotation(self):
        n = node(rotation=30)
        pts = [(500, 500), (3000, 800), (2500, 4000), (200, 3500)]
        text = g.encode_polygon(pts, n)
        back = g.decode_polygon(text, n)
        for a, b in zip(pts, back):
            self.assertAlmostEqual(a[0], b[0], delta=1.5)
            self.assertAlmostEqual(a[1], b[1], delta=1.5)

    def test_left_side_preserved_by_rotation(self):
        """Side of line must be identical in both frames for a proper rotation."""
        n = node(rotation=70)
        p1, p2, probe = (0.0, 0.0), (1000.0, 0.0), (500.0, 800.0)  # probe is left of p1->p2

        def side(a, b, c):
            return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

        r1, r2, rp = (g.floor_to_radar(p, n) for p in (p1, p2, probe))
        self.assertGreater(side(p1, p2, probe), 0)
        self.assertGreater(side(r1, r2, rp), 0)

    def test_flip_reverses_handedness_as_assumed(self):
        n = node(flip_x=True)
        p1, p2, probe = (0.0, 0.0), (1000.0, 0.0), (500.0, 800.0)

        def side(a, b, c):
            return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

        r1, r2, rp = (g.floor_to_radar(p, n) for p in (p1, p2, probe))
        self.assertLess(side(r1, r2, rp), 0)


class PayloadTests(unittest.TestCase):
    def test_unused_slots_are_cleared(self):
        payload = g.build_payload(node())
        self.assertEqual(len(payload), 8)
        self.assertTrue(all(v == "" for v in payload.values()))

    def test_build_and_parse(self):
        n = node(
            zones=[
                {"kind": "zone", "slot": 2, "points": [(0, 0), (1500, 0), (1500, 1500)]},
                {"kind": "exclusion", "slot": 1, "points": [(2000, 2000), (2500, 2000), (2500, 2500)]},
            ],
            lines=[{"slot": 1, "p1": (1000, 2500), "p2": (2000, 2500), "in_side": "right"}],
        )
        payload = g.build_payload(n)
        self.assertEqual(payload["Polygon Zone 1"], "")
        self.assertTrue(payload["Polygon Zone 2"])
        self.assertTrue(payload["Polygon Exclusion 1"])
        self.assertTrue(payload["Entry Line 1"].endswith(";right"))
        parsed = g.parse_payload(payload, n)
        self.assertEqual({(z["kind"], z["slot"]) for z in parsed["zones"]}, {("zone", 2), ("exclusion", 1)})
        self.assertEqual(parsed["lines"][0]["in_side"], "right")

    def test_duplicate_slot_rejected(self):
        shape = {"kind": "zone", "slot": 1, "points": [(0, 0), (1, 0), (1, 1)]}
        with self.assertRaises(g.GeometryError):
            g.build_payload(node(zones=[shape, dict(shape)]))

    def test_slot_out_of_range_rejected(self):
        shape = {"kind": "zone", "slot": 5, "points": [(0, 0), (1, 0), (1, 1)]}
        with self.assertRaises(g.GeometryError):
            g.build_payload(node(zones=[shape]))

    def test_decode_garbage_is_empty(self):
        self.assertEqual(g.decode_polygon("abc", node()), [])
        self.assertIsNone(g.decode_entry_line("", node()))


if __name__ == "__main__":
    unittest.main()
