import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createParserForFile } from './treeSitterRuntime.js';
import { extractKotlinImports } from './kotlinImports.js';

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

describe('extractKotlinImports', () => {
  it('import 목록을 점(.) 표기 전체 경로로 추출한다', async () => {
    const tree = await parseFixture('UserService.kt');
    expect(extractKotlinImports(tree)).toEqual([
      'com.example.demo.domain.User',
      'com.example.demo.repository.UserRepository',
      'org.springframework.stereotype.Service',
    ]);
  });

  it('import가 없으면 빈 배열을 반환한다', async () => {
    const tree = await parseFixture('UserStatus.kt');
    expect(extractKotlinImports(tree)).toEqual([]);
  });

  it('와일드카드 import는 마지막에 .*를 붙인다', async () => {
    const parser = await createParserForFile('Sample.kt');
    const source = 'package com.example\n\nimport com.example.demo.*\n\nclass Foo\n';
    const tree = parser?.parse(source);
    expect(tree && extractKotlinImports(tree)).toEqual(['com.example.demo.*']);
  });
});
