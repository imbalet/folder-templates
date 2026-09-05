import type { FolderTemplatesSettings } from "./types";

export type DateFormatter = (date: Date, format: string) => string;

export function renderTemplate(
  template: string,
  title: string,
  settings: Pick<FolderTemplatesSettings, "dateFormat" | "timeFormat">,
  now: Date,
  formatDate: DateFormatter,
): string {
  return template.replace(
    /\{\{(title|date|time)(?::([^}]+))?\}\}/g,
    (_, variable: string, format?: string) => {
      if (variable === "title") {
        return title;
      }

      const defaultFormat =
        variable === "date" ? settings.dateFormat : settings.timeFormat;

      return formatDate(now, format || defaultFormat);
    },
  );
}
