import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildProjectIndex } from './buildProjectIndex.js';
import { summarizeIndex } from './summarize.js';
import type { ProjectIndex } from './schema.js';

const PROJECT_DIR = path.resolve(fileURLToPath(import.meta.url), '..', 'fixtures', 'mini-project');

function toPortableSnapshot(index: ProjectIndex) {
  return {
    schemaVersion: index.schemaVersion,
    classes: [...index.classes]
      .sort((a, b) => a.fqName.localeCompare(b.fqName))
      .map((classInfo) => ({
        ...classInfo,
        filePath: path.relative(PROJECT_DIR, classInfo.filePath).split(path.sep).join('/'),
      })),
  };
}

describe('scan integration', () => {
  it('픽스처 미니 프로젝트를 스캔한 인덱스가 스냅샷과 일치한다', async () => {
    const index = await buildProjectIndex(PROJECT_DIR);
    expect(toPortableSnapshot(index)).toMatchSnapshot();
  });

  it('클래스 수와 stereotype 분포 요약이 예상과 일치한다', async () => {
    const index = await buildProjectIndex(PROJECT_DIR);
    const summary = summarizeIndex(index);

    expect(summary).toEqual({
      totalClasses: 5,
      byStereotype: {
        Domain: 1,
        Port: 1,
        Repository: 1,
        Service: 1,
        RestController: 1,
      },
    });
  });
});
