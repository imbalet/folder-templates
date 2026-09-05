import {
  App,
  TFile,
} from "obsidian";

export class TemplateEngine {
  constructor(
    private readonly app: App,
  ) { }

  async loadTemplate(path: string): Promise<string> {
    const normalized =
      path.replace(/\\/g, "/");

    const file =
      this.app.vault.getAbstractFileByPath(normalized);

    if (!(file instanceof TFile)) {
      throw new Error(
        `Template file not found: ${normalized}`,
      );
    }

    return this.app.vault.read(file);
  }

  async apply(
    target: TFile,
    templatePath: string,
  ): Promise<void> {
    const template =
      await this.loadTemplate(templatePath);

    await this.app.vault.process(
      target,
      (content) => {
        return this.renderTemplate(
          template,
          target,
          content,
        );
      },
    );
  }

  private renderTemplate(
    template: string,
    target: TFile,
    currentContent: string,
  ): string {
    const now = new Date();

    const title =
      target.basename;

    const date =
      this.formatDate(now);

    const time =
      this.formatTime(now);

    let result = template
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{date\}\}/g, date)
      .replace(/\{\{time\}\}/g, time);

    /*
     * We intentionally do not erase the target
     * content here.
     *
     * Template application happens only when the
     * operation decides that the file is safe to modify.
     */

    if (currentContent.length > 0) {
      return result + "\n" + currentContent;
    }

    return result;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}