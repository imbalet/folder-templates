import assert from "node:assert/strict";
import test from "node:test";

import { renderTemplate } from "../src/template-renderer";

const settings = { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" };
const formatter = (date: Date, format: string): string =>
  `${format}@${date.toISOString()}`;

test("renders core template variables", () => {
  const result = renderTemplate(
    "# {{title}}\n{{date}} {{time}}",
    "Meeting",
    settings,
    new Date("2026-09-05T12:34:56.000Z"),
    formatter,
  );

  assert.equal(
    result,
    "# Meeting\nYYYY-MM-DD@2026-09-05T12:34:56.000Z HH:mm@2026-09-05T12:34:56.000Z",
  );
});

test("supports explicit Moment formats", () => {
  const result = renderTemplate(
    "{{date:DD.MM.YYYY}} {{time:HH:mm:ss}}",
    "Note",
    settings,
    new Date("2026-09-05T12:34:56.000Z"),
    formatter,
  );

  assert.equal(
    result,
    "DD.MM.YYYY@2026-09-05T12:34:56.000Z HH:mm:ss@2026-09-05T12:34:56.000Z",
  );
});

test("leaves unknown variables untouched", () => {
  const result = renderTemplate(
    "{{unknown}} {{title}}",
    "Note",
    settings,
    new Date(),
    formatter,
  );

  assert.equal(result, "{{unknown}} Note");
});
