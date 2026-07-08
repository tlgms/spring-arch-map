import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { detectLanguageFromPath, parseFile, type ParsedFile } from '../parser/index.js';

const IGNORED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.gradle',
  '.idea',
  '.sba',
  'build',
  'out',
  'target',
  'dist',
]);

const SOURCE_DIR_NAMES = new Set(['kotlin', 'java']);

export interface ScanResult {
  sourceRoots: string[];
  parsedFiles: ParsedFile[];
}

async function findSourceRoots(currentDir: string): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const roots: string[] = [];
  const isMainDir = path.basename(currentDir) === 'main' && path.basename(path.dirname(currentDir)) === 'src';

  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIR_NAMES.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(currentDir, entry.name);
    if (isMainDir && SOURCE_DIR_NAMES.has(entry.name)) {
      roots.push(fullPath);
      continue;
    }
    roots.push(...(await findSourceRoots(fullPath)));
  }
  return roots;
}

async function collectSourceFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
    } else if (entry.isFile() && detectLanguageFromPath(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function scanProject(projectPath: string): Promise<ScanResult> {
  const resolvedRoot = path.resolve(projectPath);

  let stats;
  try {
    stats = await stat(resolvedRoot);
  } catch (cause) {
    throw new Error(`프로젝트 경로를 찾을 수 없습니다: ${resolvedRoot}`, { cause });
  }
  if (!stats.isDirectory()) {
    throw new Error(`프로젝트 경로가 디렉터리가 아닙니다: ${resolvedRoot}`);
  }

  const sourceRoots = await findSourceRoots(resolvedRoot);
  const parsedFiles: ParsedFile[] = [];
  for (const sourceRoot of sourceRoots) {
    const files = await collectSourceFiles(sourceRoot);
    for (const file of files) {
      const parsed = await parseFile(file);
      if (parsed) {
        parsedFiles.push(parsed);
      }
    }
  }

  return { sourceRoots, parsedFiles };
}
