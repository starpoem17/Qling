# Codex 개발 참조 문서

이 문서는 Qling 개발 시 Codex와 개발자가 빠르게 참조할 규칙과 코드 구조를 정리한 문서다. 제품 요구사항의 최종 근거는 항상 `docs/PRD.md`이며, 이 문서는 PRD를 대체하지 않는다.

## 최우선 규칙

- Source of Truth는 `docs/PRD.md`다.
- `docs/PRD.md`는 절대 수정하지 않는다. PRD에 오류가 있거나 변경이 필요하면 사용자가 직접 정정하도록 요청한다.
- 구현 판단은 PRD, 현재 코드, 테스트의 순서로 대조한다.
- 아키텍처는 얕은 파일을 많이 만드는 방식보다 기능별 깊은 모듈을 유지한다.
- 보고할 사항을 파일로 남겨야 할 때는 Markdown 보고서 대신 한국어 HTML 파일로 작성한다.
- 사용자-facing 화면에서 PRD가 금지한 정보 노출을 만들지 않는다. 특히 고민/답변 맥락에서는 닉네임, 성별, 나이, 관심 분야, 프로필 아바타 노출을 피한다. 예외는 순위 탭과 연결된 1대1 채팅이다.
- PRD에서 MVP 제외로 명시한 기능은 구현하지 않는다. 예: 공개 게시판, 검색, 사용자 고민/답변 수정·삭제, 프로필 사진 업로드, 성별 수정, 운영정책/이용약관 화면, 앱처럼 사용하기 안내, 스와이프 기반 패스 UI.

## 확인한 문서

- `AGENTS.md`: PRD 수정 금지, 깊은 모듈 구조 유지, 보고 파일은 한국어 HTML로 작성한다는 작업 규칙.
- `README.md`: 로컬 실행, 검증 명령, Firebase/Render 배포 설정 요약.
- `docs/PRD.md`: 제품 요구사항의 최종 근거.
- `docs/matching_algorithm.md`: 구현된 매칭 정책의 운영 요약. PRD가 상위 근거다.
- `docs/privacy_policy.md`: 앱 개인정보처리방침 화면의 근거 문서.
- `src/services/notifications/FOREGROUND_POLICY.md`: 포그라운드 알림 중복 표시를 피하고 Firestore/read-model을 우선한다는 알림 정책.

주의: `README.md`는 `docs/ops.md`를 언급하지만 현재 루트 파일 목록에서는 확인되지 않았다. 운영 문서가 필요하면 새로 작성하기 전에 사용자에게 의도를 확인한다.

## 프로젝트 개요

Qling은 익명 고민 게시, 사람 답변, 피드백, 재매칭, AI fallback, 채팅, 순위, 푸시 알림을 제공하는 Express/Vite/Firebase 기반 PWA다.

주요 런타임:

- 프론트엔드: React 19, Vite 6, Tailwind CSS 4, PWA service worker.
- 서버: Express 4, Firebase Admin, Vite middleware.
- 데이터/인증: Firebase Auth, Firestore, FCM/Web Push.
- AI/LLM: `@google/genai`와 서버 moderation/summary provider 계층.
- 테스트: Node 내장 test runner, TypeScript 타입 검사, Firestore rules emulator.

## 실행 및 검증 명령

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run test:rules
```

- `npm run dev`와 `npm start`는 `tsx server.ts`를 실행한다.
- `npm run lint`는 `tsc --noEmit`이다.
- `npm test`는 `tsx --test "src/**/*.test.ts"`다.
- `npm run test:rules`는 Firebase emulator로 `src/**/*.rules.test.ts`를 실행한다.
- 배포 빌드는 `npm install && npm run build`, 시작 명령은 `npm start`다.

## 루트 구조

- `server.ts`: Express 서버 진입점. Firebase Admin 초기화, API 라우트 등록, 개발 Vite middleware, production 정적 파일 서빙을 담당한다.
- `src/App.tsx`: 앱 셸 최상위 orchestration. 인증, 프로필 로드, 전역 overlay, 최상위 route state, bottom navigation mount를 담당한다.
- `src/main.tsx`: React root 및 PWA service worker 등록.
- `src/firebase.ts`: 클라이언트 Firebase 런타임 설정.
- `src/index.css`: 전역 스타일.
- `src/server`: Express route adapter 계층.
- `src/services`: 도메인 서비스, 정책, API client, Firestore repository, server service 모듈.
- `src/screens`: 화면별 deep module. Container, Screen, contract, mapping, policy, test를 기능별 폴더 안에 둔다.
- `packages/domain`: 공유 도메인 상수와 타입. 현재 고민 카테고리와 매칭 타입을 제공한다.
- `assets`: 앱에서 사용하는 SVG 에셋.
- `public`: PWA 아이콘, 폰트, Firebase messaging service worker.
- `scripts`: 운영/시드용 TypeScript 스크립트.
- `firestore.rules`: Firestore 보안 규칙.

## 화면 계층 규칙

`src/screens`는 기능별 깊은 모듈을 유지한다.

일반적인 화면 모듈 구성:

- `*Container.tsx`: 사용자, route, API client, hook, mutation, loading/error state를 연결한다.
- `*Screen.tsx`: presentational component. props와 callback만 사용한다.
- `contract.ts`: 화면이 받는 props/read model 타입. 서비스, Firebase, API, React hook을 가져오지 않는다.
- `mapping.ts`: 서비스/read model을 화면 contract로 변환한다.
- `containerPolicy.ts` 또는 `*Policy.ts`: container의 분기, 상태 결정, route 결과 같은 순수 정책을 둔다.
- `*.test.ts` 또는 `*.test.tsx`: 정책, mapping, rendering, import boundary를 검증한다.

중요한 boundary:

- presentational screen은 Firebase, server, API client, production adapter, mutation helper를 import하지 않는다.
- shared screen primitive도 서비스/API/Firebase/server import 없이 presentational-only로 둔다.
- route helper는 `src/services/appShell/prdNavigationPolicy.ts`에 둔다. screen 내부에서 route 정책을 직접 재작성하지 않는다.
- `src/screens/importBoundaries.test.ts`와 `src/screens/contractImportBoundary.test.ts`가 이 규칙을 검증한다.

## 앱 셸과 라우팅

라우팅은 React Router가 아니라 `AppRouteViewState` 상태와 route helper로 관리된다.

핵심 파일:

- `src/services/appShell/prdNavigationPolicy.ts`: PRD 하단 탭, route type, route transition, back route, tab mapping.
- `src/services/appShell/routeRenderingBoundary.ts`: route group, bottom navigation mount 여부, scroll mode 결정.
- `src/services/appShell/appShellResponsibilityMap.ts`: App이 유지할 책임과 container로 이동할 책임의 문서화된 inventory.

PRD 탭은 다음 4개다.

```ts
['답변하기', '나의 고민', '채팅', '순위']
```

기본 인증 후 route는 `답변하기`이며, 내부 기본 feed route alias는 `received_worries`다.

## 서비스 계층 규칙

`src/services`는 기능별 deep module이다. 기능별로 정책, 타입, API client, Firestore repository, server service, hook을 한 폴더 안에서 관리한다.

대표 패턴:

- `types.ts`: 기능 내부 타입.
- `policy.ts` 또는 `prdPolicy.ts`: PRD 정책을 순수 함수로 표현한다.
- `apiClient.ts`: 클라이언트에서 Express API를 호출한다.
- `firestoreRepository.ts`: Firestore read/write adapter.
- `server/*` 또는 server service 파일: 서버 전용 도메인 mutation.
- `index.ts`: 외부로 공개할 최소 surface.

새 기능 추가 시 기존 기능 폴더의 패턴을 먼저 따른다. 여러 얕은 모듈을 루트에 늘리지 말고, 기능 폴더 안에서 깊게 배치한다.

주요 서비스 영역:

- `worryPublication`: 고민 게시, moderation, summary, recipient selection, delivery 생성.
- `replyPublication`: 답변 게시, moderation, push log.
- `replyFeedback`: 좋아요/싫어요, 코멘트, helpedCount, 채팅 시작 조건 관련 처리.
- `deliveries`: delivery 전달, pass replacement, push log, 수신자 선택.
- `rematch`: 8시간 재매칭 job.
- `aiFallback`: 24시간 AI 답변 fallback job.
- `exampleWorries`: 온보딩 후 예제 고민 생성 및 예제 답변 피드백.
- `readState`: 고민/답변 내부 read 상태.
- `homeWorryFeed`, `myWorries`, `replyMailbox`: 사용자-facing read model/hook.
- `userProfile`, `userAccount`, `pushRegistration`, `ranking`, `chat`, `adminHiding`, `policyDocuments`.

## 서버 계층 규칙

`server.ts`는 route 등록과 Firebase Admin bootstrapping만 담당하는 얇은 composition root로 유지한다.

`src/server/*Routes.ts`는 Express request/response adapter다.

- 인증은 `createRequireFirebaseAuth` 같은 server auth helper를 사용한다.
- route는 service 함수에 필요한 dependency를 주입한다.
- HTTP status와 JSON response shape를 route에서 결정한다.
- 실제 도메인 mutation은 `src/services/**`로 위임한다.
- Firebase Admin 미초기화 fallback route는 명확한 `firebase_unavailable` 응답을 반환한다.

## 도메인 핵심 정책

### 온보딩/프로필

- 닉네임, 성별, 나이, 관심 분야, 프로필 색상을 수집한다.
- 나이는 만 14세 이상 99세 이하.
- 관심 분야는 `packages/domain/src/index.ts`의 `WORRY_CATEGORIES`를 기준으로 한다.
- 프로필 색상은 지정된 10개 HEX만 허용하고 기본값은 `#FF8B3D`다.
- 프로필 색상은 온보딩 완료 후 수정하지 않는다.

### 고민 게시

- 제목 없이 본문만 작성한다.
- 빈 문자열/공백만 제출 불가, 최대 1000자.
- AI 필터링 통과 후 카테고리 추론, 요약, delivery 생성이 진행된다.
- 20자 이하 원문은 요약 생성 없이 원문을 summary로 쓴다.
- 20자 초과는 LLM 요약을 시도하고 실패 시 20자 truncate fallback을 저장한다.
- 사용자 수정/삭제는 제공하지 않는다. 운영자 숨김만 가능하다.

### 매칭/delivery

- 초기 게시 시 목표는 사람 delivery 5개다.
- 4개는 matched slot, 1개는 random slot이다.
- 기본 후보 제한: 작성자 제외, 탈퇴/비활성 제외, 유효 프로필 필요, `activeDeliveryCount < 10`, 같은 고민 중복 수신/패스/답변 제외.
- matched ranking은 관심 분야 overlap, `helpedCount`, 같은 성별, random tie-breaker 순이다.
- 푸시 토큰이 없어도 매칭 대상이다.
- 패스는 확인 모달 없이 즉시 사라지고, 동일 고민 재수신은 없다.
- 사람 delivery cap은 고민당 15개다.

주의: `docs/matching_algorithm.md`는 "eligible users fewer than 5면 publication fails"라고 요약하지만, PRD 8.1은 "서비스 초기 상황, 유저가 5명 미만인 경우 모든 유저들에게 전송"이라고 적고 있다. 충돌 시 PRD가 상위 근거이므로 사용자의 정정 또는 구현 의도 확인이 필요하다.

### 재매칭/AI fallback

- 재매칭은 8시간 지연 후 additive 방식으로 Round 1, Round 2까지만 생성한다.
- 기존 active delivery는 답변 가능하게 유지한다.
- AI fallback은 초기 게시나 사람 재매칭의 일부가 아니라 별도 24시간 job이다.
- 사람 delivery cap이 소진되고 사람 답변이 0개이며 AI 답변이 없을 때만 AI 답변 1개를 생성한다.

### 답변/피드백/채팅

- 답변은 고민당 1회, 빈 문자열/공백 불가, 최대 1000자.
- 답변 제출 성공 후 답변하기 탭에서 즉시 사라진다.
- 좋아요/싫어요는 취소나 변경이 없다.
- 좋아요는 `helpedCount`를 증가시키며, 선택적으로 코멘트를 남길 수 있다.
- 싫어요는 답변자에게 보이지 않고 게시자 화면에서 답변을 숨긴다.
- 좋아요 코멘트가 있어야 답변자가 채팅을 시작할 수 있다.
- 채팅에서는 상대 닉네임과 프로필 아바타만 표시하고 성별, 나이, 관심 분야는 표시하지 않는다.

### 알림

- 알림 권한/토큰이 없어도 core mutation은 성공이어야 한다.
- delivery 생성 성공, push 발송 실패는 고민 전달 성공으로 처리한다.
- 포그라운드에서는 live Firestore/read-model에 이미 반영된 이벤트를 중복 toast로 표시하지 않는 정책을 따른다.
- invalid push token은 자동 삭제한다.

## 데이터/익명성 주의사항

- 고민/답변 맥락에서는 사용자끼리 완전 익명이다.
- 닉네임과 프로필 아바타 노출 허용 영역은 본인 마이페이지 summary, 순위 탭, 연결된 1대1 채팅이다.
- 나이는 다른 사용자에게 보이지 않으며 MVP 마이페이지에도 표시하지 않는다.
- 운영자는 원문과 내부 로그를 열람할 수 있지만 관리자 페이지는 MVP 제외다.
- 탈퇴 시 `users/{uid}`는 완전 삭제하지 않고 `deleted` 상태로 보존한다.

## 테스트 작성 기준

- PRD 정책은 가능하면 순수 함수와 테스트로 고정한다.
- 화면 contract/mapping/container policy는 각각 별도 테스트를 둔다.
- import boundary 테스트를 깨는 방향의 의존성 추가는 피한다.
- 서버 route는 dependency injection으로 테스트 가능하게 유지한다.
- Firestore rules 변경 시 `npm run test:rules`를 실행한다.
- 화면 변경은 해당 screen test와 관련 policy/mapping test를 우선 실행하고, 범위가 넓으면 전체 `npm test`, `npm run lint`, `npm run build`까지 확인한다.

## 작업 절차 권장안

1. `docs/PRD.md`에서 요구사항을 먼저 확인한다.
2. 관련 `src/screens/<feature>`와 `src/services/<feature>` 폴더를 찾는다.
3. contract, mapping, policy 테스트를 확인해 기존 boundary를 파악한다.
4. UI 변경은 Screen props와 contract를 먼저 정리하고, Container에서 data/mutation을 연결한다.
5. 서버 변경은 route adapter가 아니라 service 정책/도메인 함수에 핵심 로직을 둔다.
6. 새 문서가 보고서 성격이면 Markdown이 아니라 한국어 HTML로 작성한다.
7. PRD와 구현 문서가 충돌하면 PRD를 수정하지 말고 사용자 확인을 요청한다.
