import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createParserForFile } from './treeSitterRuntime.js';

const FIXTURES_DIR = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures');

function listFixtureFiles(language: 'kotlin' | 'java'): string[] {
  const dir = path.join(FIXTURES_DIR, language);
  return readdirSync(dir).map((name) => path.join(dir, name));
}

describe.each([
  ['kotlin' as const, listFixtureFiles('kotlin')],
  ['java' as const, listFixtureFiles('java')],
])('%s 픽스처', (_language, filePaths) => {
  it('픽스처 파일이 최소 3개 존재한다', () => {
    expect(filePaths.length).toBeGreaterThanOrEqual(3);
  });

  it.each(filePaths)('%s가 에러 노드 없이 파싱된다', async (filePath) => {
    const parser = await createParserForFile(filePath);
    expect(parser).not.toBeNull();
    const source = readFileSync(filePath, 'utf-8');
    const tree = parser?.parse(source);
    expect(tree?.rootNode.hasError).toBe(false);
  });
});
