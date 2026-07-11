#!/usr/bin/env node
import { Command } from 'commander';
import { buildProjectIndex, summarizeIndex, writeIndexFile } from '../index/index.js';

const program = new Command();

program.name('sba').description('Spring Boot Analyzer — 클래스 구조/의존성 그래프 분석 CLI').version('0.1.0');

program
  .command('scan')
  .description('프로젝트 파싱 → .sba/index.json 생성')
  .argument('<projectPath>', '분석할 Spring Boot 프로젝트 경로')
  .action(async (projectPath: string) => {
    try {
      const index = await buildProjectIndex(projectPath);
      const outputPath = await writeIndexFile(projectPath, index);
      const summary = summarizeIndex(index);

      console.log(`스캔 완료: 클래스 ${String(summary.totalClasses)}개`);
      console.log('Stereotype 분포:');
      for (const [stereotype, count] of Object.entries(summary.byStereotype)) {
        console.log(`  ${stereotype}: ${String(count)}`);
      }
      console.log(`인덱스 파일: ${outputPath}`);
    } catch (error) {
      console.error(`스캔 실패: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

program
  .command('deps')
  .description('특정 클래스 중심 의존성 그래프를 Mermaid로 출력')
  .argument('<className>', '대상 클래스명(부분 일치 가능)')
  .option('--depth <n>', '탐색 깊이', '2')
  .option('--direction <direction>', '탐색 방향 (out|in|both)', 'out')
  .option('--output <file>', '결과를 저장할 파일 경로')
  .action((className: string) => {
    // TODO: Phase 3에서 구현
    console.log('TODO: deps', className);
  });

program
  .command('explain')
  .description('파일의 역할을 AI(Claude API)로 설명')
  .argument('<filePath>', '설명할 파일 경로')
  .option('--no-cache', '캐시된 응답을 사용하지 않음')
  .action((filePath: string) => {
    // TODO: Phase 4에서 구현
    console.log('TODO: explain', filePath);
  });

program.parse();
