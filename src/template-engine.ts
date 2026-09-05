import { App, moment, TFile } from "obsidian";

import { renderTemplate } from "./template-renderer";
import type { FolderTemplatesSettings } from "./types";

export class TemplateEngine {
  constructor(
    private readonly app: App,
    private readonly settings: Pick<
      FolderTemplatesSettings,
      "dateFormat" | "timeFormat"
    >,
  ) {}

  async loadTemplate(path: string): Promise<string> {
    const normalized = path.replace(/\\/g, "/");

    const file = this.app.vault.getAbstractFileByPath(normalized);

    if (!(file instanceof TFile)) {
      throw new Error(`Template file not found: ${normalized}`);
    }

    return this.app.vault.read(file);
  }

  render(template: string, target: TFile, now = new Date()): string {
    return renderTemplate(
      template,
      target.basename,
      this.settings,
      now,
      (date, format) =>
        (
          moment as unknown as (value: Date) => {
            format: (value: string) => string;
          }
        )(date).format(format),
    );
  }
}
