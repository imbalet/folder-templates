import {
  App,
  PluginSettingTab,
  Setting,
} from "obsidian";

import type FolderTemplatesPlugin from "./main";

export class FolderTemplatesSettingTab
  extends PluginSettingTab {

  plugin: FolderTemplatesPlugin;

  constructor(
    app: App,
    plugin: FolderTemplatesPlugin,
  ) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", {
      text: "Folder Templates",
    });

    new Setting(containerEl)
      .setName("Enable plugin")
      .setDesc(
        "Enable or disable template processing.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings.enabled,
          )
          .onChange(async (value) => {
            this.plugin.settings.enabled =
              value;

            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Apply automatically")
      .setDesc(
        "Automatically apply a template when a new Markdown file is created.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings.automatic,
          )
          .onChange(async (value) => {
            this.plugin.settings.automatic =
              value;

            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Apply mode")
      .setDesc(
        "Choose whether to apply only the first matching rule or every matching rule.",
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOption(
            "first",
            "First matching rule",
          )
          .addOption(
            "all",
            "All matching rules",
          )
          .setValue(
            this.plugin.settings.applyMode,
          )
          .onChange(async (value) => {
            this.plugin.settings.applyMode =
              value === "all"
                ? "all"
                : "first";

            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Skip non-empty files")
      .setDesc(
        "Do not automatically apply templates to files that already contain content.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings
              .skipNonEmptyFiles,
          )
          .onChange(async (value) => {
            this.plugin.settings
              .skipNonEmptyFiles = value;

            await this.plugin.saveSettings();
          }),
      );


    containerEl.createEl("h3", {
      text: "Rules",
    });

    if (
      this.plugin.settings.rules.length === 0
    ) {
      containerEl.createEl("p", {
        text: "No rules configured.",
      });
    }

    for (
      const rule of this.plugin.settings.rules
    ) {
      const ruleContainer =
        containerEl.createDiv({
          cls: "folder-templates-rule",
        });

      new Setting(ruleContainer)
        .setName(rule.id)
        .addToggle((toggle) =>
          toggle
            .setValue(rule.enabled)
            .onChange(async (value) => {
              rule.enabled = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(ruleContainer)
        .setName("Pattern")
        .addText((text) =>
          text
            .setPlaceholder(
              "^subjects/(?<subject>[^/]+)/notes/",
            )
            .setValue(rule.pattern)
            .onChange(async (value) => {
              rule.pattern = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(ruleContainer)
        .setName("Mode")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("regex", "Regex")
            .addOption("glob", "Glob")
            .setValue(rule.mode)
            .onChange(async (value) => {
              rule.mode =
                value === "glob"
                  ? "glob"
                  : "regex";

              await this.plugin.saveSettings();
            }),
        );

      new Setting(ruleContainer)
        .setName("Template")
        .addText((text) =>
          text
            .setPlaceholder(
              "templates/note.md",
            )
            .setValue(rule.template)
            .onChange(async (value) => {
              rule.template = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(ruleContainer)
        .addButton((button) =>
          button
            .setButtonText("Delete")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.rules =
                this.plugin.settings.rules.filter(
                  (item) =>
                    item.id !== rule.id,
                );

              await this.plugin.saveSettings();
              this.display();
            }),
        );
    }

    new Setting(containerEl)
      .addButton((button) =>
        button
          .setButtonText("Add rule")
          .setCta()
          .onClick(async () => {
            this.plugin.settings.rules.push({
              id: crypto.randomUUID(),
              enabled: true,
              pattern: "^notes/",
              mode: "regex",
              template: "templates/note.md",
            });

            await this.plugin.saveSettings();
            this.display();
          }),
      );
  }
}