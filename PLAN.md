# sba — Spring Boot Analyzer 개발 계획

CLI 도구. Spring Boot(Java/Kotlin) 프로젝트 폴더를 분석해 클래스 구조 인덱스를 만들고,
특정 클래스 중심 의존성 그래프를 Mermaid로 출력하며, 파일의 역할을 AI(Claude API)로 설명한다.

## 기술 스택

- Node.js 20+ / TypeScript (strict)
- 파서: web-tree-sitter + tree-sitter-kotlin, tree-sitter-java (WASM)
- CLI: commander
- 테스트: vitest
- AI: @anthropic-ai/sdk
- 배포 목표: npm publish → `npx sba`

## CLI 명령 명세

```bash
sba scan <projectPath>                 # 프로젝트 파싱 → .sba/index.json 생성
sba deps <ClassName> [--depth 2] [--direction out|in|both] [--output graph.md]
sba explain <filePath> [--no-cache]
```

## 작업 규칙 (요약)

- 아래 태스크 1개 = 커밋 1개. 태스크를 쪼개도 되지만 합치지 않는다.
- Conventional Commits 형식 사용 (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`)
- 테스트가 있는 태스크는 테스트 통과 후에만 커밋한다.
- 태스크 완료 시 이 파일의 체크박스를 갱신하고 커밋에 포함한다.

---

## Phase 0 — 스캐폴딩

- [x] 0.1 `chore: init project` — npm init, TypeScript(strict) 설정, 디렉터리 구조(`src/cli`, `src/parser`, `src/index`(인덱스 도메인), `src/graph`, `src/ai`), `.gitignore`
- [x] 0.2 `chore: add lint, format, test tooling` — ESLint + Prettier + vitest 설정, `npm run lint/test/build` 스크립트
- [x] 0.3 `feat: add CLI skeleton` — commander로 `scan`/`deps`/`explain` 서브커맨드 스텁(옵션 파싱까지, 본문은 TODO), `bin` 필드 등록
- [x] 0.4 `chore: add CI` — GitHub Actions에서 lint + test + build

## Phase 1 — tree-sitter 파서

- [x] 1.1 `feat: setup tree-sitter runtime` — web-tree-sitter 초기화, Kotlin/Java WASM 문법 로드 유틸, 확장자 기반 언어 선택
- [x] 1.2 `test: add parser fixtures` — 테스트용 Kotlin/Java 샘플 파일 세트 작성 (class/interface/enum, 어노테이션, 주 생성자 주입, extends/implements, 제네릭·널러블 타입 포함)
- [x] 1.3 `feat: extract class declarations (kotlin)` — 파일에서 클래스/인터페이스/enum 선언 추출: 이름, 패키지, 어노테이션 목록
- [x] 1.4 `feat: extract constructor params and imports (kotlin)` — 주 생성자 파라미터의 이름·타입, import 목록 추출
- [ ] 1.5 `feat: extract inheritance (kotlin)` — extends / implements 대상 추출 (Kotlin은 `:` 뒤 supertype 목록에서 분리)
- [ ] 1.6 `feat: java parser parity` — 1.3~1.5와 동일한 추출을 Java 문법으로 구현 (필드 주입 `@Autowired` 필드도 의존성으로 수집)
- [ ] 1.7 `refactor: unify parser output` — 언어와 무관한 `ParsedFile` 타입으로 출력 통일

## Phase 2 — 인덱스 & 참조 해석

- [ ] 2.1 `feat: define index schema` — `ClassInfo`(fqName, kind, stereotype, dependencies, extends, implements, filePath) 및 `ProjectIndex` 타입 + JSON 직렬화/역직렬화
- [ ] 2.2 `feat: project scanner` — `src/main/kotlin|java` 탐색, 파일 워킹, 파일별 파싱 결과 수집 (Gradle 멀티모듈 대응: 하위 모듈의 src/main도 탐색)
- [ ] 2.3 `feat: resolve type references` — 생성자 파라미터 타입 → FQName 해석: ① import 매칭 ② 동일 패키지 탐색 ③ 제네릭/널러블 벗기기(`List<X>`, `X?` → `X`) ④ 미해석 타입은 external로 마킹
- [ ] 2.4 `feat: classify stereotypes` — Spring 어노테이션(@RestController, @Service, @Repository, @Component, @Configuration) + 패키지 컨벤션(`port`, `adapter`, `domain`, `usecase`) 기반 분류
- [ ] 2.5 `feat: implement scan command` — 위 전부를 연결해 `.sba/index.json` 생성, 요약 출력(클래스 수, stereotype 분포)
- [ ] 2.6 `test: scan integration test` — 픽스처 미니 프로젝트에 대해 인덱스 스냅샷 테스트

## Phase 3 — deps 그래프 & Mermaid

- [ ] 3.1 `feat: graph traversal` — 인덱스에서 시작 클래스 기준 BFS, `--depth`, `--direction out|in|both` 지원
- [ ] 3.2 `feat: interface-impl edges` — 의존 대상이 인터페이스면 `implements` 역추적으로 구현체 노드/간선 추가 (port → adapter 연결)
- [ ] 3.3 `feat: mermaid renderer` — flowchart LR 출력, stereotype별 classDef 스타일, 인터페이스 노드는 `{{}}`, 구현 간선은 점선
- [ ] 3.4 `feat: implement deps command` — 클래스명 부분 일치 검색(모호하면 후보 나열), stdout 또는 `--output` 파일 저장
- [ ] 3.5 `test: graph and renderer tests` — 순환 의존 케이스 포함

## Phase 4 — explain (AI)

- [ ] 4.1 `feat: anthropic client setup` — `ANTHROPIC_API_KEY` env 로드, 클라이언트 래퍼, 에러 처리(키 없음/429/5xx)
- [ ] 4.2 `feat: context builder` — 대상 파일 전문 + 인덱스에서 의존 클래스들의 시그니처(전문 아님) + 역의존 클래스 목록 + 프로젝트 stereotype 분포 요약을 프롬프트로 조립. 토큰 예산 상한(예: 대상 파일 외 컨텍스트 4천 토큰) 두고 초과 시 시그니처 우선순위 절삭
- [ ] 4.3 `feat: implement explain command` — 스트리밍 출력, 마크다운으로 역할/아키텍처 위치/의존 관계 설명
- [ ] 4.4 `feat: explain cache` — 파일 내용 해시 + 컨텍스트 해시 키로 `.sba/cache/`에 응답 캐싱, `--no-cache` 옵션
- [ ] 4.5 `test: context builder tests` — 토큰 예산 절삭 로직 단위 테스트 (API 호출은 모킹)

## Phase 5 — 마감 & 배포

- [ ] 5.1 `feat: incremental scan` — 파일 mtime+해시 비교로 변경 파일만 재파싱
- [ ] 5.2 `docs: write README` — 설치, 빠른 시작(5분 내 첫 그래프), 명령 레퍼런스, Mermaid 예시 이미지, 참조 해석의 한계(타입 해석 없이 import 휴리스틱 사용) 명시
- [ ] 5.3 `chore: real project validation` — 실제 Spring Boot 프로젝트(예: entrydsm-platform)에 대해 scan/deps/explain 실행, 발견된 파싱 실패 케이스를 이슈화하고 픽스처로 추가
- [ ] 5.4 `chore: prepare npm publish` — package.json 메타데이터, files 필드, WASM 파일 번들링 확인, `npx` 동작 검증

## 알려진 리스크 / 결정 사항

- 타입 해석 없이 import 기반 휴리스틱으로 참조를 해석한다. 와일드카드 import, 동명 클래스는 오탐 가능 → external 마킹으로 안전하게 실패.
- tree-sitter Kotlin 문법이 일부 최신 문법(context receiver 등)에서 오류 노드를 낼 수 있음 → 오류 노드 발생 시 해당 파일을 건너뛰지 말고 추출 가능한 부분만 수집.
- Mermaid는 노드 수가 많으면 렌더링이 깨짐 → deps 명령의 기본 depth를 2로 제한.
