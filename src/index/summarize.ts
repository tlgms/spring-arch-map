import type { ProjectIndex } from './schema.js';

export interface IndexSummary {
  totalClasses: number;
  byStereotype: Record<string, number>;
}

const UNCLASSIFIED_LABEL = 'Unclassified';

export function summarizeIndex(index: ProjectIndex): IndexSummary {
  const byStereotype: Record<string, number> = {};
  for (const classInfo of index.classes) {
    const label = classInfo.stereotype ?? UNCLASSIFIED_LABEL;
    byStereotype[label] = (byStereotype[label] ?? 0) + 1;
  }
  return { totalClasses: index.classes.length, byStereotype };
}
