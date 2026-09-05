import {
  App,
  Modal,
  PluginSettingTab,
  Setting,
  TextComponent,
  ToggleComponent,
  type SettingDefinitionItem,
} from "obsidian";

import { matchPath, substitute } from "obsidian-path-matcher";

import type FolderTemplatesPlugin from "./main";
import type { TemplateRule } from "./types";

export class FolderTemplatesSettingTab extends PluginSettingTab {
  plugin: FolderTemplatesPlugin;
  private readonly openRuleIds = new Set<string>();

  constructor(app: App, plugin: FolderTemplatesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        heading: "Folder Templates",
        items: [
          {
            name: "Folder Templates settings",
            desc: "Configure automatic template rules.",
            render: (setting) => {
              setting.settingEl.empty();
              this.renderGeneralSettings(setting.settingEl);
              this.renderRules(setting.settingEl);
            },
          },
        ],
      },
    ];
  }

  display(): void {
    const { containerEl } = this;

    this.captureOpenRules();
    containerEl.empty();

    new Setting(containerEl).setName("Folder Templates").setHeading();

    this.renderGeneralSettings(containerEl);
    this.renderRules(containerEl);
  }

  private captureOpenRules(): void {
    for (const details of Array.from(
      this.containerEl.querySelectorAll<HTMLDetailsElement>(
        "details[data-rule-id]",
      ),
    )) {
      const id = details.dataset.ruleId;

      if (!id) {
        continue;
      }

      if (details.open) {
        this.openRuleIds.add(id);
      } else {
        this.openRuleIds.delete(id);
      }
    }
  }

  private renderGeneralSettings(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("General").setHeading();

    new Setting(containerEl)
      .setName("Enable plugin")
      .setDesc("Enable or disable Folder Templates.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabled)
          .onChange(async (value) => {
            this.plugin.settings.enabled = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Apply automatically")
      .setDesc("Apply matching templates when a new Markdown file is created.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.automatic)
          .onChange(async (value) => {
            this.plugin.settings.automatic = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Apply mode")
      .setDesc(
        "Choose whether to apply the first matching rule or all matching rules.",
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption("first", "First matching rule")
          .addOption("all", "All matching rules")
          .setValue(this.plugin.settings.applyMode)
          .onChange(async (value) => {
            this.plugin.settings.applyMode = value === "all" ? "all" : "first";

            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Skip non-empty files")
      .setDesc("Do not apply templates to files that already contain content.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.skipNonEmptyFiles)
          .onChange(async (value) => {
            this.plugin.settings.skipNonEmptyFiles = value;

            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Date format")
      .setDesc("Default Moment.js format used by {{date}}.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value || "YYYY-MM-DD";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Time format")
      .setDesc("Default Moment.js format used by {{time}}.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.timeFormat)
          .onChange(async (value) => {
            this.plugin.settings.timeFormat = value || "HH:mm";
            await this.plugin.saveSettings();
          }),
      );
  }

  private renderRules(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Rules").setHeading();

    containerEl.createEl("p", {
      text: "Rules are checked from top to bottom.",
      cls: "setting-item-description",
    });

    if (this.plugin.settings.rules.length === 0) {
      containerEl.createEl("p", {
        text: "No rules configured yet.",
        cls: "setting-item-description",
      });
    }

    for (const [index, rule] of this.plugin.settings.rules.entries()) {
      this.renderRule(containerEl, rule, index);
    }

    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText("Add rule")
        .setCta()
        .onClick(async () => {
          const number = this.plugin.settings.rules.length + 1;

          const rule: TemplateRule = {
            id: crypto.randomUUID(),
            name: `Rule ${number} `,
            enabled: true,
            pattern: "^notes/",
            mode: "regex",
            template: "templates/note.md",
          };

          this.plugin.settings.rules.push(rule);
          this.openRuleIds.add(rule.id);

          await this.plugin.saveSettings();
          this.display();
        }),
    );
  }

  private renderRule(
    containerEl: HTMLElement,
    rule: TemplateRule,
    index: number,
  ): void {
    const ruleContainer = containerEl.createEl("details", {
      cls: "folder-templates-rule",
    });
    ruleContainer.dataset.ruleId = rule.id;

    const header = ruleContainer.createEl("summary", {
      cls: "folder-templates-rule-header",
    });

    const headerLeft = header.createDiv({
      cls: "folder-templates-rule-header-left",
    });

    const collapseIcon = headerLeft.createSpan({
      cls: "folder-templates-rule-collapse",
      text: "▾",
    });

    const nameInput = new TextComponent(headerLeft);

    nameInput.setValue(rule.name).setPlaceholder(`Rule ${index + 1}`);

    nameInput.inputEl.addClass("folder-templates-rule-name");

    nameInput.onChange(async (value) => {
      rule.name = value.trim() || `Rule ${index + 1}`;

      await this.plugin.saveSettings();
    });

    const enabled = new ToggleComponent(header);

    enabled.setValue(rule.enabled).onChange(async (value) => {
      rule.enabled = value;
      await this.plugin.saveSettings();
    });

    const body = ruleContainer.createDiv({
      cls: "folder-templates-rule-body",
    });

    // Pattern
    new Setting(body).setName("Pattern").addText((text) =>
      text
        .setPlaceholder("^subjects/(?<subject>[^/]+)/notes/")
        .setValue(rule.pattern)
        .onChange(async (value) => {
          rule.pattern = value;
          await this.plugin.saveSettings();
        }),
    );

    // Mode
    new Setting(body).setName("Mode").addDropdown((dropdown) =>
      dropdown
        .addOption("regex", "Regex")
        .addOption("glob", "Glob")
        .setValue(rule.mode)
        .onChange(async (value) => {
          rule.mode = value === "glob" ? "glob" : "regex";

          await this.plugin.saveSettings();
        }),
    );

    // Template
    new Setting(body).setName("Template").addText((text) =>
      text
        .setPlaceholder("templates/note.md")
        .setValue(rule.template)
        .onChange(async (value) => {
          rule.template = value;
          await this.plugin.saveSettings();
        }),
    );

    // Buttons
    new Setting(body)
      .addButton((button) =>
        button.setButtonText("Test").onClick(() => {
          new RuleTestModal(this.app, rule).open();
        }),
      )
      .addButton((button) =>
        button.setButtonText("Duplicate").onClick(async () => {
          const copy: TemplateRule = {
            ...rule,
            id: crypto.randomUUID(),
            name: `${rule.name} copy`,
          };

          this.plugin.settings.rules.splice(index + 1, 0, copy);
          this.openRuleIds.add(copy.id);

          await this.plugin.saveSettings();
          this.display();
        }),
      )
      .addButton((button) =>
        button
          .setButtonText("Delete")
          .setDestructive()
          .onClick(async () => {
            this.plugin.settings.rules = this.plugin.settings.rules.filter(
              (item) => item.id !== rule.id,
            );
            this.openRuleIds.delete(rule.id);

            await this.plugin.saveSettings();
            this.display();
          }),
      );
    ruleContainer.addEventListener("toggle", () => {
      collapseIcon.setText(ruleContainer.open ? "▾" : "▸");
    });

    ruleContainer.open = this.openRuleIds.has(rule.id);
  }
}

class RuleTestModal extends Modal {
  private readonly rule: TemplateRule;

  private pathInput!: HTMLInputElement;
  private resultEl!: HTMLElement;

  constructor(app: App, rule: TemplateRule) {
    super(app);
    this.rule = rule;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.empty();

    contentEl.createEl("h2", {
      text: `Test rule: ${this.rule.name} `,
    });

    new Setting(contentEl)
      .setName("Path")
      .setDesc("Enter a vault-relative path to test.")
      .addText((text) => {
        this.pathInput = text.inputEl;

        text.setPlaceholder("subjects/linux/notes/network.md").onChange(() => {
          this.runTest();
        });
      });

    this.resultEl = contentEl.createDiv({
      cls: "folder-templates-test-result",
    });

    this.runTest();
  }

  private runTest(): void {
    const path = this.pathInput.value.trim();

    this.resultEl.empty();

    if (!path) {
      this.resultEl.createEl("p", {
        text: "Enter a path to test.",
      });

      return;
    }

    try {
      const match = matchPath(path, this.rule.pattern, this.rule.mode);

      if (!match.matched) {
        this.resultEl.createEl("h3", {
          text: "✗ Not matched",
        });

        this.resultEl.createEl("p", {
          text: "The pattern does not match this path.",
        });

        return;
      }

      this.resultEl.createEl("h3", {
        text: "✓ Matched",
      });

      this.renderValue(this.resultEl, "Full match", match.fullMatch ?? "");

      if (match.groups.length > 0) {
        const captures = this.resultEl.createDiv();

        captures.createEl("strong", {
          text: "Captures",
        });

        for (const [index, value] of match.groups.entries()) {
          this.renderValue(captures, `{${index + 1} } `, value);
        }
      }

      const namedGroups = Object.entries(match.namedGroups);

      if (namedGroups.length > 0) {
        const named = this.resultEl.createDiv();

        named.createEl("strong", {
          text: "Named captures",
        });

        for (const [name, value] of namedGroups) {
          this.renderValue(named, `{${name}}`, value);
        }
      }

      const resolvedTemplate = substitute(this.rule.template, match);

      this.renderValue(this.resultEl, "Resolved template", resolvedTemplate);

      const templateFile = this.app.vault.getAbstractFileByPath(
        resolvedTemplate.replace(/\\/g, "/"),
      );

      this.renderValue(
        this.resultEl,
        "Template file",
        templateFile ? "✓ Found" : "✗ Not found",
      );
    } catch (error) {
      this.resultEl.createEl("h3", {
        text: "✗ Error",
      });

      this.resultEl.createEl("p", {
        text: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private renderValue(
    parent: HTMLElement,
    name: string,
    value: string | undefined,
  ): void {
    new Setting(parent).setName(name).setDesc(value ?? "");
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
