export interface VaultPathEntry {
  path: string;
}

export function filterFilesInFolder<T extends VaultPathEntry>(
  files: readonly T[],
  folderPath: string,
): T[] {
  const normalizedFolder = folderPath.replace(/^\/+|\/+$/g, "");
  const prefix = normalizedFolder ? `${normalizedFolder}/` : "";

  return files.filter((file) => file.path.startsWith(prefix));
}
