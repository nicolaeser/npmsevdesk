export function developmentVersion(
  baseVersion: string,
  commitDate: string,
  fullSha: string
): string;

export function developmentDistTag(fullSha: string): string;

export function replaceLeadingVersions(
  source: string,
  fromVersion: string,
  toVersion: string,
  count: number
): string;
