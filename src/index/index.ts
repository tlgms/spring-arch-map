export {
  INDEX_SCHEMA_VERSION,
  InvalidIndexError,
  serializeIndex,
  deserializeIndex,
  type ClassKind,
  type DependencyReference,
  type ClassInfo,
  type ProjectIndex,
} from './schema.js';
export { scanProject, type ScanResult } from './scanner.js';
