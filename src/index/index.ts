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
export {
  resolveTypeReferences,
  stripToBaseTypeName,
  type ResolvedDependency,
  type ResolvedDeclaration,
} from './resolveReferences.js';
export { classifyStereotype, type StereotypeInput } from './classifyStereotype.js';
export {
  buildProjectIndex,
  getIndexFilePath,
  writeIndexFile,
} from './buildProjectIndex.js';
export { summarizeIndex, type IndexSummary } from './summarize.js';
