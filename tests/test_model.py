"""Model validation tests. Loads model.py directly so Home Assistant is not required."""

import importlib.util
import pathlib
import unittest

_PATH = pathlib.Path(__file__).parents[1] / "custom_components" / "roomnode_designer" / "model.py"
_spec = importlib.util.spec_from_file_location("rd_model", _PATH)
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)


def good_node(**kw):
    node = {"id": "n1", "device_id": "dev", "name": "Node", "x": 0, "y": 0}
    node.update(kw)
    return node


def model_with(node=None, room=None):
    return {"floors": {"f1": {"rooms": [room] if room else [], "nodes": [node] if node else []}}}


class ValidateTests(unittest.TestCase):
    def test_empty_ok(self):
        self.assertEqual(m.validate_model({"floors": {}}), {"floors": {}})

    def test_defaults_are_filled(self):
        node = m.validate_model(model_with(good_node()))["floors"]["f1"]["nodes"][0]
        self.assertEqual((node["mounting"], node["fov"], node["range"]), ("wall", 120.0, 6000.0))
        self.assertEqual(node["zones"], [])

    def test_unknown_keys_dropped(self):
        node = m.validate_model(model_with(good_node(evil="<script>")))["floors"]["f1"]["nodes"][0]
        self.assertNotIn("evil", node)

    def test_rejects_non_dict(self):
        for bad in (None, [], {"floors": []}, {"floors": {"f": []}}):
            with self.assertRaises(m.ModelError):
                m.validate_model(bad)

    def test_rejects_non_finite_and_huge_numbers(self):
        for bad in (float("nan"), float("inf"), 10**9, "abc"):
            with self.assertRaises(m.ModelError):
                m.validate_model(model_with(good_node(x=bad)))

    def test_bad_mounting(self):
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(good_node(mounting="floor")))

    def test_duplicate_node_ids_across_floors(self):
        raw = {"floors": {"a": {"nodes": [good_node()]}, "b": {"nodes": [good_node()]}}}
        with self.assertRaises(m.ModelError):
            m.validate_model(raw)

    def test_zone_slot_limits(self):
        pts = [[0, 0], [1, 0], [1, 1]]
        ok = good_node(zones=[{"kind": "exclusion", "slot": 2, "points": pts}])
        m.validate_model(model_with(ok))
        bad = good_node(zones=[{"kind": "exclusion", "slot": 3, "points": pts}])
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(bad))

    def test_duplicate_zone_slot(self):
        pts = [[0, 0], [1, 0], [1, 1]]
        node = good_node(zones=[{"kind": "zone", "slot": 1, "points": pts}] * 2)
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(node))

    def test_zone_vertex_limit(self):
        pts = [[i, i % 3] for i in range(21)]
        node = good_node(zones=[{"kind": "zone", "slot": 1, "points": pts}])
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(node))

    def test_entry_line_side(self):
        line = {"slot": 1, "p1": [0, 0], "p2": [1, 1], "in_side": "up"}
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(good_node(lines=[line])))

    def test_room_needs_three_points(self):
        with self.assertRaises(m.ModelError):
            m.validate_model(model_with(room={"id": "r", "name": "x", "points": [[0, 0], [1, 1]]}))

    def test_find_node(self):
        model = m.validate_model(model_with(good_node()))
        self.assertEqual(m.find_node(model, "n1")["name"], "Node")
        self.assertIsNone(m.find_node(model, "nope"))


if __name__ == "__main__":
    unittest.main()
