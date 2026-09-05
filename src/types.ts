export type MatchMode = "regex" | "glob";

export type ApplyMode = "first" | "all";

export interface TemplateRule {
  id: string;
  name: string;
  enabled: boolean;
  pattern: string;
  mode: MatchMode;
  template: string;
}

export interface FolderTemplatesSettings {
  enabled: boolean;
  automatic: boolean;
  applyMode: ApplyMode;
  skipNonEmptyFiles: boolean;
  rules: TemplateRule[];
}

export const DEFAULT_SETTINGS: FolderTemplatesSettings = {
  enabled: true,
  automatic: true,
  applyMode: "first",
  skipNonEmptyFiles: true,
  rules: [],
};
