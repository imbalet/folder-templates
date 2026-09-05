# Folder Templates

Folder Templates automatically inserts template content into Markdown notes
based on their vault-relative paths. It can run when a new note is created or
be invoked manually for an existing note, folder, or the entire vault.

## Settings and rules

The plugin has these global settings:

- `Enable plugin` turns all automatic and manual processing on or off;
- `Apply automatically` applies a matching template when a Markdown file is
  created;
- `Apply mode` selects the first matching rule or all matching rules;
- `Skip non-empty files` prevents changes to notes that already contain
  content;
- date and time formats configure `{{date}}` and `{{time}}` variables.

Each rule contains a name, an enabled switch, a pattern, a matching mode, and
a vault-relative template path. Rules are checked from top to bottom. When
`Apply mode` is `All matching rules`, matching templates are inserted in rule
order.

### Regex

Regex patterns use JavaScript regular expression syntax. Named and positional
capture groups can be used in the template path:

```text
Pattern: ^courses/(?<course>[^/]+)/(?<topic>[^/]+)/notes/
Mode: Regex
Template: templates/{course}/{topic}.md
```

For `courses/linux/networking/notes/firewall.md`, the resolved template path
is:

```text
templates/linux/networking.md
```

`{0}` is the full match. `{1}`, `{2}`, and so on refer to positional capture
groups. `{course}` and `{topic}` refer to named groups.

### Glob

Glob patterns support:

- `*` — any characters except `/`;
- `**` — any characters, including `/`;
- `?` — exactly one character except `/`.

Examples:

```text
Pattern: projects/*/notes/*.md
Mode: Glob
Template: templates/project-note.md
```

This matches a note directly inside `projects/<project>/notes/`. A pattern
such as `projects/**/README.md` also matches through nested folders.

## Template content

Template files support these variables:

- `{{title}}` — the target note's basename;
- `{{date}}` — the current date;
- `{{time}}` — the current time;
- `{{date:DD.MM.YYYY}}` and `{{time:HH:mm:ss}}` — explicit formats.

For example:

```markdown
---
created: { { date } }
course: { { title } }
---

# {{title}}
```

Non-empty files are skipped by default. If that option is disabled, rendered
template content is prepended to the existing note content.

## Commands and preview

The command palette provides commands to apply templates to the current file,
current folder, or entire vault. Matching can also be previewed for each of
these scopes without changing files.

Preview shows matching rules, resolved template paths, and the action that
would be taken. The `Test` button on a rule accepts a vault-relative path and
shows whether it matches, its captures, and the resolved template path
without changing a note.
