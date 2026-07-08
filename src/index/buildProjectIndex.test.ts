import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildProjectIndex, getIndexFilePath, writeIndexFile } from './buildProjectIndex.js';
import { deserializeIndex } from './schema.js';

let projectDir: string;

beforeEach(async () => {
  projectDir = await mkdtemp(path.join(tmpdir(), 'sba-build-index-test-'));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

async function writeSourceFile(relativePath: string, content: string) {
  const fullPath = path.join(projectDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

describe('buildProjectIndex', () => {
  it('스캔 → 참조 해석 → stereotype 분류를 연결해 ProjectIndex를 만든다', async () => {
    await writeSourceFile(
      'src/main/kotlin/com/example/repo/UserRepository.kt',
      'package com.example.repo\n\ninterface UserRepository\n',
    );
    await writeSourceFile(
      'src/main/kotlin/com/example/service/UserService.kt',
      [
        'package com.example.service',
        '',
        'import com.example.repo.UserRepository',
        'import org.springframework.stereotype.Service',
        '',
        '@Service',
        'class UserService(private val userRepository: UserRepository)',
        '',
      ].join('\n'),
    );

    const index = await buildProjectIndex(projectDir);

    expect(index.schemaVersion).toBe(1);
    expect(index.classes).toHaveLength(2);

    const userService = index.classes.find((c) => c.fqName === 'com.example.service.UserService');
    expect(userService).toEqual({
      fqName: 'com.example.service.UserService',
      kind: 'class',
      stereotype: 'Service',
      dependencies: [
        {
          name: 'userRepository',
          rawType: 'UserRepository',
          resolvedFqName: 'com.example.repo.UserRepository',
        },
      ],
      extends: null,
      implements: [],
      filePath: path.join(projectDir, 'src/main/kotlin/com/example/service/UserService.kt'),
    });
  });
});

describe('writeIndexFile', () => {
  it('.sba/index.json에 인덱스를 쓰고 경로를 반환한다', async () => {
    await writeSourceFile(
      'src/main/kotlin/com/example/Foo.kt',
      'package com.example\n\nclass Foo\n',
    );
    const index = await buildProjectIndex(projectDir);

    const outputPath = await writeIndexFile(projectDir, index);

    expect(outputPath).toBe(getIndexFilePath(projectDir));
    const written = await readFile(outputPath, 'utf-8');
    expect(deserializeIndex(written)).toEqual(index);
  });
});
