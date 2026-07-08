import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFile } from './parseFile.js';

const FIXTURES_DIR = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures');

describe('parseFile', () => {
  it('Kotlin 파일을 언어 무관 ParsedFile로 파싱한다', async () => {
    const filePath = path.join(FIXTURES_DIR, 'kotlin', 'UserService.kt');
    const parsed = await parseFile(filePath);

    expect(parsed).toEqual({
      filePath,
      language: 'kotlin',
      imports: [
        'com.example.demo.domain.User',
        'com.example.demo.repository.UserRepository',
        'org.springframework.stereotype.Service',
      ],
      declarations: [
        {
          name: 'UserService',
          packageName: 'com.example.demo.service',
          kind: 'class',
          annotations: ['Service'],
          dependencies: [
            { name: 'userRepository', type: 'UserRepository' },
            { name: 'notifier', type: 'Notifier?' },
          ],
          extends: 'BaseService',
          implements: ['UserOperations'],
        },
      ],
    });
  });

  it('Java 파일을 언어 무관 ParsedFile로 파싱하고 생성자 주입과 필드 주입을 dependencies로 합친다', async () => {
    const filePath = path.join(FIXTURES_DIR, 'java', 'UserService.java');
    const parsed = await parseFile(filePath);

    expect(parsed).toEqual({
      filePath,
      language: 'java',
      imports: [
        'com.example.demo.domain.User',
        'com.example.demo.repository.UserRepository',
        'org.springframework.stereotype.Service',
        'java.util.List',
        'java.util.Optional',
      ],
      declarations: [
        {
          name: 'UserService',
          packageName: 'com.example.demo.service',
          kind: 'class',
          annotations: ['Service'],
          dependencies: [
            { name: 'userRepository', type: 'UserRepository' },
            { name: 'notifier', type: 'Optional<Notifier>' },
          ],
          extends: 'BaseService',
          implements: ['UserOperations'],
        },
      ],
    });
  });

  it('지원하지 않는 확장자는 null을 반환한다', async () => {
    const parsed = await parseFile('Foo.txt');
    expect(parsed).toBeNull();
  });
});
