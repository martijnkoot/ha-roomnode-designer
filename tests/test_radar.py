"""Radar detection rules. Loads radar.py directly so Home Assistant is not required."""

import importlib.util
import pathlib
import unittest

_PATH = pathlib.Path(__file__).parents[1] / "custom_components" / "roomnode_designer" / "radar.py"
_spec = importlib.util.spec_from_file_location("rd_radar", _PATH)
r = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r)


class ValidateTests(unittest.TestCase):
    def test_side_defaults_are_valid(self):
        self.assertEqual(r.validate_detection("side", 6.0, -60, 60), [])

    def test_side_limits_follow_the_firmware(self):
        self.assertTrue(r.validate_detection("side", 6.1, -60, 60))   # too far
        self.assertTrue(r.validate_detection("side", 3, -61, 60))     # start below -60
        self.assertTrue(r.validate_detection("side", 3, -60, 61))     # end above 60
        self.assertTrue(r.validate_detection("side", 3, 10, 10))      # start == end
        self.assertTrue(r.validate_detection("side", 0.05, -60, 60))  # too close
        self.assertEqual(r.validate_detection("side", 3, -30, 45), [])  # asymmetric is fine

    def test_top_limits_follow_the_firmware(self):
        self.assertEqual(r.validate_detection("top", 4.0, 0, 360), [])
        self.assertEqual(r.validate_detection("top", 2.5, 90, 270), [])
        self.assertTrue(r.validate_detection("top", 4.1, 0, 360))     # shorter max than side
        self.assertTrue(r.validate_detection("top", 3, -10, 360))     # no negative angles
        self.assertTrue(r.validate_detection("top", 3, 0, 361))

    def test_side_values_are_wrong_in_top_mode(self):
        self.assertTrue(r.validate_detection("top", 6.0, -60, 60))

    def test_unknown_mode(self):
        self.assertTrue(r.validate_detection("diagonal", 3, 0, 90))

    def test_mounting_mapping(self):
        self.assertEqual(r.mode_for_mounting("wall"), "side")
        self.assertEqual(r.mode_for_mounting("ceiling"), "top")
        self.assertEqual(r.default_angles("ceiling"), (0.0, 360.0))
        self.assertEqual(r.default_angles("wall"), (-60.0, 60.0))


class WriteOrderTests(unittest.TestCase):
    def test_widening_writes_start_first(self):
        self.assertEqual(r.write_order(60, -60), ["start", "end"])

    def test_moving_past_current_end_writes_end_first(self):
        # device has -60..-30, new range is 0..60: setting start=0 first would exceed end=-30
        self.assertEqual(r.write_order(-30, 0), ["end", "start"])

    def test_unknown_current_end(self):
        self.assertEqual(r.write_order(None, 0), ["start", "end"])

    def test_differs(self):
        self.assertTrue(r.differs(None, 1.0))
        self.assertFalse(r.differs(1.0, 1.01))
        self.assertTrue(r.differs(1.0, 1.2))


if __name__ == "__main__":
    unittest.main()
