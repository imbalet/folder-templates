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
  dateFormat: string;
  timeFormat: string;
  rules: TemplateRule[];
}

export const DEFAULT_SETTINGS: FolderTemplatesSettings = {
  enabled: true,
  automatic: true,
  applyMode: "first",
  skipNonEmptyFiles: true,
  dateFormat: "YYYY-MM-DD",
  timeFormat: "HH:mm",
  rules: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSettings(data: unknown): FolderTemplatesSettings {
  const source = isRecord(data) ? data : {};
  const rawRules = Array.isArray(source.rules) ? source.rules : [];

  return {
    enabled:
      typeof source.enabled === "boolean"
        ? source.enabled
        : DEFAULT_SETTINGS.enabled,
    automatic:
      typeof source.automatic === "boolean"
        ? source.automatic
        : DEFAULT_SETTINGS.automatic,
    applyMode: source.applyMode === "all" ? "all" : "first",
    skipNonEmptyFiles:
      typeof source.skipNonEmptyFiles === "boolean"
        ? source.skipNonEmptyFiles
        : DEFAULT_SETTINGS.skipNonEmptyFiles,
    dateFormat:
      typeof source.dateFormat === "string" && source.dateFormat.length > 0
        ? source.dateFormat
        : DEFAULT_SETTINGS.dateFormat,
    timeFormat:
      typeof source.timeFormat === "string" && source.timeFormat.length > 0
        ? source.timeFormat
        : DEFAULT_SETTINGS.timeFormat,
    rules: rawRules.flatMap((value, index) => {
      if (!isRecord(value)) {
        return [];
      }

      const pattern = typeof value.pattern === "string" ? value.pattern : "";
      const template = typeof value.template === "string" ? value.template : "";

      if (!pattern || !template) {
        return [];
      }

      return [
        {
          id:
            typeof value.id === "string" && value.id
              ? value.id
              : `rule-${index + 1}`,
          name:
            typeof value.name === "string" && value.name.trim()
              ? value.name.trim()
              : `Rule ${index + 1}`,
          enabled: typeof value.enabled === "boolean" ? value.enabled : true,
          pattern,
          mode: value.mode === "glob" ? "glob" : "regex",
          template,
        },
      ];
    }),
  };
}
