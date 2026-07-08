import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanProject } from './scanner.js';

let projectDir: string;

beforeEach(async () => {
  projectDir = await mkdtemp(path.join(tmpdir(), 'sba-scanner-test-'));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

async function writeSourceFile(relativePath: string, content: string) {
  const fullPath = path.join(projectDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');
}

describe('scanProject', () => {
  it('멀티모듈 Gradle 프로젝트의 여러 src/main을 모두 탐색한다', async () => {
    await writeSourceFile(
      'module-a/src/main/kotlin/com/example/a/ServiceA.kt',
      'package com.example.a\n\nclass ServiceA\n',
    );
    await writeSourceFile(
      'module-b/src/main/java/com/example/b/ServiceB.java',
      'package com.example.b;\n\npublic class ServiceB {}\n',
    );

    const result = await scanProject(projectDir);

    expect(result.sourceRoots.sort()).toEqual(
      [
        path.join(projectDir, 'module-a/src/main/kotlin'),
        path.join(projectDir, 'module-b/src/main/java'),
      ].sort(),
    );
    const fqNames = result.parsedFiles
      .flatMap((file) => file.declarations)
      .map((decl) => `${decl.packageName}.${decl.name}`)
      .sort();
    expect(fqNames).toEqual(['com.example.a.ServiceA', 'com.example.b.ServiceB']);
  });

  it('node_modules, build 등 무시 대상 디렉터리는 탐색하지 않는다', async () => {
    await writeSourceFile(
      'src/main/kotlin/com/example/Real.kt',
      'package com.example\n\nclass Real\n',
    );
    await writeSourceFile(
      'node_modules/some-pkg/src/main/kotlin/Ignored.kt',
      'package com.example.ignored\n\nclass Ignored\n',
    );
    await writeSourceFile('build/src/main/java/Ignored.java', 'class Ignored {}\n');

    const result = await scanProject(projectDir);

    expect(result.sourceRoots).toEqual([path.join(projectDir, 'src/main/kotlin')]);
    expect(result.parsedFiles).toHaveLength(1);
  });

  it('존재하지 않는 경로는 명확한 에러를 던진다', async () => {
    await expect(scanProject(path.join(projectDir, 'does-not-exist'))).rejects.toThrow(
      '프로젝트 경로를 찾을 수 없습니다',
    );
  });
});
