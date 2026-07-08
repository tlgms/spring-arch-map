import { describe, expect, it } from 'vitest';
import {
  INDEX_SCHEMA_VERSION,
  InvalidIndexError,
  serializeIndex,
  deserializeIndex,
  type ProjectIndex,
} from './schema.js';

function buildSampleIndex(): ProjectIndex {
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    classes: [
      {
        fqName: 'com.example.demo.service.UserService',
        kind: 'class',
        stereotype: 'Service',
        dependencies: [
          {
            name: 'userRepository',
            rawType: 'UserRepository',
            resolvedFqName: 'com.example.demo.repository.UserRepository',
          },
          { name: 'notifier', rawType: 'Notifier?', resolvedFqName: null },
        ],
        extends: 'BaseService',
        implements: ['UserOperations'],
        filePath: 'src/main/kotlin/.../UserService.kt',
      },
    ],
  };
}

describe('serializeIndex / deserializeIndex', () => {
  it('직렬화 후 역직렬화하면 원본과 동일한 값이 나온다', () => {
    const index = buildSampleIndex();
    const json = serializeIndex(index);
    expect(deserializeIndex(json)).toEqual(index);
  });

  it('손상된 JSON 문자열은 InvalidIndexError를 던진다', () => {
    expect(() => deserializeIndex('{ not valid json')).toThrow(InvalidIndexError);
  });

  it('필수 필드가 빠진 JSON은 InvalidIndexError를 던진다', () => {
    expect(() => deserializeIndex(JSON.stringify({ schemaVersion: 1 }))).toThrow(InvalidIndexError);
  });

  it('classes 내부 항목이 스키마와 맞지 않으면 InvalidIndexError를 던진다', () => {
    const malformed = {
      schemaVersion: 1,
      classes: [{ fqName: 'Foo' }],
    };
    expect(() => deserializeIndex(JSON.stringify(malformed))).toThrow(InvalidIndexError);
  });
});
