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

    if (this.settings.skipNonEmptyFiles) {
      const content = await this.app.vault.read(file);

      if (content.trim().length > 0) {
        return {
          file,
          applied: false,
          skipped: true,
          reason: "non-empty",
        };
      }
    }

    try {
      let first = true;

      for (const resolved of selected) {
        const templatePath = ruleEngine.resolveTemplatePath(
          resolved.rule.template,
          resolved,
        );

        const content = await this.templateEngine.loadTemplate(templatePath);

        await this.app.vault.process(file, (current) => {
          let result = current;

          if (!first) {
            result += "\n";
          }

          result += content;

          first = false;

          return result;
        });
      }

      return {
        file,
        applied: true,
        skipped: false,
        template: selected.map((x) => x.rule.template).join(", "),
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

  async applyToVault(): Promise<ApplyResult[]> {
    return this.applyToFiles(this.app.vault.getMarkdownFiles());
  }

  async applyToFolder(folderPath: string): Promise<ApplyResult[]> {
    const prefix = folderPath.replace(/\/+$/, "") + "/";

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
