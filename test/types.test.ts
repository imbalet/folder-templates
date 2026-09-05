import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSettings } from "../src/types";

test("normalizes malformed and legacy settings", () => {
  const settings = normalizeSettings({
    enabled: "yes",
    applyMode: "invalid",
    rules: [
      { pattern: "notes/", template: "template.md", mode: "glob" },
      { pattern: "", template: "template.md" },
      null,
    ],
  });

  assert.equal(settings.enabled, true);
  assert.equal(settings.applyMode, "first");
  assert.equal(settings.dateFormat, "YYYY-MM-DD");
  assert.equal(settings.timeFormat, "HH:mm");
  assert.equal(settings.rules.length, 1);
  assert.equal(settings.rules[0].mode, "glob");
  assert.equal(settings.rules[0].name, "Rule 1");
});
