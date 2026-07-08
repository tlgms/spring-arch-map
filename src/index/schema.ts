export type ClassKind = 'class' | 'interface' | 'enum';

export interface DependencyReference {
  name: string;
  rawType: string;
  resolvedFqName: string | null;
}

export interface ClassInfo {
  fqName: string;
  kind: ClassKind;
  stereotype: string | null;
  dependencies: DependencyReference[];
  extends: string | null;
  implements: string[];
  filePath: string;
}

export const INDEX_SCHEMA_VERSION = 1;

export interface ProjectIndex {
  schemaVersion: number;
  classes: ClassInfo[];
}

export class InvalidIndexError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'InvalidIndexError';
  }
}

function isClassKind(value: unknown): value is ClassKind {
  return value === 'class' || value === 'interface' || value === 'enum';
}

function isDependencyReference(value: unknown): value is DependencyReference {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.rawType === 'string' &&
    (candidate.resolvedFqName === null || typeof candidate.resolvedFqName === 'string')
  );
}

function isClassInfo(value: unknown): value is ClassInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.fqName === 'string' &&
    isClassKind(candidate.kind) &&
    (candidate.stereotype === null || typeof candidate.stereotype === 'string') &&
    Array.isArray(candidate.dependencies) &&
    candidate.dependencies.every(isDependencyReference) &&
    (candidate.extends === null || typeof candidate.extends === 'string') &&
    Array.isArray(candidate.implements) &&
    candidate.implements.every((item) => typeof item === 'string') &&
    typeof candidate.filePath === 'string'
  );
}

function isProjectIndex(value: unknown): value is ProjectIndex {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.schemaVersion === 'number' &&
    Array.isArray(candidate.classes) &&
    candidate.classes.every(isClassInfo)
  );
}

export function serializeIndex(index: ProjectIndex): string {
  return JSON.stringify(index, null, 2);
}

export function deserializeIndex(json: string): ProjectIndex {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (cause) {
    throw new InvalidIndexError('인덱스 JSON 파싱에 실패했습니다.', { cause });
  }
  if (!isProjectIndex(parsed)) {
    throw new InvalidIndexError('인덱스 파일 형식이 올바르지 않습니다.');
  }
  return parsed;
}
