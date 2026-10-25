export function developmentVersion(commitDate: string, fullSha: string): string;

export function replaceLeadingVersions(
  source: string,
  fromVersion: string,
  toVersion: string,
  count: number
): string;
