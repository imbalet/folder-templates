# Folder Templates

Automatically apply templates to Markdown files based on their vault-relative paths.

## Rules

Rules are evaluated from top to bottom. A rule contains:

- `Pattern` — a regular expression or glob matched against the full file path;
- `Mode` — `Regex` or `Glob`;
- `Template` — a vault-relative template path, optionally using capture substitutions.

Numeric captures use `{0}`, `{1}`, and so on. `{0}` is the full match. Named regex captures use their name, for example `{subject}`.

Example:

```text
Pattern: ^subjects/(?<subject>[^/]+)/notes/
Mode: Regex
Template: templates/{subject}.md
```

## Template variables

Template files support the same public variables as Obsidian Core Templates:

- `{{title}}` — target note title;
- `{{date}}` — current date;
- `{{time}}` — current time;
- `{{date:DD.MM.YYYY}}` and `{{time:HH:mm:ss}}` — explicit Moment.js formats.

Default date and time formats can be changed in the plugin settings. An explicit format in a variable takes precedence over the defaults.

By default, non-empty files are skipped. When applying a template to a non-empty file is enabled, the rendered template is prepended to the existing content.

## Commands

- Apply to current file, folder, or entire vault;
- Preview current file, folder, or entire vault without modifying files.
