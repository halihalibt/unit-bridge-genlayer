"""Offline revision and conversion tests using fixture classifications."""

from pathlib import Path
from types import SimpleNamespace
import json
import unittest


class Rejected(Exception):
    pass


class MappingTest(unittest.TestCase):
    def setUp(self):
        self.reply = '["POINT","DELTA"]'
        self.message = SimpleNamespace(sender_address="steward")
        gl = SimpleNamespace(
            Contract=object, message=self.message,
            vm=SimpleNamespace(UserError=Rejected),
            public=SimpleNamespace(write=lambda fn: fn, view=lambda fn: fn),
            eq_principle=SimpleNamespace(strict_eq=lambda fn: fn()),
            nondet=SimpleNamespace(exec_prompt=lambda _: self.reply),
        )
        path = Path(__file__).resolve().parents[1] / "contracts/unit_bridge.py"
        source = path.read_text().replace("from genlayer import *", "")
        namespace = {"gl": gl, "Address": str, "TreeMap": dict, "u256": int}
        exec(compile(source, str(path), "exec"), namespace)
        self.contract = namespace["UnitBridge"]()
        self.contract.records = {}

    def propose(self, unit="F"):
        self.contract.propose("Observed air temperature", "Temperature change since last observation", unit, "K")

    def state(self, revision):
        return json.loads(self.contract.get_revision(revision))["state"]

    def test_activation_retires_predecessor_and_invalidates_siblings(self):
        self.propose()
        self.contract.qualify(1)
        self.contract.activate(1)
        self.propose("K")
        self.propose("C")
        self.contract.qualify(2)
        self.contract.qualify(3)
        self.contract.activate(2)
        self.assertEqual(self.state(1), "RETIRED")
        self.assertEqual(self.contract.convert(273150, -1000), [2, 0, 1, -1000, 1])
        with self.assertRaisesRegex(Rejected, "revision not activatable"):
            self.contract.activate(3)

    def test_unresolved_classification_blocks_activation(self):
        self.propose()
        self.reply = '["UNKNOWN","DELTA"]'
        self.contract.qualify(1)
        self.assertEqual(self.state(1), "BLOCKED")
        with self.assertRaisesRegex(Rejected, "revision not activatable"):
            self.contract.activate(1)
