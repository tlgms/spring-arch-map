import { describe, expect, it } from 'vitest';
import { createParserForFile, detectLanguageFromPath } from './treeSitterRuntime.js';

describe('detectLanguageFromPath', () => {
  it('.kt/.kts 확장자를 kotlin으로 판별한다', () => {
    expect(detectLanguageFromPath('Foo.kt')).toBe('kotlin');
    expect(detectLanguageFromPath('Foo.kts')).toBe('kotlin');
  });

  it('.java 확장자를 java로 판별한다', () => {
    expect(detectLanguageFromPath('Foo.java')).toBe('java');
  });

  it('지원하지 않는 확장자는 null을 반환한다', () => {
    expect(detectLanguageFromPath('Foo.txt')).toBeNull();
  });
});

describe('createParserForFile', () => {
  it('.java 파일을 파싱할 수 있는 Parser를 반환한다', async () => {
    const parser = await createParserForFile('Foo.java');
    expect(parser).not.toBeNull();
    const tree = parser?.parse('public class Foo { void bar() {} }');
    expect(tree?.rootNode.hasError).toBe(false);
  });

  it('.kt 파일을 파싱할 수 있는 Parser를 반환한다', async () => {
    const parser = await createParserForFile('Foo.kt');
    expect(parser).not.toBeNull();
    const tree = parser?.parse('class Foo {\n  fun bar() {}\n}\n');
    expect(tree?.rootNode.hasError).toBe(false);
  });

  it('지원하지 않는 확장자는 null을 반환한다', async () => {
    const parser = await createParserForFile('Foo.txt');
    expect(parser).toBeNull();
  });
});
