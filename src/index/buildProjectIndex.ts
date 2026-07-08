import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scanProject } from './scanner.js';
import { resolveTypeReferences } from './resolveReferences.js';
import { classifyStereotype } from './classifyStereotype.js';
import { INDEX_SCHEMA_VERSION, serializeIndex, type ClassInfo, type ProjectIndex } from './schema.js';

export async function buildProjectIndex(projectPath: string): Promise<ProjectIndex> {
  const { parsedFiles } = await scanProject(projectPath);
  const resolvedDeclarations = resolveTypeReferences(parsedFiles);

  const classes: ClassInfo[] = resolvedDeclarations.map((declaration) => ({
    fqName: declaration.fqName,
    kind: declaration.kind,
    stereotype: classifyStereotype(declaration),
    dependencies: declaration.dependencies,
    extends: declaration.extends,
    implements: declaration.implements,
    filePath: declaration.filePath,
  }));

  return { schemaVersion: INDEX_SCHEMA_VERSION, classes };
}

export function getIndexFilePath(projectPath: string): string {
  return path.join(path.resolve(projectPath), '.sba', 'index.json');
}

export async function writeIndexFile(projectPath: string, index: ProjectIndex): Promise<string> {
  const outputPath = getIndexFilePath(projectPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializeIndex(index), 'utf-8');
  return outputPath;
}
