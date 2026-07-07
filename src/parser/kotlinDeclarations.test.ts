import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createParserForFile } from './treeSitterRuntime.js';
import { extractKotlinDeclarations } from './kotlinDeclarations.js';

const FIXTURES_DIR = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures', 'kotlin');

async function parseFixture(fileName: string) {
  const filePath = path.join(FIXTURES_DIR, fileName);
  const parser = await createParserForFile(filePath);
  if (!parser) {
    throw new Error(`no parser for ${filePath}`);
  }
  const source = readFileSync(filePath, 'utf-8');
  return parser.parse(source);
}

describe('extractKotlinDeclarations', () => {
  it('클래스 선언에서 이름/패키지/어노테이션을 추출한다', async () => {
    const tree = await parseFixture('UserService.kt');
    const declarations = extractKotlinDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserService',
        packageName: 'com.example.demo.service',
        kind: 'class',
        annotations: ['Service'],
      },
    ]);
  });

  it('인터페이스 선언을 kind: interface로 추출한다', async () => {
    const tree = await parseFixture('UserRepository.kt');
    const declarations = extractKotlinDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserRepository',
        packageName: 'com.example.demo.repository',
        kind: 'interface',
        annotations: [],
      },
    ]);
  });

  it('enum 선언을 kind: enum으로 추출한다', async () => {
    const tree = await parseFixture('UserStatus.kt');
    const declarations = extractKotlinDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserStatus',
        packageName: 'com.example.demo.domain',
        kind: 'enum',
        annotations: [],
      },
    ]);
  });
});
