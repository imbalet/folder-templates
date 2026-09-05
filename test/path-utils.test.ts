import assert from "node:assert/strict";
import test from "node:test";

import { filterFilesInFolder } from "../src/path-utils";

const files = [
  { path: "note.md" },
  { path: "notes/one.md" },
  { path: "notes/archive/two.md" },
  { path: "notebook.md" },
];

test("filters nested files and handles the vault root", () => {
  assert.deepEqual(filterFilesInFolder(files, "notes"), [files[1], files[2]]);
  assert.deepEqual(filterFilesInFolder(files, ""), files);
  assert.deepEqual(filterFilesInFolder(files, "/notes/"), [files[1], files[2]]);
});
