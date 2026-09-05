import { App, moment, TFile } from "obsidian";

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

  render(
    template: string,
    target: TFile,
    now = new Date(),
  ): string {
    return template.replace(
      /\{\{(title|date|time)(?::([^}]+))?\}\}/g,
      (_, variable: string, format?: string) => {
        if (variable === "title") {
          return target.basename;
        }

        const defaultFormat =
          variable === "date"
            ? this.settings.dateFormat
            : this.settings.timeFormat;

        return (moment as unknown as (value: Date) => { format: (value: string) => string })(
          now,
        ).format(format || defaultFormat);
      },
    );
  }

}
