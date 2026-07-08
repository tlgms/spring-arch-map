import { describe, expect, it } from 'vitest';
import type { ParsedFile } from '../parser/index.js';
import { resolveTypeReferences, stripToBaseTypeName } from './resolveReferences.js';

describe('stripToBaseTypeName', () => {
  it('널러블 마커(?)를 제거한다', () => {
    expect(stripToBaseTypeName('Notifier?')).toBe('Notifier');
  });

  it('단일 타입 인자 제네릭은 내부 타입으로 벗긴다', () => {
    expect(stripToBaseTypeName('List<User>')).toBe('User');
    expect(stripToBaseTypeName('Optional<Notifier>')).toBe('Notifier');
  });

  it('중첩 제네릭도 재귀적으로 벗긴다', () => {
    expect(stripToBaseTypeName('List<Optional<User>>')).toBe('User');
  });

  it('타입 인자가 여러 개면 바깥 타입 이름을 유지한다', () => {
    expect(stripToBaseTypeName('Map<String, User>')).toBe('Map');
  });

  it('일반 타입은 그대로 반환한다', () => {
    expect(stripToBaseTypeName('UserRepository')).toBe('UserRepository');
  });
});

function buildParsedFile(overrides: Partial<ParsedFile> & Pick<ParsedFile, 'filePath'>): ParsedFile {
  return {
    language: 'kotlin',
    imports: [],
    declarations: [],
    ...overrides,
  };
}

describe('resolveTypeReferences', () => {
  it('import 매칭으로 의존성을 해석한다', () => {
    const files: ParsedFile[] = [
      buildParsedFile({
        filePath: 'UserService.kt',
        imports: ['com.example.repo.UserRepository'],
        declarations: [
          {
            name: 'UserService',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: ['Service'],
            dependencies: [{ name: 'userRepository', type: 'UserRepository' }],
            extends: null,
            implements: [],
          },
        ],
      }),
      buildParsedFile({
        filePath: 'UserRepository.kt',
        declarations: [
          {
            name: 'UserRepository',
            packageName: 'com.example.repo',
            kind: 'interface',
            annotations: [],
            dependencies: [],
            extends: null,
            implements: [],
          },
        ],
      }),
    ];

    const [userService] = resolveTypeReferences(files);
    expect(userService?.dependencies).toEqual([
      {
        name: 'userRepository',
        rawType: 'UserRepository',
        resolvedFqName: 'com.example.repo.UserRepository',
      },
    ]);
  });

  it('import 없이 동일 패키지 탐색으로 의존성을 해석한다', () => {
    const files: ParsedFile[] = [
      buildParsedFile({
        filePath: 'UserService.kt',
        declarations: [
          {
            name: 'UserService',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: [],
            dependencies: [{ name: 'helper', type: 'Helper' }],
            extends: null,
            implements: [],
          },
        ],
      }),
      buildParsedFile({
        filePath: 'Helper.kt',
        declarations: [
          {
            name: 'Helper',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: [],
            dependencies: [],
            extends: null,
            implements: [],
          },
        ],
      }),
    ];

    const [userService] = resolveTypeReferences(files);
    expect(userService?.dependencies[0]?.resolvedFqName).toBe('com.example.service.Helper');
  });

  it('제네릭/널러블을 벗긴 뒤 해석한다', () => {
    const files: ParsedFile[] = [
      buildParsedFile({
        filePath: 'UserService.kt',
        imports: ['com.example.notify.Notifier'],
        declarations: [
          {
            name: 'UserService',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: [],
            dependencies: [{ name: 'notifier', type: 'Notifier?' }],
            extends: null,
            implements: [],
          },
        ],
      }),
      buildParsedFile({
        filePath: 'Notifier.kt',
        declarations: [
          {
            name: 'Notifier',
            packageName: 'com.example.notify',
            kind: 'interface',
            annotations: [],
            dependencies: [],
            extends: null,
            implements: [],
          },
        ],
      }),
    ];

    const [userService] = resolveTypeReferences(files);
    expect(userService?.dependencies[0]?.resolvedFqName).toBe('com.example.notify.Notifier');
  });

  it('해석할 수 없는 타입은 resolvedFqName을 null로 마킹한다', () => {
    const files: ParsedFile[] = [
      buildParsedFile({
        filePath: 'UserService.kt',
        declarations: [
          {
            name: 'UserService',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: [],
            dependencies: [{ name: 'objectMapper', type: 'ObjectMapper' }],
            extends: null,
            implements: [],
          },
        ],
      }),
    ];

    const [userService] = resolveTypeReferences(files);
    expect(userService?.dependencies[0]?.resolvedFqName).toBeNull();
  });

  it('와일드카드 import 아래 동일 이름 클래스가 있으면 해석한다', () => {
    const files: ParsedFile[] = [
      buildParsedFile({
        filePath: 'UserService.kt',
        imports: ['com.example.repo.*'],
        declarations: [
          {
            name: 'UserService',
            packageName: 'com.example.service',
            kind: 'class',
            annotations: [],
            dependencies: [{ name: 'userRepository', type: 'UserRepository' }],
            extends: null,
            implements: [],
          },
        ],
      }),
      buildParsedFile({
        filePath: 'UserRepository.kt',
        declarations: [
          {
            name: 'UserRepository',
            packageName: 'com.example.repo',
            kind: 'interface',
            annotations: [],
            dependencies: [],
            extends: null,
            implements: [],
          },
        ],
      }),
    ];

    const [userService] = resolveTypeReferences(files);
    expect(userService?.dependencies[0]?.resolvedFqName).toBe('com.example.repo.UserRepository');
  });
});
