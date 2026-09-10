import { App, MarkdownView, Modal, Notice, Plugin, TFile } from "obsidian";

import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  type AutomaticTrigger,
  type FolderTemplatesSettings,
} from "./types";

import {
  TemplateOperations,
  summarizeResults,
  type ApplyResult,
} from "./operations";

import { FolderTemplatesSettingTab } from "./settings";
import { filterFilesInFolder } from "./path-utils";

const LOG_PREFIX = "[folder-templates]";

export default class FolderTemplatesPlugin extends Plugin {
  settings: FolderTemplatesSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    console.log(LOG_PREFIX, "loaded", {
      enabled: this.settings.enabled,
      automatic: this.settings.automatic,
      rules: this.settings.rules.length,
    });
    this.addSettingTab(new FolderTemplatesSettingTab(this.app, this));

    this.registerCommands();

    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.vault.on("create", (file) => {
          console.log(LOG_PREFIX, "create", file.path);
          if (!(file instanceof TFile)) {
            return;
          }

          void this.handleAutomatic(file, "create");
        }),
      );
    });
    this.app.workspace.onLayoutReady(() =>
      this.registerEvent(
        this.app.vault.on("rename", (file, oldPath) => {
          if (!(file instanceof TFile)) return;
          const slash = oldPath.lastIndexOf("/");
          const oldParent = slash < 0 ? "" : oldPath.slice(0, slash);
          const newParent = file.parent?.path ?? "";
          if (oldParent !== newParent) return;
          void this.handleAutomatic(file, "rename");
        }),
      ),
    );
  }

  async loadSettings(): Promise<void> {
    const data: unknown = await this.loadData();
    this.settings = normalizeSettings(data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private registerCommands(): void {
    this.addCommand({
      id: "apply-current-file",
      name: "Apply to current file",
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile();

        if (!file) {
          return false;
        }

        if (!checking) {
          void this.applyToFile(file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "apply-current-folder",
      name: "Apply to current folder",
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile();

        if (!file) {
          return false;
        }

        if (!checking) {
          void this.applyToFolder(file.parent?.path ?? "");
        }

        return true;
      },
    });

    this.addCommand({
      id: "apply-entire-vault",
      name: "Apply to entire vault",
      callback: () => {
        void this.applyToVault();
      },
    });

    this.addCommand({
      id: "preview-current-file",
      name: "Preview current file",
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile();

        if (!file) {
          return false;
        }

        if (!checking) {
          void this.previewFiles([file]);
        }

        return true;
      },
    });

    this.addCommand({
      id: "preview-current-folder",
      name: "Preview current folder",
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile();

        if (!file) {
          return false;
        }

        if (!checking) {
          void this.previewFolder(file.parent?.path ?? "");
        }

        return true;
      },
    });

    this.addCommand({
      id: "preview-entire-vault",
      name: "Preview entire vault",
      callback: () => {
        void this.previewFiles(this.app.vault.getMarkdownFiles());
      },
    });
  }

  private async handleAutomatic(
    file: TFile,
    trigger: AutomaticTrigger,
  ): Promise<void> {
    if (!this.settings.enabled) {
      return;
    }

    if (!this.settings.automatic) {
      return;
    }

    if (file.extension !== "md") {
      return;
    }

    if (this.settings.automaticTrigger !== trigger) return;

    if (this.settings.automaticDelayMs > 0)
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, this.settings.automaticDelayMs),
      );

    await this.applyToFile(file);
  }

  private async applyToFile(file: TFile): Promise<void> {
    const operations = new TemplateOperations(this.app, this.settings);

    const result = await operations.applyToFile(file);
    console.log(LOG_PREFIX, "result", file.path, result.reason ?? result.error);
    if (result.applied) {
      new Notice(`Template applied: ${file.path}`);
    } else if (result.error) {
      new Notice(`Template error: ${result.error}`);
    }
  }

  private async applyToFolder(folderPath: string): Promise<void> {
    const operations = new TemplateOperations(this.app, this.settings);

    const results = await operations.applyToFolder(folderPath);

    new Notice(summarizeResults(results));
  }

  private async applyToVault(): Promise<void> {
    const operations = new TemplateOperations(this.app, this.settings);

    const results = await operations.applyToVault();

    new Notice(summarizeResults(results));
  }

  private async previewFolder(folderPath: string): Promise<void> {
    const files = filterFilesInFolder(
      this.app.vault.getMarkdownFiles(),
      folderPath,
    );

    await this.previewFiles(files);
  }

  private async previewFiles(files: TFile[]): Promise<void> {
    const operations = new TemplateOperations(this.app, this.settings);
    const results = await operations.previewToFiles(files);

    new PreviewModal(this.app, results).open();
  }

  private getActiveMarkdownFile(): TFile | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    return view?.file ?? null;
  }
}

class PreviewModal extends Modal {
  constructor(
    app: App,
    private readonly results: ApplyResult[],
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Folder Templates preview" });

    if (this.results.length === 0) {
      this.contentEl.createEl("p", { text: "No Markdown files found." });
      return;
    }

    for (const result of this.results) {
      const item = this.contentEl.createDiv({
        cls: "folder-templates-preview-item",
      });
      item.createEl("h3", { text: result.file.path });

      if (result.error) {
        item.createEl("p", { text: `Error: ${result.error}` });
        continue;
      }

      if (result.rules?.length) {
        item.createEl("p", { text: `Rules: ${result.rules.join(", ")}` });
      }

      if (result.template) {
        item.createEl("p", { text: `Templates: ${result.template}` });
      }

      item.createEl("p", { text: `Status: ${result.reason ?? "ready"}` });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
