import { App, Notice, TFile } from "obsidian";

import { TemplateRuleEngine } from "./rule-engine";

import { TemplateEngine } from "./template-engine";

import type { FolderTemplatesSettings } from "./types";

export interface ApplyResult {
  file: TFile;
  applied: boolean;
  skipped: boolean;
  reason?: string;
  template?: string;
  rules?: string[];
  error?: string;
}

export class TemplateOperations {
  private readonly templateEngine: TemplateEngine;

  constructor(
    private readonly app: App,
    private readonly settings: FolderTemplatesSettings,
  ) {
    this.templateEngine = new TemplateEngine(app, settings);
  }

  private createRuleEngine(): TemplateRuleEngine {
    return new TemplateRuleEngine(this.settings.rules);
  }

  async applyToFile(file: TFile): Promise<ApplyResult> {
    if (file.extension !== "md") {
      return {
        file,
        applied: false,
        skipped: true,
        reason: "not-markdown",
      };
    }

    if (!this.settings.enabled) {
      return {
        file,
        applied: false,
        skipped: true,
        reason: "disabled",
      };
    }

    try {
      const ruleEngine = this.createRuleEngine();
      const matches = ruleEngine.match(file.path);

      if (matches.length === 0) {
        return {
          file,
          applied: false,
          skipped: true,
          reason: "no-rule",
        };
      }

      const selected =
        this.settings.applyMode === "first" ? [matches[0]] : matches;

      const paths = selected.map((resolved) =>
        ruleEngine.resolveTemplatePath(resolved.rule.template, resolved),
      );

      if (paths.some((path) => path.replace(/\\/g, "/") === file.path)) {
        return {
          file,
          applied: false,
          skipped: true,
          reason: "template-file",
        };
      }

      const templates = await Promise.all(
        paths.map(async (path) => {
          return {
            path,
            content: await this.templateEngine.loadTemplate(path),
          };
        }),
      );

      let skipped = false;
      let applied = false;

      await this.app.vault.process(file, (current) => {
        if (this.settings.skipNonEmptyFiles && current.trim().length > 0) {
          skipped = true;
          return current;
        }

        const now = new Date();
        const rendered = templates.map(({ content }) =>
          this.templateEngine.render(content, file, now),
        );
        const prefix = rendered.join("\n");

        applied = true;

        return current.length > 0 ? `${prefix}\n${current}` : prefix;
      });

      if (skipped) {
        return {
          file,
          applied: false,
          skipped: true,
          reason: "non-empty",
        };
      }

      return {
        file,
        applied,
        skipped: false,
        template: templates.map((template) => template.path).join(", "),
      };
    } catch (error) {
      return {
        file,
        applied: false,
        skipped: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async applyToFiles(files: TFile[]): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];

    for (const file of files) {
      results.push(await this.applyToFile(file));
    }

    return results;
  }

  async previewToFile(file: TFile): Promise<ApplyResult> {
    if (file.extension !== "md") {
      return { file, applied: false, skipped: true, reason: "not-markdown" };
    }

    if (!this.settings.enabled) {
      return { file, applied: false, skipped: true, reason: "disabled" };
    }

    try {
      const ruleEngine = this.createRuleEngine();
      const matches = ruleEngine.match(file.path);

      if (matches.length === 0) {
        return { file, applied: false, skipped: true, reason: "no-rule" };
      }

      const selected =
        this.settings.applyMode === "first" ? [matches[0]] : matches;
      const paths = selected.map((resolved) =>
        ruleEngine.resolveTemplatePath(resolved.rule.template, resolved),
      );

      if (paths.some((path) => path.replace(/\\/g, "/") === file.path)) {
        return {
          file,
          applied: false,
          skipped: true,
          reason: "template-file",
          template: paths.join(", "),
        };
      }

      await Promise.all(
        paths.map((path) => this.templateEngine.loadTemplate(path)),
      );

      const content = await this.app.vault.read(file);

      return {
        file,
        applied: false,
        skipped: this.settings.skipNonEmptyFiles && content.trim().length > 0,
        reason:
          this.settings.skipNonEmptyFiles && content.trim().length > 0
            ? "non-empty"
            : "ready",
        template: paths.join(", "),
        rules: selected.map((resolved) => resolved.rule.name),
      };
    } catch (error) {
      return {
        file,
        applied: false,
        skipped: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async previewToFiles(files: TFile[]): Promise<ApplyResult[]> {
    return Promise.all(files.map((file) => this.previewToFile(file)));
  }

  async applyToVault(): Promise<ApplyResult[]> {
    return this.applyToFiles(this.app.vault.getMarkdownFiles());
  }

  async applyToFolder(folderPath: string): Promise<ApplyResult[]> {
    const normalizedFolder = folderPath.replace(/^\/+|\/+$/g, "");
    const prefix = normalizedFolder ? `${normalizedFolder}/` : "";

    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => file.path.startsWith(prefix));

    return this.applyToFiles(files);
  }
}

export function summarizeResults(results: ApplyResult[]): string {
  const applied = results.filter((x) => x.applied).length;

  const skipped = results.filter((x) => x.skipped).length;

  const errors = results.filter((x) => x.error).length;

  return [
    `Applied: ${applied}`,
    `Skipped: ${skipped}`,
    `Errors: ${errors}`,
  ].join(" • ");
}
