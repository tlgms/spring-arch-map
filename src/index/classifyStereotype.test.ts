import { describe, expect, it } from 'vitest';
import { classifyStereotype } from './classifyStereotype.js';

describe('classifyStereotype', () => {
  it.each(['RestController', 'Service', 'Repository', 'Component', 'Configuration'])(
    '@%s 어노테이션이 있으면 해당 이름을 stereotype으로 반환한다',
    (annotation) => {
      expect(
        classifyStereotype({ annotations: [annotation], packageName: 'com.example.demo' }),
      ).toBe(annotation);
    },
  );

  it.each([
    ['port', 'Port'],
    ['adapter', 'Adapter'],
    ['domain', 'Domain'],
    ['usecase', 'UseCase'],
  ])('패키지에 %s 세그먼트가 있으면 %s로 분류한다', (segment, expected) => {
    expect(
      classifyStereotype({ annotations: [], packageName: `com.example.${segment}.user` }),
    ).toBe(expected);
  });

  it('어노테이션이 패키지 컨벤션보다 우선한다', () => {
    expect(
      classifyStereotype({ annotations: ['Service'], packageName: 'com.example.adapter' }),
    ).toBe('Service');
  });

  it('어노테이션도 패키지 컨벤션도 없으면 null을 반환한다', () => {
    expect(
      classifyStereotype({ annotations: ['Transactional'], packageName: 'com.example.util' }),
    ).toBeNull();
  });
});
