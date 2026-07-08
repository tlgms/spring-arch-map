import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createParserForFile } from './treeSitterRuntime.js';
import { extractJavaDeclarations } from './javaDeclarations.js';

const FIXTURES_DIR = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures', 'java');

async function parseFixture(fileName: string) {
  const filePath = path.join(FIXTURES_DIR, fileName);
  const parser = await createParserForFile(filePath);
  if (!parser) {
    throw new Error(`no parser for ${filePath}`);
  }
  const source = readFileSync(filePath, 'utf-8');
  return parser.parse(source);
}

async function parseSource(fileName: string, source: string) {
  const parser = await createParserForFile(fileName);
  if (!parser) {
    throw new Error(`no parser for ${fileName}`);
  }
  return parser.parse(source);
}

describe('extractJavaDeclarations', () => {
  it('클래스 선언에서 이름/패키지/어노테이션/생성자 주입/상속을 추출한다', async () => {
    const tree = await parseFixture('UserService.java');
    const declarations = extractJavaDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserService',
        packageName: 'com.example.demo.service',
        kind: 'class',
        annotations: ['Service'],
        constructorParams: [
          { name: 'userRepository', type: 'UserRepository' },
          { name: 'notifier', type: 'Optional<Notifier>' },
        ],
        fieldInjections: [],
        extends: 'BaseService',
        implements: ['UserOperations'],
      },
    ]);
  });

  it('인터페이스 선언을 kind: interface로 추출한다', async () => {
    const tree = await parseFixture('UserRepository.java');
    const declarations = extractJavaDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserRepository',
        packageName: 'com.example.demo.repository',
        kind: 'interface',
        annotations: [],
        constructorParams: [],
        fieldInjections: [],
        extends: null,
        implements: [],
      },
    ]);
  });

  it('enum 선언을 kind: enum으로 추출한다', async () => {
    const tree = await parseFixture('UserStatus.java');
    const declarations = extractJavaDeclarations(tree);

    expect(declarations).toEqual([
      {
        name: 'UserStatus',
        packageName: 'com.example.demo.domain',
        kind: 'enum',
        annotations: [],
        constructorParams: [],
        fieldInjections: [],
        extends: null,
        implements: [],
      },
    ]);
  });

  it('@Autowired 필드를 fieldInjections로 수집한다', async () => {
    const tree = await parseSource(
      'FieldInjected.java',
      [
        'package com.example.demo.service;',
        '',
        'import org.springframework.beans.factory.annotation.Autowired;',
        'import org.springframework.stereotype.Service;',
        '',
        '@Service',
        'public class FieldInjected {',
        '    @Autowired',
        '    private UserRepository userRepository;',
        '',
        '    private Notifier notInjected;',
        '}',
        '',
      ].join('\n'),
    );
    const [declaration] = extractJavaDeclarations(tree);

    expect(declaration?.fieldInjections).toEqual([{ name: 'userRepository', type: 'UserRepository' }]);
  });

  it('interface가 여러 인터페이스를 extends하면 implements 목록으로 추출한다', async () => {
    const tree = await parseSource('Multi.java', 'interface Multi extends Runnable, Comparable {}\n');
    const [declaration] = extractJavaDeclarations(tree);

    expect(declaration?.extends).toBeNull();
    expect(declaration?.implements).toEqual(['Runnable', 'Comparable']);
  });
});
