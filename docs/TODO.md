# TODO: PRD and design/reference pixel alignment

이 파일은 `docs/PRD.md`와 `design/reference/pngs/screens/*.png` 기준으로 Qling production UI를 정합화하기 위한 구현 순서다. 체크박스는 위에서 아래로만 진행한다. 어떤 체크박스를 완료하려면 해당 항목의 대상 파일, 완료 기준, 검증, production PNG evidence 조건을 모두 만족해야 한다.

## Global Execution Rules

- Source of truth:
  - PRD: 현재 working tree의 `docs/PRD.md`. GitHub 원격 PRD나 과거 TODO를 기준으로 삼지 않는다.
  - Design: `design/reference/pngs/screens/*.png`. React reference component 좌표와 CSS export 좌표는 힌트이며, 최종 기준은 PIL로 직접 측정한 PNG 픽셀값이다.
  - 화면 01~05는 이미 구현된 것으로 간주한다. 다만 Phase 12에서 회귀 방지 검증과 evidence 확인은 반드시 수행한다.
  - 화면 11은 reference PNG가 없으므로 없음/미사용으로 유지하고 production route에 매핑하지 않는다.
- Deep module guardrails:
  - `src/App.tsx`는 route 선택, 전역 shell 조립, auth/profile 상태 연결만 담당한다.
  - 화면별 데이터 로딩/뮤테이션은 `*Container.tsx`에 둔다.
  - 화면별 JSX와 pixel work는 `*Screen.tsx`에 둔다.
  - 화면 props 계약은 `contract.ts`에 둔다.
  - read model에서 screen props로 바꾸는 로직은 `mapping.ts`에 둔다.
  - 도메인, 서버, Firebase, API 로직을 presentational component로 끌어올리지 않는다.
  - pixel-only phase에서는 `src/services/**`, `src/server/**`, `server.ts`, `firestore.rules`를 수정하지 않는다. PRD 기능 정합성 때문에 서비스 경계 수정이 필요한 경우 별도 phase에서 테스트 근거를 먼저 명시한다.
- 체크박스 체크 조건:
  - 각 체크박스는 한 화면 또는 한 정책만 다룬다.
  - 구현 diff, 테스트 결과, production PNG evidence 또는 명시된 수동 검증 근거가 있어야 체크할 수 있다.
  - 나중 phase 결과가 선행되어야 하는 항목은 체크하지 않는다.
  - 어떤 체크박스도 나중 phase의 PNG, 나중 phase의 구현, 나중 phase의 테스트를 완료 조건으로 삼지 않는다.
  - later visual confirmation은 completion condition이 아니라 downstream note로만 적는다.
  - 시각/pixel 작업 체크박스가 PNG를 요구하면 그 PNG는 같은 체크박스 또는 같은 phase 안에서 생성되어야 한다.
  - completion note는 체크박스 아래에 한 줄로 남긴다.
  - 별도 보고 산출물이 꼭 필요하면 프로젝트 규칙에 따라 한국어 HTML만 사용한다. Markdown/JSON 보고 파일은 만들지 않는다.
- 금지사항:
  - `docs/PRD.md`는 절대 수정하지 않는다. PRD 오류가 의심되면 사용자에게 정정을 요청한다.
  - 이번 전체 작업에서 운영정책, 앱처럼 사용하기 안내, 이용약관, 로그인 화면 정책/약관 링크를 MVP 기능으로 되살리지 않는다.
  - 중앙 하단 눈 인디케이터를 클릭 가능한 button/action으로 구현하지 않는다.
  - 고민 작성 진입점을 하단 중앙 눈 또는 답변하기 화면에 추가하지 않는다.
  - pixel evidence 디렉터리에 `measurement.md`, `implementation-notes.md`, `verification.md`, JSON 리포트 등 Markdown/JSON 부가 산출물을 남기지 않는다.
  - HTML 보고 파일을 남길 경우 파일 내용은 실제 HTML 문서여야 하며 한국어로 작성한다.
- 공통 검증 명령:
  - 계획 작성 검증: `git diff -- docs/TODO.md`, `npm run validate:design-reference`
  - 구현 phase 완료 검증: `npm test`, `npm run lint`, `npm run build`, `npm run test:rules`, `npm run validate:design-reference`
- Phase별 production PNG evidence 규칙:
  - production PNG evidence는 `tmp/*-pixel-alignment/*-production.png` 패턴을 따른다. 기존 온보딩 precedent는 `tmp/onboarding-pixel-alignment/**-production.png`다.
  - 산출물 디렉터리에는 production 화면 캡처 PNG를 반드시 남긴다.
  - 측정 결과나 판단 근거를 파일로 남겨야 할 때만 한국어 HTML 보고 파일을 함께 둘 수 있다.
  - PNG 파일명은 route/screen/state를 알 수 있게 `*-production.png` suffix를 사용한다.
  - PNG는 reference PNG 복사본이면 안 된다.
  - full production route 캡처를 우선한다.
  - full route가 auth/Firebase/seed data 때문에 pixel 검증을 흐리면, production source의 `*Screen.tsx`를 직접 import하는 임시 Vite harness를 허용한다. 이 경우 보고 문구와 파일명/HTML note에 `harness component capture`임을 명시하고, route/Container 검증은 별도 테스트로 닫는다.
  - 캡처 자동화에 필요한 일시적 파일은 생성 후 제거한다. 단, 재현성을 위해 harness를 남길 때는 `tmp/*-pixel-alignment/harness/**` 아래에만 두고 production 코드와 분리한다.
  - 모든 PNG는 393x852 reference PNG와 비교 가능한 production capture인지 확인한다.

## Completion Note Template

각 체크박스 아래 completion note에는 체크 전에 다음을 기록한다. 해당 없는 항목은 `해당 없음`으로 적는다.

- changed files: 실제 변경 파일 목록.
- test command/result: 실행한 검증 명령과 성공/실패/스킵 사유.
- production PNG path: visual/pixel 체크박스의 `*-production.png` 경로.
- capture type: `full route` 또는 `harness component`.
- harness route/data verification: harness component capture인 경우 route/Container test 이름 또는 수동 route 검증 방법.
- reference PNG path: 비교한 `design/reference/pngs/screens/*.png`.
- measured result: reference/production size, dominant colors, non-bg bbox, 주요 bbox 차이.
- tolerated difference: 허용한 차이가 있으면 이유와 픽셀 범위.

## Reproducible Pixel Evidence Workflow

성공 사례인 `tmp/onboarding-pixel-alignment` 방식은 엄밀한 pixel-by-pixel diff가 아니라, PNG-measured coordinate alignment와 manual visual review를 위한 evidence workflow다. 이후 phase도 이 수준을 기본으로 삼고, 더 엄밀한 diff가 필요하면 별도 체크박스로 추가한다.

1. `npm run build`로 production CSS를 만든다.
2. `ls dist/assets/index-*.css`로 현재 CSS hash를 확인한다.
3. harness를 쓰는 경우 harness entry의 CSS import를 현재 hash에 맞춘다. 예: `import '../../../../dist/assets/index-BKXD6mF0.css';`
4. concrete harness example: `npx vite tmp/<screen-or-phase>-pixel-alignment/harness --host 127.0.0.1 --port 5177`
5. Playwright 또는 동등한 브라우저 자동화로 viewport `393x852`, `deviceScaleFactor: 1`, `fullPage: false` 캡처를 만든다.
6. concrete capture conditions:
   - viewport: `{ width: 393, height: 852 }`
   - deviceScaleFactor: `1`
   - screenshot: `{ fullPage: false, path: 'tmp/<screen-or-phase>-pixel-alignment/<screen>-production.png' }`
7. PIL로 reference PNG와 production PNG의 size, dominant colors, non-bg bbox, 주요 element bbox를 측정한다.
8. 결과는 체크박스 completion note에 요약한다. 파일 보고가 필요하면 한국어 HTML table/report로 작성한다.

Required capture note fields:

- `capture type: full route` 또는 `capture type: harness component`
- source route 또는 source screen/component
- harness component capture인 경우 route/Container verification method
- reference PNG path
- production PNG path
- measured size
- dominant colors
- non-bg bbox
- known tolerated difference, if any

Onboarding 선례의 정확한 표현:

- `03-production.png`, `04-production.png`, `05-production.png`는 full app route가 아니라 production `OnboardingScreen.tsx`를 임시 harness에서 렌더링한 component capture다.
- 04 duplicate 상태는 harness가 `duplicateCheck.state = 'duplicate'`와 기존 message prop을 주입해 만든다.
- 05 interests 상태는 harness가 기본정보 화면에서 `관심사 선택으로 이동` 버튼을 자동 클릭해 만든다.
- 따라서 온보딩 evidence는 route/Auth/Firebase 검증이 아니라 presentational component pixel 검증이다.

## Fresh Measurement Anchors

### Already Implemented Onboarding Regression Anchors

| Screen | Item | Fresh PNG-measured bbox/value |
|---|---|---|
| 03 | size | `393x852` |
| 03 | dominant colors | `#fff7e3` 226111 px, `#ff8b0d` 92531 px |
| 03 | non-bg bbox | `(0,21)-(393,843)`; harness production observed `(0,20)-(393,843)` |
| 03 | status/time | `(30,18)-(74,34)` |
| 03 | header title | `(165,70)-(222,87)` |
| 03 | question badge | `(30,127)-(118,147)` |
| 03 | main title | `(28,141)-(253,175)` |
| 03 | progress | `(24,235)-(369,241)` |
| 03 | subtitle | `(24,258)-(350,277)` |
| 03 | nickname input | `(22,339)-(367,399)` |
| 03 | gender boxes | `(22,452)-(367,512)` |
| 03 | age input | `(22,580)-(367,640)` |
| 03 | CTA | `(24,752)-(369,808)` |
| 03 | harness production dominant colors | `#fff7e3` 227032 px, `#ff8b0d` 92271 px, `#ffffff` 2517 px, `#d4be91` 1149 px |
| 04 | size | `393x852` |
| 04 | dominant colors | `#fff7e3` 224562 px, `#ff8b0d` 92531 px |
| 04 | non-bg bbox | `(0,21)-(393,843)`; harness production observed `(0,20)-(393,843)` |
| 04 | duplicate message | `(89,308)-(365,323)` |
| 04 | red error/input bbox | `(22,308)-(367,399)` |
| 04 | other major boxes | same as 03 |
| 04 | harness production dominant colors | `#fff7e3` 224658 px, `#ff8b0d` 73956 px, `#ffbb6d` 18316 px, `#ffffff` 2517 px |
| 05 | size | `393x852` |
| 05 | dominant colors | `#fff7e3` 163556 px, `#ff8b0d` 88103 px, `#fff1d1` 57070 px |
| 05 | non-bg bbox | `(0,21)-(393,843)`; harness production observed `(0,20)-(393,843)` |
| 05 | header title | `(171,70)-(228,87)` |
| 05 | question badge | `(30,127)-(120,147)` |
| 05 | main title | `(28,141)-(287,175)` |
| 05 | subtitle/helper | `(24,258)-(365,296)` |
| 05 | chip grid outer | `(34,322)-(358,708)` |
| 05 | chip size/gap | each `103x44`; gap-x `7`, gap-y `13` |
| 05 | previous CTA | `(24,752)-(120,808)` |
| 05 | complete CTA | `(130,752)-(369,808)` |
| 05 | harness production dominant colors | `#fff7e3` 162335 px, `#ff8b0d` 87536 px, `#fff1d1` 56157 px, `#d4be91` 6438 px |
| 05 | label exception | domain value `워라밸` 유지, display label만 reference PNG에 맞춰 `워라벨` |

### 06~20 Initial PIL Anchor Summary

아래 표는 Phase 0에서 inventory 목적으로 확인하는 초기 요약값이다. Phase 0은 reference PNG 존재, size, dominant colors, non-bg bbox, phase assignment, special state classification까지만 고정한다. 주요 element bbox, text/glyph bbox, 버튼 bbox, 하단바 bbox, safe-area/home-indicator 제외 여부, production capture 비교는 각 화면 phase의 첫 측정 체크박스에서 수행한다.

| Screen | Size | Dominant colors | Non-bg bbox | Lower-area bbox from y>=650 |
|---|---|---|---|---|
| 06 | `393x852` | `#ffffff` 181468 px, `#ff8b3d` 54530 px, `#fff1d1` 35241 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 07 | `393x852` | `#fff5eb` 201042 px, `#fff1d1` 101783 px, `#ff8b3d` 17679 px | `(0,0)-(393,828)` | `(0,650)-(393,828)` |
| 08 | `393x852` | `#ffffff` 195303 px, `#fff1d1` 75583 px, `#fff5eb` 12101 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 09 | `393x852` | `#ada48e` 96655 px, `#ada7a0` 76675 px, `#ffffff` 71853 px | `(0,21)-(393,852)` | `(0,650)-(393,852)` |
| 10 | `393x852` | `#ffffff` 145916 px, `#ff8b0d` 129361 px, `#fff5eb` 18912 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 11 | 없음/미사용 | reference PNG 없음 | production route 매핑 금지 | screen-map 매핑 금지 |
| 12 | `393x852` | `#fff7e3` 160903 px, `#ff8b0d` 92763 px, `#fff1d1` 56994 px | `(0,0)-(393,843)` | `(24,650)-(369,843)` |
| 13 | `393x852` | `#ff8b0d` 173469 px, `#ffffff` 103655 px, `#fff5eb` 18586 px | `(0,21)-(393,852)` | `(0,751)-(393,852)` |
| 14 | `393x852` | `#ffffff` 205773 px, `#ff8b0d` 82259 px, `#fff5eb` 18586 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 15 | `393x852` | `#adadad` 91956 px, `#ad5f09` 90140 px, `#ffffff` 59897 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 16 | `393x852` | `#adadad` 91956 px, `#ad5f09` 90140 px, `#ffffff` 59324 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 17 | `393x852` | `#fff5eb` 156619 px, `#fff1d1` 106351 px, `#ffffff` 32146 px | `(0,0)-(393,828)` | `(0,650)-(393,828)` |
| 18 | `393x852` | `#ffffff` 161394 px, `#ada48e` 62959 px, `#adadad` 17319 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 19 | `393x852` | `#ada48e` 97421 px, `#ffffff` 71429 px, `#ada7a0` 43148 px | `(0,0)-(393,852)` | `(0,650)-(393,852)` |
| 20 | `393x852` | `#fff1d1` 130921 px, `#ffffff` 110161 px, `#ff8b3d` 51555 px | `(0,0)-(393,852)` | `(0,714)-(393,852)` |

## Screen Mapping Inventory

| Screen | Reference PNG | Current implementation status | Primary production files |
|---|---|---|---|
| 01 | `01-splash.png` | implemented; regression only | `src/screens/loadingShell/LoadingShellScreen.tsx`, `src/screens/loadingShell/contract.ts` |
| 02 | `02-login.png` | implemented; regression only | `src/screens/loadingShell/LoginScreen.tsx`, `src/screens/loadingShell/contract.ts` |
| 03 | `03-onboarding-basic.png` | implemented; regression only | `src/screens/onboarding/OnboardingScreen.tsx`, `src/screens/onboarding/OnboardingContainer.tsx` |
| 04 | `04-onboarding-duplicate.png` | implemented; regression only | `src/screens/onboarding/OnboardingScreen.tsx`, `src/screens/onboarding/OnboardingContainer.tsx` |
| 05 | `05-onboarding-interests.png` | implemented; regression only | `src/screens/onboarding/OnboardingScreen.tsx`, `src/screens/onboarding/OnboardingContainer.tsx` |
| 06 | `06-received-worries.png` | implement PRD + pixel | `src/screens/receivedWorries/*`, `src/screens/shared/*`, `src/services/appShell/*` |
| 07 | `07-question-write-a.png` | implement PRD + pixel | `src/screens/writeForm/*`, `src/services/appShell/*` |
| 08 | `08-answer-check.png` | implement PRD + pixel | new `src/screens/answerCheck/*` deep module; keep `replyDetail` only for legacy removal work |
| 09 | `09-question-write-b.png` | implement success route + pixel | `src/screens/writeForm/*`, `src/services/appShell/*` |
| 10 | `10-my-page.png` | implement PRD cleanup + pixel | `src/screens/myPage/*` |
| 11 | none | 없음/미사용 | no production route, no screen-map entry |
| 12 | `12-edit-interests.png` | implement PRD + pixel | `src/screens/myPage/*` |
| 13 | `13-my-answers.png` | implement PRD + pixel | `src/screens/myPage/*` |
| 14 | `14-privacy-policy.png` | implement PRD + pixel | `src/screens/myPage/*`, `src/services/policyDocuments/*` only if needed |
| 15 | `15-logout.png` | implement overlay + pixel | `src/screens/myPage/*` |
| 16 | `16-account-deletion.png` | implement overlay + pixel | `src/screens/myPage/*`, `src/services/userAccount/*` only if policy test requires |
| 17 | `17-answer-write-1.png` | implement PRD + pixel | `src/screens/writeForm/*` |
| 18 | `18-answer-write-2.png` | implement overlay + pixel | `src/screens/writeForm/*` |
| 19 | `19-answer-write-3.png` | implement success route + pixel | `src/screens/writeForm/*`, `src/services/appShell/*` |
| 20 | `20-my-worries.png` | implement PRD + pixel | `src/screens/myPage/*`, `src/services/appShell/*` |

## Phase 0: Inventory, PRD Diff, Design Measurement Plan

목표: PRD, route, design asset, current code의 차이를 구현 가능한 작업 단위로 고정한다.
허용 수정 범위: `docs/TODO.md` completion notes only.
금지 수정 범위: `src/**`, `packages/**`, `design/**`, `docs/PRD.md`.

- [x] TODO-P0.1: `docs/PRD.md`의 06~20 화면 요구사항, MVP 제외 범위, 제출 후 route, 중앙 눈 인디케이터, 정책 문서 범위를 TODO completion note 표로 확정한다.
  - 대상 파일: `docs/PRD.md`, `docs/TODO.md`
  - 완료 기준: 06~20 각 화면이 어느 phase에서 닫히는지와 MVP 제외 항목이 문서 안에서 추적 가능하다.
  - 검증: `rg -n "중앙 눈|앱처럼 사용하기|운영정책|09-question|19-answer|정책을 준비" docs/PRD.md`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `rg -n "중앙 눈|앱처럼 사용하기|운영정책|09-question|19-answer|정책을 준비|내가 쓴 답변 상세|하단 중앙|우측 하단 메시지|개인정보처리방침" docs/PRD.md` 성공. 관련 PRD 문구 확인.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - PRD trace table:
      | Screen/Policy | PRD requirement | Owning phase/TODO |
      |---|---|---|
      | 06 received worries | 답변하기 탭, 좌상단 눈 기능 없음, 우상단 마이페이지 이동, 고민 박스 클릭 시 답변 작성, 건너뛰기는 확인 모달 없이 패스, empty `지금은 도착한 고민이 없어요.`, loading spinner. | Phase 3 / TODO-P3.1~P3.10 |
      | 07 question write | 나의 고민 탭 우측 하단 메시지 버튼에서만 진입, 뒤로 가기는 나의 고민 탭, 제목 없는 본문, 빈/공백 제출 불가, 1000자 제한, pencil placeholder, 성공 시 09. | Phase 4 / TODO-P4.3, Phase 5 / TODO-P5.1~P5.8 |
      | 08 answer check | 내 고민과 여러 답변 확인/피드백, 뒤로 가기는 나의 고민 탭, 답변 0개면 내 고민만 표시, 좋아요/싫어요/코멘트 정책 적용. | Phase 7 / TODO-P7.1~P7.11 |
      | 09 question write success | 고민 제출 성공 후 `09-question-write-b.png` 기준 성공 확인 화면, 확인 버튼만 상호작용, 확인 후 나의 고민 탭. | Phase 1 / TODO-P1.4, Phase 5 / TODO-P5.6~P5.8 |
      | 10 my page | 닉네임, 받은 좋아요/하트 총합(`helpedCount`), 관심 분야 수정, 내가 쓴 답변 preview/전체보기, 알림 설정, 개인정보처리방침, 로그아웃, 탈퇴. 성별/나이 수정 및 표시 제외. | Phase 8 / TODO-P8.1~P8.12 |
      | 11 none/unused | reference PNG 없음. production route와 screen-map에 매핑하지 않음. | Phase 0 inventory, Phase 12 final audit |
      | 12 edit interests | 온보딩과 동일한 관심 분야 3열, 버튼 크기 고정, 0개 저장 시 안내, 저장 성공 후 마이페이지, 실패 시 기존 선택 유지. | Phase 8 / TODO-P8.1, TODO-P8.6, TODO-P8.12 |
      | 13 my answers | 내가 작성한 모든 답변 동일 형식, 좋아요는 하트, 코멘트는 1개 작은 폰트, 싫어요는 피드백 없음처럼 표시, 상세 화면 없음. | Phase 8 / TODO-P8.1, TODO-P8.7, TODO-P8.10, TODO-P8.12 |
      | 14 privacy policy | `docs/privacy_policy.md`를 source of truth로 삼을 수 있어야 하며, 비어 있으면 `정책을 준비 중입니다.` 표시. | Phase 8 / TODO-P8.11, TODO-P8.12 |
      | 15 logout overlay | 마이페이지 위 overlay/dialog, 취소 시 마이페이지 복귀, 로그아웃 시 02 로그인 이동, 배경 하단바 클릭 불가. | Phase 9 / TODO-P9.1~P9.6 |
      | 16 account deletion overlay | 마이페이지 위 overlay/dialog, 취소 시 마이페이지 복귀, 탈퇴 시 계정 비활성화 후 02 로그인 이동, 배경 하단바 클릭 불가. | Phase 9 / TODO-P9.1~P9.6 |
      | 17 answer write | 답변하기 탭 고민 선택으로 진입, 뒤로 가기는 답변하기 탭 및 draft 폐기, 요약/카테고리/생성시각/답변 입력 표시, 요약 박스 클릭 시 18 overlay. | Phase 6 / TODO-P6.1~P6.10 |
      | 18 answer original overlay | 17 위 원문 확인 overlay, 닫기 시 17 복귀, 작성 중 답변 draft 유지. | Phase 6 / TODO-P6.1, TODO-P6.5, TODO-P6.10 |
      | 19 answer write success | 답변 제출 성공 후 `19-answer-write-3.png` 기준 성공 확인 화면, 확인 후 답변하기 탭, 답변한 고민은 즉시 사라짐. | Phase 1 / TODO-P1.4, Phase 6 / TODO-P6.8, TODO-P6.10 |
      | 20 my worries | 나의 고민 탭, 좌상단 눈 기능 없음, 우상단 마이페이지 이동, 고민 박스 클릭 시 답변 확인, 우측 하단 메시지 버튼만 고민 작성 진입점, empty `첫 고민을 남겨보세요.`. | Phase 4 / TODO-P4.1~P4.9 |
      | central bottom eye | 전 화면 비상호작용 인디케이터. 하단 중앙 눈은 고민 작성 진입점이 아니며 버튼/액션/메뉴가 아님. | Phase 1 / TODO-P1.1~P1.3 |
      | excluded MVP routes/policies | 운영정책, 이용약관, 이용 안내 전용 화면, 앱처럼 사용하기 안내, 로그인 화면 정책/약관 링크, 내가 쓴 답변 상세 화면 제외. | Phase 1 / TODO-P1.5, Phase 8 / TODO-P8.2, TODO-P8.10 |
      | static mobile chrome | reference PNG의 status bar, network, battery, home indicator는 production UI에서 구현하지 않음. | Phase 2 / TODO-P2.2 and each pixel phase |
- [x] TODO-P0.2: 현재 route 목록을 `src/services/appShell/prdNavigationPolicy.ts`와 `src/services/appShell/routeRenderingBoundary.ts`에서 추출하고 PRD route와 불일치하는 항목을 completion note에 기록한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/routeRenderingBoundary.ts`
  - 완료 기준: `operation_policy`, `app_install_guide`, `notification_settings`, `my_answer_detail`, 중앙 액션, 성공 route 불일치가 누락 없이 기록된다.
  - 검증: `rg -n "operation_policy|app_install_guide|notification_settings|my_answer_detail|CENTRAL_BOTTOM_NAVIGATION_ACTION|routeAfterWorryPublish|routeAfterReplyPublish" src/services/appShell src/App.tsx`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `rg -n "operation_policy|app_install_guide|notification_settings|my_answer_detail|read_my_reply|CENTRAL_BOTTOM_NAVIGATION_ACTION|routeToWriteWorry|routeAfterWorryPublish|routeAfterReplyPublish|MY_PAGE_MORE_ITEMS|MY_PAGE_SUBROUTES" src/services/appShell src/App.tsx` 성공.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - route mismatch table:
      | Current route/item | Current location | PRD status | Owning downstream TODO |
      |---|---|---|---|
      | `operation_policy` | `AppRoute`, `MY_PAGE_MORE_ITEMS`, `MY_PAGE_SUBROUTES`, `REQUIRED_PHASE_2_ROUTE_STATES`, `ROUTE_RENDERING_BOUNDARY`, `App.tsx` account route dispatch | MVP 제외: 운영정책 화면 제외, 접근 가능한 정책 문서는 개인정보처리방침 하나 | TODO-P1.5, TODO-P8.2, TODO-P8.3 |
      | `app_install_guide` | `AppRoute`, `MY_PAGE_MORE_ITEMS`, `MY_PAGE_SUBROUTES`, `ROUTE_RENDERING_BOUNDARY`, `App.tsx` account route dispatch | MVP 제외: 앱처럼 사용하기 안내/별도 설치 안내 영역 제외 | TODO-P1.5, TODO-P8.2, TODO-P8.3 |
      | `notification_settings` | `AppRoute`, `MY_PAGE_MORE_ITEMS`, `MY_PAGE_SUBROUTES`, `ROUTE_RENDERING_BOUNDARY`, `App.tsx` account route dispatch | PRD 10에는 푸시 알림 설정 기능이 있으나 TODO Phase 1은 route/item 제거 대상으로 둠. Phase 0 결정: 별도 route 불일치로 기록하고, 10 화면 내 토글 구현 여부는 Phase 8에서 확인 필요. | TODO-P1.5, TODO-P8.4, TODO-P8.5 |
      | `my_answer_detail` | `AppRouteState`, `routeAfterReplyPublish`, `routeToMyReplyDetail`, `backRouteForRoute`, `tabForRoute`, `ROUTE_RENDERING_BOUNDARY`, `App.tsx` `ReplyDetailContainer` rendering | MVP 제외: 내가 쓴 답변 상세 화면 제공하지 않음. 답변 제출 성공은 19 success screen 필요. | TODO-P1.4, TODO-P8.10 |
      | `read_my_reply` | `AppRouteState`, `backRouteForRoute`, `tabForRoute`, `ROUTE_RENDERING_BOUNDARY`, `App.tsx` `ReplyDetailContainer` rendering | `my_answer_detail` 계열 legacy/detail route로 보이며 MVP의 내가 쓴 답변 상세 미제공 정책과 긴장. | TODO-P8.10 |
      | `CENTRAL_BOTTOM_NAVIGATION_ACTION` | `prdNavigationPolicy.ts` targetRoute `write_worry`; `App.tsx` `BottomNavigation`에 전달 | PRD 위반: 중앙 하단 눈은 전 화면 비상호작용 인디케이터이며 고민 작성 진입점 아님. | TODO-P1.1, TODO-P1.2 |
      | `routeToWriteWorry` | `prdNavigationPolicy.ts`에서 중앙 액션 targetRoute 반환; `App.tsx` `onCentralAction={() => setView(routeToWriteWorry())}` | PRD 위반: 고민 작성 진입점은 20 나의 고민 탭 우측 하단 메시지 버튼. | TODO-P1.3, TODO-P4.3 |
      | `routeAfterWorryPublish` | `prdNavigationPolicy.ts` returns `{ route: 'my_worry_detail', worryId }` | PRD 위반: 고민 제출 성공 후 09 success route, 확인 후 나의 고민 탭. 작성한 고민 상세 자동 이동 없음. | TODO-P1.4, TODO-P5.6, TODO-P5.7 |
      | `routeAfterReplyPublish` | `prdNavigationPolicy.ts` returns `{ route: 'my_answer_detail', ... }` | PRD 위반: 답변 제출 성공 후 19 success route, 확인 후 답변하기 탭. 내가 쓴 답변 상세 없음. | TODO-P1.4, TODO-P6.8, TODO-P8.10 |
      | `MY_PAGE_MORE_ITEMS` | includes `notification_settings`, `app_install_guide`, `privacy_policy`, `operation_policy`, `logout`, `delete_account` | 운영정책/앱 설치 안내는 제외. 알림 설정은 기능 요구와 별도 route 제거 계획 사이 확인 필요. | TODO-P1.5, TODO-P8.2, TODO-P8.5 |
      | `MY_PAGE_SUBROUTES` | includes `operation_policy`, `notification_settings`, `app_install_guide` | 개인정보처리방침 외 정책/안내 route는 MVP 제외. 알림 설정 route는 화면 내 토글로 흡수될 가능성. | TODO-P1.5, TODO-P8.3, TODO-P8.5 |
      | `ROUTE_RENDERING_BOUNDARY` | authenticated shell, my-page/account, policy screens include excluded/detail routes | MVP 제외 route가 rendering boundary에 남아 있음. | TODO-P1.5, TODO-P8.10 |
      | App shell central action | `src/App.tsx` imports `CENTRAL_BOTTOM_NAVIGATION_ACTION`/`routeToWriteWorry`; passes `centralAction` and `onCentralAction` to `BottomNavigation` | PRD 위반: 중앙 눈 액션 금지. | TODO-P1.1~P1.3 |
- [x] TODO-P0.3: `design/reference/pngs/screens`의 실제 파일 목록을 확인하고 01~20 존재/미존재/이미 구현/구현 필요 상태를 이 파일의 Screen Mapping Inventory와 대조한다.
  - 대상 파일: `design/reference/pngs/screens/*`, `docs/TODO.md`
  - 완료 기준: 11번이 없음/미사용으로 명시되고 06~20 중 존재하는 reference PNG가 모두 phase에 배정된다.
  - 검증: `find design/reference/pngs/screens -maxdepth 1 -type f | sort`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `find design/reference/pngs/screens -maxdepth 1 -type f | sort` 성공. 01~10 존재, 11 없음, 12~20 존재 확인.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - screen mapping check:
      | Screen | PNG exists? | Current TODO assignment | Phase 0 decision |
      |---|---:|---|---|
      | 01 | yes | regression only | 유지 |
      | 02 | yes | regression only | 유지 |
      | 03 | yes | regression only | 유지 |
      | 04 | yes | regression only | 유지 |
      | 05 | yes | regression only | 유지 |
      | 06 | yes | implement PRD + pixel | Phase 3 유지 |
      | 07 | yes | implement PRD + pixel | Phase 5 유지; 진입점은 Phase 4/1에서 정리 |
      | 08 | yes | implement PRD + pixel | Phase 7 유지 |
      | 09 | yes | implement success route + pixel | Phase 5 유지 |
      | 10 | yes | implement PRD cleanup + pixel | Phase 8 유지 |
      | 11 | no | 없음/미사용 | production route/screen-map 매핑 금지 |
      | 12 | yes | implement PRD + pixel | Phase 8 유지 |
      | 13 | yes | implement PRD + pixel | Phase 8 유지 |
      | 14 | yes | implement PRD + pixel | Phase 8 유지 |
      | 15 | yes | implement overlay + pixel | Phase 9 유지 |
      | 16 | yes | implement overlay + pixel | Phase 9 유지 |
      | 17 | yes | implement PRD + pixel | Phase 6 유지 |
      | 18 | yes | implement overlay + pixel | Phase 6 유지 |
      | 19 | yes | implement success route + pixel | Phase 6 유지 |
      | 20 | yes | implement PRD + pixel | Phase 4 유지 |
- [x] TODO-P0.4: 06~20 PNG를 PIL로 재측정해 inventory 수준의 size, dominant colors, non-bg bbox, special state classification을 completion note로 보강한다.
  - 대상 파일: `design/reference/pngs/screens/*.png`, `docs/TODO.md`
  - 완료 기준: 이 파일의 06~20 Initial PIL Anchor Summary가 size, dominant colors, non-bg bbox, phase assignment, special state classification을 포함한다.
  - 검증: PIL 기반 일회성 명령 또는 스크립트 출력값을 TODO completion note에 기록한다.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: PIL one-off measurement 성공. 06~20 size/dominant colors/non-bg bbox/lower-area bbox 확인.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - measured result: `06~20 Initial PIL Anchor Summary`와 일치. 불일치 항목 없음.
    - special state classification:
      | Screen | Classification | Reason |
      |---|---|---|
      | 06 | base list screen | received worries |
      | 07 | write form | worry write initial |
      | 08 | answer check | publisher answer check |
      | 09 | success screen | worry publish success |
      | 10 | my page | settings/profile |
      | 11 | none/unused | no reference PNG |
      | 12 | edit interests | interests chip grid |
      | 13 | my answers | answer history |
      | 14 | policy screen | privacy policy |
      | 15 | overlay/dialog | logout |
      | 16 | overlay/dialog | account deletion |
      | 17 | write form | reply write |
      | 18 | overlay/dialog | original worry overlay |
      | 19 | success screen | reply publish success |
      | 20 | base list screen | my worries |
- [x] TODO-P0.5: 03/04/05 Fresh Measurement Anchors를 온보딩 회귀 방지 기준으로 유지한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/03-onboarding-basic.png`, `04-onboarding-duplicate.png`, `05-onboarding-interests.png`
  - 완료 기준: 03/04/05 anchor values와 harness component capture classification이 문서에 남아 있고, 이 precedent가 full app route 검증이 아님을 문서가 명시한다.
  - 검증: `rg -n "Already Implemented Onboarding Regression Anchors|harness component capture|03 |04 |05 " docs/TODO.md`
  - production PNG evidence: 없음. Phase 0에서는 anchor/classification만 보존하고, onboarding regression PNG evidence 확인 또는 재생성은 TODO-P12.4에서 수행한다.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `rg -n "Already Implemented Onboarding Regression Anchors|harness component capture|03 |04 |05 |duplicate|interests|TODO-P12.4" docs/TODO.md` 성공. `tmp/onboarding-pixel-alignment/**`는 선례 확인용으로만 읽었고 수정하지 않음.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - onboarding anchor preservation: 03/04/05 reference size `393x852`, dominant colors, non-bg bbox, 주요 bbox가 `Fresh Measurement Anchors`에 유지됨. `03-production.png`, `04-production.png`, `05-production.png`는 full app route가 아니라 production `OnboardingScreen.tsx`를 임시 harness에서 렌더링한 `harness component capture`로 명시됨. 04 duplicate는 harness prop `duplicateCheck.state = 'duplicate'`, 05 interests는 harness의 `관심사 선택으로 이동` 버튼 자동 클릭 상태로 명시됨. 온보딩 regression PNG evidence 확인/재생성은 Phase 0이 아니라 TODO-P12.4 소유로 유지.
- [x] TODO-P0.6: phase별 production PNG evidence 경로 규칙을 고정한다.
  - 대상 파일: `docs/TODO.md`
  - 완료 기준: 각 phase에 `tmp/*-pixel-alignment/*-production.png` 경로가 명시되고, 추가 보고 산출물은 한국어 HTML만 허용됨이 명시된다.
  - 검증: `rg -n "production PNG evidence|한국어 HTML|\\*-production\\.png|harness component capture" docs/TODO.md`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `rg -n "production PNG evidence|한국어 HTML|\\*-production\\.png|harness component capture|measurement\\.md|implementation-notes\\.md|verification\\.md|JSON" docs/TODO.md` 성공. Global Execution Rules에 `tmp/*-pixel-alignment/*-production.png` 패턴을 명시적으로 보강함.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - evidence rule lock: production PNG evidence는 `tmp/*-pixel-alignment/*-production.png` 패턴, route/screen/state 식별 가능한 `*-production.png` 파일명, reference PNG 복사본 불인정, full production route capture 우선, 필요 시 production `*Screen.tsx` import 임시 Vite harness 허용, 남기는 harness는 `tmp/*-pixel-alignment/harness/**` 한정, 추가 보고 파일은 실제 한국어 HTML 문서만 허용, `measurement.md`/`implementation-notes.md`/`verification.md`/JSON 리포트 금지로 확인.
- [x] TODO-P0.7: harness capture와 full route capture의 역할 분리를 phase별 completion note 양식에 고정한다.
  - 대상 파일: `docs/TODO.md`
  - 완료 기준: 각 production PNG evidence note에는 `capture type: full route` 또는 `capture type: harness component`가 포함되고, harness component인 경우 route/Container 검증 테스트명이 함께 기록된다.
  - 검증: completion note review.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: completion note review 성공. `Completion Note Template`와 `Reproducible Pixel Evidence Workflow`에 필수 note fields가 이미 존재함을 확인.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - capture role lock: 각 evidence note에는 `capture type: full route` 또는 `capture type: harness component`, source route 또는 source screen/component, harness인 경우 route/Container verification method, reference PNG path, production PNG path, measured size, dominant colors, non-bg bbox, tolerated difference를 기록해야 함. `harness component capture`는 presentational pixel 검증에는 유효하지만 route/Auth/Firebase 검증을 대체하지 못하므로 route/Container 검증을 별도로 닫아야 함.
- [x] TODO-P0.8: 계획 작성 커밋 또는 구현 시작 전 변경 파일이 의도대로 제한되어 있는지 확인한다.
  - 대상 파일: `docs/TODO.md`
  - 완료 기준: 계획 작성 단계에서는 `docs/TODO.md` 외 변경이 없다.
  - 검증: `git diff --name-only`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md` only
    - test command/result:
      - `git diff --name-only`: `docs/TODO.md` only
      - `git diff -- docs/TODO.md`: Phase 0 completion notes/checkmarks and Global Execution Rules evidence path wording only
      - `npm run validate:design-reference`: pass
      - `npm test`: pass
      - `npm run lint`: pass
      - `npm run build`: pass
      - `npm run test:rules`: skipped; Phase 0 문서 변경만 수행했고 Firestore rules/server 변경 없음
    - production PNG path: 해당 없음
    - capture type: 해당 없음

검증 명령:
- `git diff -- docs/TODO.md`
- `npm run validate:design-reference`

완료 보고 형식:
- 변경 파일, route 불일치 목록, screen mapping 상태, 측정 보강 여부를 한국어로 보고한다.

## Phase 1: Navigation/App Shell PRD Cleanup

목표: 중앙 눈을 비상호작용 인디케이터로 바꾸고 PRD route flow를 안정화한다.
허용 수정 범위: `src/services/appShell/**`, `src/screens/shared/uiContract.ts`, `src/screens/shared/ui.tsx`, `src/App.tsx`, 관련 appShell/shared tests.
금지 수정 범위: 화면 pixel 세부 조정, `src/services/**` domain/API/server logic, `src/server/**`, `server.ts`, `firestore.rules`.

- [x] TODO-P1.1: `BottomNavigationCentralAction` 계약을 제거하고 중앙 눈 인디케이터 계약으로 대체한다.
  - 대상 파일: `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
  - 완료 기준: `centralWriteWorryAction` primitive id가 제거 또는 indicator id로 대체되고, props에 `onCentralAction`/`targetRoute`가 없다.
  - 검증: `rg -n "BottomNavigationCentralAction|onCentralAction|centralWriteWorryAction|targetRoute" src/screens/shared`
  - production PNG evidence: 없음. Optional visual review only via TODO-P1.8; not a completion condition.
  - completion note:
    - changed files: `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `rg -n "BottomNavigationCentralAction|centralWriteWorryAction|onCentralAction|targetRoute|CENTRAL_BOTTOM_NAVIGATION_ACTION" src/screens/shared src/App.tsx src/services/appShell` found only negative assertion strings in `src/screens/shared/uiContract.test.ts`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.2: `BottomNavigation`에서 중앙 button/onClick을 제거하고 좌/우/마이페이지 특수 상태 indicator를 구현한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`
  - 완료 기준: 중앙 눈은 `button`이 아닌 visual element이고, 답변하기/나의 고민/마이페이지 상태별 하이라이트가 PRD 7.2와 일치한다.
  - 검증: shared UI rendering test에서 중앙 element가 click handler를 갖지 않음을 확인한다.
  - production PNG evidence: 없음. Optional visual review only via TODO-P1.8; not a completion condition.
  - completion note:
    - changed files: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `src/screens/shared/uiContract.test.ts` verifies central indicator has `role="presentation"`, `aria-hidden="true"`, `pointer-events-none`, and no `<button>`, `onClick`, or `data-target-route`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.3: `App.tsx`에서 `onCentralAction={() => setView(routeToWriteWorry())}` 경로를 제거한다.
  - 대상 파일: `src/App.tsx`
  - 완료 기준: App shell 중앙 눈에서 고민 작성으로 이동하는 경로가 제거되고, 작성 진입 route intent는 MyWorries 쪽 contract에서만 표현된다.
  - 검증: `rg -n "onCentralAction|routeToWriteWorry\\(\\)" src/App.tsx src/screens`
  - production PNG evidence: 없음. Downstream visual confirmation only: 20 phase에서 우측 하단 메시지 버튼을 확인하며, 이 체크박스의 완료 조건은 아니다.
  - completion note:
    - changed files: `src/App.tsx`, `src/screens/myPage/MyWorriesContainer.tsx` 확인, `src/services/appShell/prdNavigationPolicy.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `rg -n "routeToWriteWorry\\(\\)" src/App.tsx src/screens src/services/appShell` shows no `src/App.tsx` usage and only `MyWorriesContainer` write intent plus appShell helper/test. Phase 4/5 entry remains MyWorries-owned.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.4: 고민 제출 성공과 답변 제출 성공 route를 success confirmation route로 바꾼다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/screens/writeForm/containerPolicy.ts`, 관련 tests
  - 완료 기준: 고민 성공은 09 success screen route, 답변 성공은 19 success screen route로 이동하고 기존 `my_worry_detail`/`my_answer_detail` 자동 이동이 사라진다.
  - 검증: `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: 없음. Downstream visual confirmation only: 09/19 화면 phase에서 success screen PNG를 확인하며, 이 체크박스의 완료 조건은 아니다.
  - completion note:
    - changed files: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/writeForm/containerPolicy.test.ts`, `src/screens/writeForm/containerPolicy.ts` 확인
    - test command/result: `npm test` pass; `npm run lint` pass; `routeAfterWorryPublish` returns `{ route: 'write_worry_success' }`, `routeAfterReplyPublish` returns `{ route: 'write_reply_success' }`, confirmation helpers route to `나의 고민` and `답변하기`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.5: PRD 기준으로 MVP 제외 route/item을 제거한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/routeRenderingBoundary.ts`, `src/App.tsx`, appShell tests
  - 완료 기준: `operation_policy`, `app_install_guide`, `notification_settings`가 route 목록, subroute 목록, rendering boundary, settings dispatch에서 제거되거나 접근 불가 MVP 제외 상태로 고정된다.
  - 검증: `rg -n "operation_policy|app_install_guide|notification_settings" src/services/appShell src/App.tsx src/screens/myPage`
  - production PNG evidence: 없음. Downstream visual confirmation only: 10 phase에서 설정 항목 PNG를 확인하며, 이 체크박스의 완료 조건은 아니다.
  - completion note:
    - changed files: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/routeRenderingBoundary.ts`, `src/services/appShell/*test.ts`, `src/App.tsx`, `src/screens/myPage/*`, `src/screens/replyDetail/*`, `src/screens/importBoundaries.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `rg -n "operation_policy|app_install_guide|notification_settings" src/services/appShell src/App.tsx src/screens/myPage` shows only negative assertion strings in tests. `privacy_policy` remains. 알림 요구는 삭제하지 않고 별도 route/item만 제거했으며, 10 마이페이지 내부 알림 영역은 Phase 8에서 토글/상태로 정리한다.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.6: `App.tsx`의 전역 fixed header 책임을 제거하거나 중립화하고 header 소유권을 boundary 수준에서 분리한다.
  - 대상 파일: `src/App.tsx`, shared/screen contract boundary files only as needed
  - 완료 기준: `App.tsx`는 route selection, 전역 shell 조립, bottom navigation만 담당하고 per-screen visual header를 렌더링하지 않는다. 화면별 상단 좌측 눈/우측 마이페이지 버튼의 실제 위치/pixel 구현은 각 화면 phase가 소유한다.
  - 검증: `src/services/appShell/appMonolithGuardrail.test.ts`, `src/services/appShell/appShellBoundary.test.ts`
  - production PNG evidence: 없음. Downstream visual confirmation only: 각 화면 phase의 production PNG는 Phase 1 완료 조건이 아니다.
  - completion note:
    - changed files: `src/App.tsx`, `src/services/appShell/appShellBoundary.test.ts`, `src/services/appShell/appShellResponsibilityMap.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `src/services/appShell/appShellBoundary.test.ts` asserts no `header={routeBoundary.mountsAuthenticatedShell`, no `fixed top-0`, no App-level `Radio` header, no App-rendered `Qling` header button.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.7: appShell contract/route tests를 PRD route flow로 갱신한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.test.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/services/appShell/appShellBoundary.test.ts`
  - 완료 기준: 중앙 눈 클릭 불가, 작성 진입점 단일화, 07→09→20, 17→19→06, 20→08, 10→12/13/14/15/16이 테스트로 검증된다.
  - 검증: `npm test -- src/services/appShell` 또는 전체 `npm test`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/services/appShell/prdNavigationPolicy.test.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/services/appShell/appShellBoundary.test.ts`, related appShell policy files
    - test command/result: `npm test` pass. Exact `npm test -- src/services/appShell`, `npm test -- src/screens/shared`, `npm test -- src/screens/writeForm`, `npm test -- src/screens/myPage` fail in current npm script shape because `tsx --test "src/**/*.test.ts" <dir>` tries to import `<dir>/index.json`; full `npm test` covers and passes all repo tests.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P1.8: 이 phase에서 캡처가 필요하면 production PNG 중심으로 evidence를 남긴다.
  - 대상 파일: `tmp/*-pixel-alignment/*-production.png`
  - 완료 기준: 이 phase에서 visual confirmation을 수행한 경우 `tmp` 안에 production PNG가 남고, 추가 보고 파일이 필요하면 한국어 HTML만 남긴다. capture note 필수 필드를 기록한다.
  - 검증: `find tmp -path '*pixel-alignment*' -type f | sort`
  - production PNG evidence: 해당되는 `tmp/*-pixel-alignment/*-production.png`.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `find tmp -path '*pixel-alignment*' -type f | sort` shows only existing onboarding evidence files. `npm test`, `npm run lint`, `npm run build`, `npm run validate:design-reference`, `npm run test:rules` pass.
    - production PNG path: 해당 없음. Phase 1은 route/appShell cleanup phase이므로 production PNG 생성 없음. Downstream Phase 2~9에서 화면별 PNG evidence 생성.
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run validate:design-reference`

완료 보고 형식:
- route 변경 요약, 제거된 MVP 제외 route, 중앙 눈 계약 변경, 실패/스킵한 검증 명령을 보고한다.

## Phase 2: Shared Visual Primitives and Pixel Frame

목표: 393x852 production capture와 공통 UI primitive를 pixel work에 적합하게 안정화한다.
허용 수정 범위: `src/screens/shared/**`, `src/index.css`, shared tests, appShell test-only capture entry.
금지 수정 범위: domain/API/server/Firebase logic, 개별 화면 데이터 semantics.

- [x] TODO-P2.1: 393x852 reference canvas 기준 production preview/capture 방식을 구현한다.
  - 대상 파일: `src/index.css`, `src/screens/shared/ui.tsx`, capture-only route/test helper
  - 완료 기준: production route를 393x852 viewport로 캡처할 때 reference PNG와 같은 비교 기준을 얻는다.
  - 검증: 06 또는 20 한 화면을 393x852 production PNG로 캡처해 크기를 확인한다.
  - production PNG evidence: required in this checkbox: `tmp/shared-pixel-alignment/canvas-frame-production.png`.
  - completion note:
    - changed files: `src/index.css`, `src/screens/shared/ui.tsx`, `tmp/shared-pixel-alignment/harness/index.html`, `tmp/shared-pixel-alignment/harness/src/main.tsx`, `tmp/shared-pixel-alignment/canvas-frame-production.png`, `tmp/shared-pixel-alignment/measurements.html`
    - test command/result: `npm test` pass (`640 pass`, `1 skipped` rules placeholder), `npm run lint` pass, `npm run build` pass, `npm run validate:design-reference` pass, `npm run test:rules` pass (`77 pass`), PNG size check pass.
    - production PNG path: `tmp/shared-pixel-alignment/canvas-frame-production.png`
    - capture type: `harness component`
    - harness route/data verification: production `MobileAppShell`, `BottomNavigation`, `ReceivedWorriesScreen`, `CategoryChip`를 harness에서 렌더링했다. route/Auth/Firebase data path는 Phase 2 pixel frame 범위에서 제외하고 `src/screens/receivedWorries/mapping.test.ts`, `src/screens/writeForm/mapping.test.ts`, `src/screens/myPage/mapping.test.ts`, `src/screens/importBoundaries.test.ts`, `src/screens/shared/uiContract.test.ts`로 screen props 변환과 presentational-only 경계를 검증했다.
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: viewport `393x852`, deviceScaleFactor `1`, screenshot `fullPage:false`; reference size `(393, 852)`, production size `(393, 852)`; reference dominant `#ffffff 181468`, `#ff8b3d 54530`, `#fff1d1 35241`, `#fff5eb 16382`, `#2a2a2a 5007`; production dominant `#fff8ef 102526`, `#ffffff 91452`, `#fff3df 53968`, `#e07a5f 9271`, `#fef7ee 6730`; reference non-bg bbox `(0, 0, 393, 852)`, production non-bg bbox `(0, 22, 393, 852)`; reference SHA-256 `f430ba910b74b5814c933772c6cfae9a5ab30a59d73b1e88d0f7c891a526117f`, production SHA-256 `2442cc22b0ddc87806be4e7b72237e386fdf47e18e464770cbc9a9e860ff2fa6`.
    - tolerated difference: Phase 2는 shared primitive와 capture frame 안정화가 목표이므로 06 화면의 최종 pixel match는 수행하지 않는다. reference의 OS chrome 영역은 production DOM에서 의도적으로 제외한다.
- [x] TODO-P2.2: status bar/time/network/battery와 최하단 home indicator를 production UI에서 구현하지 않도록 검증한다.
  - 대상 파일: `src/index.css`, `src/screens/shared/ui.tsx`, screen files
  - 완료 기준: capture PNG가 393x852이더라도 OS chrome fake element는 production DOM에 없다.
  - 검증: screen DOM test 또는 수동 DOM inspection note.
  - production PNG evidence: 없음. Downstream visual confirmation only: 각 화면 phase의 production PNG는 이 체크박스의 완료 조건이 아니다.
  - completion note:
    - changed files: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.test.ts`, `src/screens/importBoundaries.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass. `src/screens/shared/uiContract.test.ts`의 `production shared primitives do not implement static mobile chrome`와 import boundary tests가 fake OS chrome 미구현을 검증한다.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`, `design/reference/pngs/screens/20-my-worries.png`
    - measured result: source/static DOM 검증에서 `status bar`, `battery`, `network`, `home indicator`, `10:46` marker가 shared production primitive에 없음. `rg -n "status bar|network indicator|battery indicator|home indicator|10:46" src tmp/shared-pixel-alignment -g '!*.test.ts' -g '!measurements.html'` returned no matches.
    - tolerated difference: `static mobile chrome is intentionally excluded`; reference PNG의 시간/네트워크/배터리/home indicator는 production UI에서 만들지 않는다.
- [x] TODO-P2.3: `CategoryChip` 고정 폭 정책을 관심 분야 최장 텍스트 기준으로 구현한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`, `packages/domain/src/index.ts`
  - 완료 기준: 카테고리 글자 수로 칩 폭이 달라지지 않고 3열 칩 화면에서도 안정적으로 맞는다.
  - 검증: shared rendering test 또는 component-level DOM/style test.
  - production PNG evidence: 없음. Downstream visual confirmation only: 12 phase에서 chip grid PNG를 확인하며, 이 체크박스의 완료 조건은 아니다.
  - completion note:
    - changed files: `src/index.css`, `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/12-edit-interests.png`
    - measured result: `CategoryChip`은 `WORRY_CATEGORIES`를 읽어 `longestCategoryLabelLength`와 `categoryChipWidth`를 계산하고 inline width로 적용한다. `워라밸` domain value는 수정하지 않았고 `packages/domain/src/index.ts` diff 없음.
    - tolerated difference: Phase 12 chip grid PNG는 downstream visual confirmation이며 Phase 2 완료 조건으로 사용하지 않았다.
- [x] TODO-P2.4: 로컬 타임존 기준 display date formatter를 shared pure function으로 분리한다.
  - 대상 파일: `src/screens/shared/contract.ts` 또는 new shared mapping utility, mapping tests
  - 완료 기준: 1분 미만 `방금 전`, 1시간 미만 `n분 전`, 날짜가 바뀌기 전 `n시간 전`, 날짜가 바뀌면 `YYYY-MM-DD`가 테스트된다.
  - 검증: `src/screens/receivedWorries/mapping.test.ts`, `src/screens/writeForm/mapping.test.ts`, `src/screens/myPage/mapping.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/shared/displayDate.ts`, `src/screens/receivedWorries/mapping.ts`, `src/screens/writeForm/mapping.ts`, `src/screens/myPage/mapping.ts`, `src/screens/receivedWorries/mapping.test.ts`, `src/screens/writeForm/mapping.test.ts`, `src/screens/myPage/mapping.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: mapping tests inject fixed `now` values and cover read model to screen prop conversion without route data mutation.
    - reference PNG path: 해당 없음
    - measured result: shared pure `formatDisplayDate` handles `Date`, millis number, and `{ toMillis(): number }`; tests cover `방금 전`, `n분 전`, `n시간 전`, and local-date-changed `YYYY-MM-DD` in received worries, write form, and my page mappings. Missing timestamp policy remains `수신됨` for received/write mappings and `undefined` for my-page reply date label.
    - tolerated difference: 해당 없음
- [x] TODO-P2.5: spinner loading primitive와 PNG에 없는 empty/loading state 책임 범위를 분리한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, screen `*Screen.tsx`
  - 완료 기준: PRD empty 문구는 screen별 contract에서 관리하고 loading은 shared spinner primitive로 통일된다.
  - 검증: shared UI tests와 screen state tests.
  - production PNG evidence: 없음. Optional visual review only in Phase 10; not a completion condition.
  - completion note:
    - changed files: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: `LoadingSpinner` primitive를 추가하고 `LoadingState`가 spinner를 사용하도록 통일했다. shared primitive source에는 PRD empty 문구를 하드코딩하지 않으며, empty/loading/error 문구는 screen props/contract 책임으로 유지된다.
    - tolerated difference: Phase 10 visual review는 이 TODO 완료 조건이 아니다.
- [x] TODO-P2.6: shared primitive 변경이 presentational-only임을 테스트로 증명한다.
  - 대상 파일: `src/screens/shared/uiContract.test.ts`, `src/screens/importBoundaries.test.ts`
  - 완료 기준: shared UI가 `src/services/**`를 import하지 않는다.
  - 검증: `npm test`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/shared/uiContract.test.ts`, `src/screens/importBoundaries.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass. `src/screens/importBoundaries.test.ts`가 `src/screens/shared/**`의 services/Firebase/server/API imports를 검증한다.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: 해당 없음
    - measured result: `src/screens/shared/**`는 `src/services/**`, Firebase, server, API/client boundary를 import하지 않는다. `src/App.tsx`는 shared primitive internal detail을 새로 알지 않으며 이번 phase에서 수정하지 않았다.
    - tolerated difference: 해당 없음
- [x] TODO-P2.7: shared primitive evidence는 production PNG 중심으로 생성한다.
  - 대상 파일: `tmp/shared-pixel-alignment/*-production.png`
  - 완료 기준: shared evidence 디렉터리에 production PNG가 있고, 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다.
  - 검증: `find tmp/shared-pixel-alignment -type f | sort`
  - production PNG evidence: `tmp/shared-pixel-alignment/*-production.png`.
  - completion note:
    - changed files: `tmp/shared-pixel-alignment/canvas-frame-production.png`, `tmp/shared-pixel-alignment/measurements.html`, `tmp/shared-pixel-alignment/harness/index.html`, `tmp/shared-pixel-alignment/harness/src/main.tsx`
    - test command/result: `find tmp/shared-pixel-alignment -type f | sort` returned `canvas-frame-production.png`, `harness/index.html`, `harness/src/main.tsx`, `measurements.html`; PNG size check pass; `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: `tmp/shared-pixel-alignment/canvas-frame-production.png`
    - capture type: `harness component`
    - harness route/data verification: `measurements.html`에 route/Container verification method 기록. production screen/component capture이며 JSON/Markdown evidence를 만들지 않았다.
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: `tmp/shared-pixel-alignment/measurements.html`에 capture type, source component, reference/production path, measured size, dominant colors, non-bg bbox, tolerated difference, copy check 기록. PNG size `(393, 852)` 확인.
    - tolerated difference: Phase 2는 shared primitive/canvas frame evidence이므로 화면별 최종 pixel mismatch는 후속 화면 phase 소유. OS chrome은 production에서 제외.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- capture 기준, shared primitive 변경, formatter 테스트 결과, PNG evidence 경로를 보고한다.

## Phase 3: 06 Received Worries

목표: 06 답변하기 화면의 PRD semantics와 PNG pixel structure를 맞춘다.
허용 수정 범위: `src/screens/receivedWorries/**`, shared visual primitive only as needed.
금지 수정 범위: `useHomeWorryFeed`, `passDeliveryViaApi`, `markDeliveryReadWithServer` 서비스 경계 변경.

- [x] TODO-P3.1: 06 PNG PIL anchor를 재측정해 주요 element bbox를 completion note로 보강한다.
  - 대상 파일: `design/reference/pngs/screens/06-received-worries.png`, `docs/TODO.md`
  - 완료 기준: 상단 좌측 눈, 우측 마이페이지 버튼, 고민 카드, 건너뛰기 버튼, 하단바 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 출력값을 completion note에 기록한다.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: PIL one-off measurement 성공; `npm test`, `npm run lint`, `npm run build`, `npm run validate:design-reference`, `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: reference size `393x852`; dominant `#ffffff 181468`, `#ff8b3d 54530`, `#fff1d1 35241`, `#fff5eb 16382`; non-white bbox `(0,0,393,852)`. crop/threshold bbox: OS status `(30,21,379,34)`, top-left eye `(8,68,105,130)`, my-page `(295,74,380,125)`, card outer crop `(10,165,383,565)`, category `(35,199,130,230)`, createdAt `(235,200,354,215)`, body text crop `(35,230,360,360)`, pass button crop `(35,450,360,535)`, bottom bar `(0,730,393,828)`, left tab crop `(25,760,135,830)`, center eye crop `(145,735,250,825)`, right tab crop `(255,760,370,830)`, home indicator `(120,825,275,828)`.
    - tolerated difference: reference의 status bar/time/network/battery와 home indicator는 production DOM에서 제외되는 OS chrome으로 기록.
- [x] TODO-P3.2: `ReceivedWorriesScreen`을 06 구조로 재구성한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: 상단 좌측 눈은 기능 없음, 우측 마이페이지 버튼은 이동 action, 고민 카드와 하단 고정바가 06 PNG 구조를 따른다.
  - 검증: screen rendering test 또는 manual DOM check.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P3.10.
  - completion note:
    - changed files: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/contract.ts`, `src/screens/receivedWorries/contract.test.ts`, `src/screens/receivedWorries/importBoundary.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: `received-worries top-left eye is presentational and my-page action is explicit`, `received-worries presentational pass click is isolated from card body open`, `received-worries contract exposes my-page intent without reply duplicate intent`
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: header eye is `role="presentation"`/`aria-hidden`, my-page button has `aria-label="마이페이지 열기"`, card open uses `{ deliveryId, worryId }`, pass uses `event.stopPropagation()` and `onPass(deliveryId)`. Production PNG size `393x852`.
    - tolerated difference: screen 내부 bottom nav 중복 없음; bottom nav는 shared app shell이 렌더링하므로 card/content padding만 screen에서 조정.
- [x] TODO-P3.3: `ReceivedWorriesContainer`는 기존 data/action 경계를 유지하고 screen props만 확장한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: `useHomeWorryFeed`, `passDeliveryViaApi`, `markDeliveryReadWithServer` import 경계가 유지된다.
  - 검증: `src/screens/receivedWorries/importBoundary.test.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/importBoundary.test.ts`, `src/screens/receivedWorries/containerPolicy.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: container imports test confirms only allowed service boundaries: `deliveries/apiClient`, `deliveries/uiPolicy`, `homeWorryFeed`, `readState/apiClient`, `appShell/prdNavigationPolicy`; no direct server/firestore/rules imports.
    - reference PNG path: 해당 없음
    - measured result: `ReceivedWorriesScreen.tsx` service/API/Firebase/server import 없음; container는 기존 service boundary 안에서 screen props만 확장.
    - tolerated difference: 해당 없음
- [x] TODO-P3.4: 고민 박스 클릭 시 17 route state가 `deliveryId`/`worryId`를 보존하고 read 처리한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: `routeToWriteReply({ deliveryId, worryId })`가 안정적으로 호출되고 selected worry fallback 없이 새로고침/route state 테스트가 가능하다.
  - 검증: container policy 또는 route test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/receivedWorries/importBoundary.test.ts`, `src/screens/receivedWorries/containerPolicy.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `keeps write-reply route state recoverable with delivery and worry ids`, `received-worries read marker policy only allows authenticated PRD deliveries`, import boundary test for `markDeliveryReadWithServer`.
    - reference PNG path: 해당 없음
    - measured result: `routeToWriteReply` param/type now requires `deliveryId` and `worryId`; container removed legacy `setView('write_reply')` fallback and calls `routeToWriteReply({ deliveryId, worryId })`; read remains through `markDeliveryReadWithServer` only for authenticated `prd_delivery`.
    - tolerated difference: 17 screen implementation is Phase 6, but Phase 3 route-state contract is id-bearing and test-covered.
- [x] TODO-P3.5: 건너뛰기 버튼은 확인 모달 없이 즉시 목록 제거와 pass domain action을 수행한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`
  - 완료 기준: pass success 후 suppressed set과 refresh가 적용되고 modal/dialog가 뜨지 않는다.
  - 검증: `src/screens/receivedWorries/containerPolicy.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/importBoundary.test.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass; source search confirms no `confirm(`, pass confirmation state, dialog/modal in production pass path.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `received-worries presentational pass click is isolated from card body open`, `received-worries pass mutation starts only once per delivery id`; service pass API semantics untouched.
    - reference PNG path: 해당 없음
    - measured result: pass button calls `event.stopPropagation()` then `props.onPass(item.deliveryId)`; container retains `suppressedDeliveryIds`, `passingDeliveryIdsRef`, refresh key increment, `routeAfterPass()`, existing failure alert policy.
    - tolerated difference: 해당 없음
- [x] TODO-P3.6: category mapping을 PRD fallback 정책으로 수정한다.
  - 대상 파일: `src/screens/receivedWorries/mapping.ts`, `src/screens/receivedWorries/mapping.test.ts`
  - 완료 기준: `validCategories[0]` 우선, 없고 fallback이 `잡담`이면 `잡담`, 무효 카테고리는 사용자-facing 미표시.
  - 검증: mapping tests.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/mapping.ts`, `src/screens/receivedWorries/mapping.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: mapping pure tests only; service type not modified. `HomeWorryFeedLetter` has no `validCategories`, so existing service policy's `validCategories -> categories` adaptation is treated as the equivalent read-model field.
    - reference PNG path: 해당 없음
    - measured result: `categories.find(isWorryCategory)` first, then `category === '잡담'`, then valid single `category`, then domain fallback `WORRY_CATEGORIES[0]`; invalid category strings are not exposed.
    - tolerated difference: 해당 없음
- [x] TODO-P3.7: createdAt 표시 규칙을 06 카드에서 검증한다.
  - 대상 파일: `src/screens/receivedWorries/mapping.ts`, shared date formatter
  - 완료 기준: `방금 전`, `n분 전`, `n시간 전`, `YYYY-MM-DD` 케이스가 로컬 타임존 기준으로 통과한다.
  - 검증: `src/screens/receivedWorries/mapping.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/mapping.test.ts`, `src/screens/receivedWorries/importBoundary.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: mapping test injects deterministic `now`; screen source keeps `time dateTime={item.receivedAt.isoValue}`.
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: `formatDisplayDate` unchanged; mapping tests cover `방금 전`, `25분 전`, `4시간 전`, `2026-05-18`; missing timestamp remains `{ label: '수신됨' }`.
    - tolerated difference: 해당 없음
- [x] TODO-P3.8: 06 받은 고민 화면에서 고민 작성자의 개인정보가 노출되지 않음을 검증한다.
  - 대상 파일: `src/screens/receivedWorries/mapping.ts`, `src/screens/receivedWorries/contract.ts`, `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`
  - 완료 기준: publisher nickname, gender, age, interests, profile metadata가 screen props와 DOM에 없고 PRD가 허용한 고민 내용/요약/카테고리/시간만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/receivedWorries/contract.ts`, `src/screens/receivedWorries/mapping.test.ts`, `src/screens/receivedWorries/importBoundary.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `does not expose invalid category or publisher privacy fields in screen item`, `received-worries loading empty and privacy source stay PRD-scoped`.
    - reference PNG path: 해당 없음
    - measured result: `ReceivedWorryFeedItem` remains limited to `deliveryId`, `worryId`, content, category, createdAt display, unread; privacy fixture fields (`publisherNickname`, `senderNickname`, `gender`, `age`, `interests`, `profileMetadata`, uid values) do not appear in output JSON; contract has no forbidden privacy fields.
    - tolerated difference: 해당 없음
- [x] TODO-P3.9: empty/loading 상태를 PRD 문구와 spinner로 맞춘다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: empty title/message는 `지금은 도착한 고민이 없어요.`, loading은 skeleton이 아닌 spinner.
  - 검증: screen state test.
  - production PNG evidence: 없음. 같은 phase에서 empty/loading visual을 캡처하면 `tmp/received-worries-pixel-alignment/06-empty-production.png` 또는 `06-loading-production.png`를 기록한다.
  - completion note:
    - changed files: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/containerPolicy.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`, `src/screens/receivedWorries/importBoundary.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `received-worries container policy maps loading error empty and ready states`, `received-worries loading empty and privacy source stay PRD-scoped`; loading uses shared `LoadingState`/`LoadingSpinner`, no skeleton/fake content.
    - reference PNG path: 해당 없음
    - measured result: empty state policy message is exactly `지금은 도착한 고민이 없어요.` and screen renders it once as `EmptyState title`; loading renders spinner primitive.
    - tolerated difference: optional empty/loading PNG not created; required ready-state PNG created in TODO-P3.10.
- [x] TODO-P3.10: 06 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
  - 완료 기준: 393x852 production capture이며 reference PNG 복사본이 아니고 capture type, source, reference/production path, measured size, dominant colors, non-bg bbox, 주요 bbox 차이가 completion note에 기록된다.
  - 검증: PNG 크기 확인과 reference anchor 비교 completion note.
  - production PNG evidence: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
  - completion note:
    - changed files: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`, `tmp/received-worries-pixel-alignment/harness/index.html`, `tmp/received-worries-pixel-alignment/harness/src/main.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass; PNG size check pass; reference copy check pass.
    - production PNG path: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: production `ReceivedWorriesScreen.tsx` imported by harness; route/Container covered by `keeps write-reply route state recoverable with delivery and worry ids`, `received-worries container keeps service imports in the allowed boundary`, pass/read policy tests.
    - reference PNG path: `design/reference/pngs/screens/06-received-worries.png`
    - measured result: production size `393x852`; SHA differs from reference. Production dominant `#ffffff 179448`, `#ff8b3d 42694`, `#fff3df 17495`, `#fff1d1 4370`; production non-white bbox `(0,0,393,852)`. Key production bboxes: top-left eye `(0,46,115,135)`, my-page `(285,50,393,130)`, first card crop `(0,115,393,292)`, category `(36,128,128,162)`, createdAt `(90,128,170,162)`, body `(36,192,354,236)`, pass `(261,128,357,152)`, bottom bar `(0,730,393,852)`, center indicator `(120,735,250,835)`.
    - tolerated difference: reference includes OS chrome; production intentionally excludes fake status/home chrome. Header vertical offset differs because production starts app content at top without fake status bar; bottom nav icon shape remains shared primitive from Phase 2, not duplicated in screen.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run validate:design-reference`

완료 보고 형식:
- 06 route/contract/mapping 변경, pass/read 처리 테스트, PNG mismatch 잔여 항목을 보고한다.

## Phase 4: 20 My Worries and 07 Write-Worry Entry

목표: 20 나의 고민 목록을 08 answer-check로 이어지는 목록 화면으로 분리하고, 07 고민 작성 진입점을 우측 하단 메시지 버튼 하나로 고정한다.
허용 수정 범위: `src/screens/myPage/MyWorries*`, `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`, appShell route helpers/tests.
금지 수정 범위: `src/services/myWorries/**` read model 변경. 필요하면 별도 테스트 근거를 먼저 추가한다.

- [x] TODO-P4.1: 20 PNG PIL anchor를 재측정해 주요 element bbox를 보강한다.
  - 대상 파일: `design/reference/pngs/screens/20-my-worries.png`, `docs/TODO.md`
  - 완료 기준: 상단 눈, 마이페이지 버튼, 목록 카드, 우측 하단 메시지 버튼, 하단바 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 출력값 completion note.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`, `src/screens/myPage/MyWorriesScreen.tsx`
    - test command/result: PIL one-off measurement 성공; `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: reference size `393x852`; dominant `#fff1d1 130921`, `#ffffff 110161`, `#ff8b3d 51555`, `#fff5eb 13345`; non-bg bbox `(0,0,393,852)`. 주요 bbox: status `(30,21,379,34)`, 좌상단 눈 `(2,68,120,140)`, 우상단 마이페이지 `(275,74,393,145)`, 1번 카드 `(0,140,393,324)`, 1번 카드 내용 `(16,149,377,316)`, chip `(34,160,79,183)`, date glyph `(96,169,157,179)`, summary glyph `(35,209,348,250)`, reply count `(35,281,137,292)`, 2번 카드 `(13,331,380,506)`, 메시지 버튼 `(316,714,376,774)`, 하단바 `(0,790,393,838)`, home indicator `(120,830,275,838)`.
    - tolerated difference: reference의 status bar/time/network/battery와 home indicator는 production DOM에서 제외되는 OS chrome으로 기록.
- [x] TODO-P4.2: `MyWorriesScreen`을 20 목록 화면으로 재구성하고 selected worry 아래 reply list 펼침 UI를 제거한다.
  - 대상 파일: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 목록 화면에서 reply list가 inline으로 펼쳐지지 않고 고민 박스 클릭은 `onSelectWorryForAnswers(worryId)` 같은 intent callback만 발생시킨다. 08 screen/module 존재는 요구하지 않는다.
  - 검증: screen test에서 selected reply panel DOM 부재와 intent callback 호출 확인.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P4.9.
  - completion note:
    - changed files: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyWorriesScreen.test.ts`, `src/screens/myPage/contract.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; screen tests `my worries screen is a list-only screen without inline received-reply panel`, `my worries card click invokes answer-check intent with the selected worry item` pass.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: `my worries container routes selected item to answer_check and stores selected worry`
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: production size `393x852`; production 주요 bbox: first card `(0,130,393,330)`, summary `(35,220,348,265)`, reply count `(36,293,139,305)`.
    - tolerated difference: status/home indicator 제외, screen 내부 bottom nav 중복 없음; 하단바는 shared shell이 렌더링.
- [x] TODO-P4.3: 20 화면 좌상단/우상단/우측 하단 action을 PRD대로 구현한다.
  - 대상 파일: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 좌상단 눈은 기능 없음, 우상단은 마이페이지 이동, 우측 하단 메시지 버튼만 `write_worry` 진입점이다.
  - 검증: click/role test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P4.9.
  - completion note:
    - changed files: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/MyWorriesScreen.test.ts`, `src/screens/myPage/contract.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; tests verify top-left eye is `div` with no click handler, my-page button calls `onOpenMyPage`, floating message button calls `onWriteWorry`, empty state has no separate CTA.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`; empty `tmp/my-worries-pixel-alignment/20-empty-production.png`
    - capture type: `harness component`
    - harness route/data verification: `my worries screen actions match PRD entry points`, `my worries empty state uses PRD copy without a separate empty CTA`
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: production message button bbox `(290,688,390,770)`, reference message button bbox `(316,714,376,774)`.
    - tolerated difference: production excludes fake OS chrome and uses shared bottom nav center indicator from Phase 2; floating button remains the only write entry in this screen.
- [x] TODO-P4.4: `answer_check` route object/helper intent를 도입하되 08 rendering 구현은 요구하지 않는다.
  - 대상 파일: `src/screens/myPage/MyWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: `routeToAnswerCheck({ worryId })` 또는 동등한 route state 생성이 테스트되고, MyWorriesContainer는 선택 intent를 해당 route object로 변환한다. `src/screens/answerCheck/**`와 route rendering은 Phase 7에서 구현한다.
  - 검증: route helper/container policy test. 08 route rendering test는 Phase 7에서 수행한다.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/screens/myPage/MyWorriesContainer.tsx`, `src/screens/myPage/MyWorriesContainerPolicy.ts`, `src/screens/myPage/MyWorriesContainerPolicy.test.ts`, `src/App.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; route tests verify `routeToAnswerCheck({ worryId }) -> { route: 'answer_check', worryId }`, `backRouteForRoute` and `tabForRoute` return `나의 고민`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `my worries container routes selected item to answer_check and stores selected worry`
    - reference PNG path: 해당 없음
    - measured result: `answer_check` route state is id-bearing; `src/screens/answerCheck/**` 신규 구현 없음.
    - tolerated difference: `App.tsx`의 기존 legacy detail rendering은 Phase 7 소유로 남김; 이번 Phase는 route object/helper intent와 container selection만 닫음.
- [x] TODO-P4.5: `MyWorryListItemProps`를 20 표시 정보로 갱신한다.
  - 대상 파일: `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`
  - 완료 기준: createdAt display date, LLM summary text, first valid category, visible reply count label을 포함한다.
  - 검증: `src/screens/myPage/contract.test.ts`, `src/screens/myPage/mapping.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.test.ts`, `src/screens/myPage/mapping.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; mapping tests cover shared display date, first valid category, `잡담` fallback, 원문 20자+`...` summary fallback, privacy-free accessibility label.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: mapping/contract pure tests; container route test listed in TODO-P4.4.
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: `MyWorryListItemProps` fields are `worryId`, `summaryText`, `categoryLabel`, `createdAtLabel`, `replyCountLabel`, `hasUnreadReplies`, `accessibilityLabel`.
    - tolerated difference: service read model has no summary field in current type, so mapping uses PRD fallback `content` first 20 chars + `...` without expanding `src/services/myWorries/**` implementation.
- [x] TODO-P4.6: reply count read model/mapping 정책을 검증한다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/services/myWorries/prdPolicy.test.ts` if service policy already owns count
  - 완료 기준: AI 포함, 싫어요 숨김/운영자 숨김 제외, 0개면 `아직 답변이 없어요.` 표시.
  - 검증: mapping/service policy tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P4.9에서 count label을 확인한다.
  - completion note:
    - changed files: `src/screens/myPage/mapping.ts`, `src/screens/myPage/mapping.test.ts`, `src/services/myWorries/prdPolicy.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; mapping tests cover `0 -> 아직 답변이 없어요.`, `1 -> 1명이 답변했어요`, `n -> n명이 답변했어요`; service policy test `author-visible reply read model includes AI replies and excludes disliked or hidden replies` pass.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: mapping/service policy tests only; service implementation untouched.
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: production reply count labels appear at `(36,293,139,305)` for first card; reference first reply label `(35,281,137,292)`.
    - tolerated difference: current `MyWorryListItem` exposes `humanReplyCount` only, not an explicit visible human+AI count. Mapping safely formats the available count and service tests verify visible reply selection includes AI and excludes disliked/admin-hidden replies; exact list count read model remains a documented service-layer limitation for a future allowed service phase.
- [x] TODO-P4.7: 20 나의 고민 화면에서 답변 작성자의 개인정보가 노출되지 않음을 검증한다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyWorriesScreen.tsx`
  - 완료 기준: answer writer nickname, gender, age, interests, profile metadata가 목록 props와 DOM에 없고 PRD가 허용한 답변 수/상태 정보만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`, `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.test.ts`, `src/screens/myPage/mapping.test.ts`, `src/screens/myPage/MyWorriesScreen.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; contract/mapping/screen tests assert forbidden writer fields are absent from props, mapping output, accessibility label, and DOM.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: `my worries DOM does not render answer writer private data`
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: DOM renders category/date/summary/reply count only; no answer writer nickname, gender, age, interests, profile metadata, replierUid, or reply body preview.
    - tolerated difference: 해당 없음
- [x] TODO-P4.8: 나의 고민 empty 문구를 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyWorriesContainer.tsx`, `src/screens/myPage/MyWorriesScreen.tsx`
  - 완료 기준: empty 문구가 `첫 고민을 남겨보세요.`이고 CTA는 우측 하단 메시지 버튼 정책과 충돌하지 않는다.
  - 검증: screen state test.
  - production PNG evidence: 없음. 같은 phase에서 empty visual을 캡처하면 `tmp/my-worries-pixel-alignment/20-empty-production.png`를 기록한다.
  - completion note:
    - changed files: `src/screens/myPage/MyWorriesContainer.tsx`, `src/screens/myPage/MyWorriesContainerPolicy.ts`, `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/MyWorriesScreen.test.ts`, `tmp/my-worries-pixel-alignment/20-empty-production.png`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; empty screen test confirms `첫 고민을 남겨보세요.` and no separate empty CTA.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-empty-production.png`
    - capture type: `harness component`
    - harness route/data verification: `my worries container policy maps loading error empty and ready states`, `my worries empty state uses PRD copy without a separate empty CTA`
    - reference PNG path: 해당 없음
    - measured result: empty production size `393x852`; dominant `#fff1d1 167907`, `#ffffff 65531`, `#ff8b3d 47117`; non-bg bbox `(0,0,393,852)`.
    - tolerated difference: empty state는 별도 reference PNG 없음; same-tone harness capture만 남김.
- [x] TODO-P4.9: 20 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
  - 완료 기준: 393x852 production capture이며 추가 보고 파일이 필요하면 한국어 HTML만 있고 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
  - completion note:
    - changed files: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`, `tmp/my-worries-pixel-alignment/20-empty-production.png`, `tmp/my-worries-pixel-alignment/harness/index.html`, `tmp/my-worries-pixel-alignment/harness/src/main.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; PNG size check pass; reference copy check `False`.
    - production PNG path: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
    - capture type: `harness component`
    - harness route/data verification: production `MyWorriesScreen.tsx` imported by harness; route/Container covered by `my worries container routes selected item to answer_check and stores selected worry`, appShell `routeToAnswerCheck` tests, and screen action tests.
    - reference PNG path: `design/reference/pngs/screens/20-my-worries.png`
    - measured result: production size `393x852`; dominant `#ffffff 104133`, `#fff1d1 84019`, `#ff8b3d 47268`, `#fffffd 18092`, `#fff3df 12765`; production non-bg exact with dominant white `(0,0,393,852)`, cream-body comparison bboxes: top-left eye `(0,70,120,130)`, my-page `(280,74,380,125)`, first card `(0,130,393,330)`, category `(36,160,145,194)`, date `(125,168,206,186)`, summary `(35,220,348,265)`, reply count `(36,293,139,305)`, message button `(290,688,390,770)`, bottom bar `(0,760,393,852)`. Reference key bboxes: top-left eye `(2,68,120,140)`, my-page `(275,74,393,145)`, first card `(0,140,393,324)`, category `(34,160,79,183)`, date `(96,169,157,179)`, summary `(35,209,348,250)`, reply count `(35,281,137,292)`, message button `(316,714,376,774)`, bottom bar `(0,790,393,838)`.
    - tolerated difference: reference includes fake status/home indicator; production excludes them. Shared `CategoryChip` keeps fixed domain chip width, so chip/date x positions differ. Shared bottom nav from Phase 2 is taller and starts at y~760 instead of reference y~790. Floating write button is within about 26px vertical of reference and remains the only write entry.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- 20 목록 구조, 07 진입점 단일화, reply count 정책, PNG evidence를 보고한다.

## Phase 5: 07 Write-Worry and 09 Success/Failure Flow

목표: 고민 작성 07과 성공 확인 09 흐름을 PRD route와 PNG에 맞춘다.
허용 수정 범위: `src/screens/writeForm/**`, appShell success route helpers/tests, draft/moderation container policy tests.
금지 수정 범위: `publishWorryViaApi` 내부, server moderation/publication logic.

- [x] TODO-P5.1: 07/09 PNG PIL anchor를 재측정한다.
  - 대상 파일: `design/reference/pngs/screens/07-question-write-a.png`, `09-question-write-b.png`, `docs/TODO.md`
  - 완료 기준: textarea, pencil placeholder, CTA, success dialog/card, 확인 버튼 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 completion note.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`
    - test command/result: `python3` PIL 측정 성공; `npm test`, `npm run lint`, `npm run build`, `npm run validate:design-reference` 성공.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/07-question-write-a.png`, `design/reference/pngs/screens/09-question-write-b.png`
    - measured result: 07 reference size `393x852`, dominant `#fff5eb 201042`, `#fff1d1 101783`, `#ff8b3d 17679`, non-bg bbox `(0,0)-(393,828)`, top/title/back dark bbox `(24,71)-(224,87)`, textarea/card orange bbox `(20,120)-(373,661)`, pencil/placeholder region `(20,120)-(373,190)`, character/CTA orange bbox `(20,600)-(373,732)`, submit CTA orange bbox `(34,660)-(359,732)`, bottom bar dark/orange bbox `(204,783)-(233,801)`/`(79,730)-(333,823)`. 09 reference size `393x852`, dominant `#ada48e 96655`, `#ada7a0 76675`, `#ffffff 71853`, non-bg bbox `(0,21)-(393,852)`, success card white bbox `(42,251)-(352,539)`, title/text dark bbox `(99,349)-(293,365)`, confirm orange bbox `(66,452)-(328,504)`, bottom bar dark bbox `(204,783)-(233,801)`. status bar/home indicator는 production DOM 제외 대상.
    - tolerated difference: reference static status bar/home indicator는 production DOM에서 제외.
- [x] TODO-P5.2: `WriteWorryContainer`는 API/draft/validation/moderation 경계를 유지하고 성공 route만 09로 바꾼다.
  - 대상 파일: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: `publishWorryViaApi`, draft storage, validation import 경계는 유지되고 success route는 09 confirmation이다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`, import boundary test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P5.8.
  - completion note:
    - changed files: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/importBoundary.test.ts`, `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.test.ts`
    - test command/result: `npm test` 성공 672 pass/1 skip, `npm run lint` 성공, `npm run build` 성공, `rg -n "publishWorryViaApi|WRITE_WORRY_DRAFT_KEY|clearStoredDraft|setStoredDraft|routeAfterWorryPublish|write_worry_success|filterAlert" src/screens/writeForm src/App.tsx src/services/appShell` 확인.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `containerPolicy.test.ts` published route `{ route: 'write_worry_success' }`, rejected/failed `clearDraft: false`; `importBoundary.test.ts` presentational API/draft/service import 금지.
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P5.3: 07 write-worry variant를 `WriteWorryScreen` 전용 presentational component로 분리한다.
  - 대상 파일: `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/contract.ts`
  - 완료 기준: 답변 작성 17과 고민 작성 07의 JSX/pixel work가 별도 screen component로 분리되고, container/draft 계약은 writeForm deep module 안에 유지된다.
  - 검증: import boundary tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P5.8.
  - completion note:
    - changed files: `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.test.ts`, `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/contract.ts`, `src/screens/importBoundaries.test.ts`
    - test command/result: `npm test` 성공 672 pass/1 skip; `WriteWorryScreen.test.ts` empty/non-empty placeholder, event callbacks, validation/moderation copy 검증.
    - production PNG path: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`
    - capture type: harness component
    - harness route/data verification: route/API는 `WriteWorryContainer` + `containerPolicy.test.ts`, write-reply compile은 `npm run lint`와 기존 `WriteReplyContainer` 경로로 검증.
    - reference PNG path: `design/reference/pngs/screens/07-question-write-a.png`
    - measured result: 07 production size `393x852`, dominant `#fff5eb 193146`, `#fff8ef 73198`, `#ffffff 18088`, non-bg bbox `(0,0)-(393,852)`, textarea/card orange bbox `(16,108)-(377,656)`, CTA region `(16,600)-(377,706)`, bottom bar bbox `(0,730)-(393,852)`.
    - tolerated difference: reference static status/home indicator 제외로 non-bg bottom differs; CTA는 empty validation disabled 상태라 production color가 pale orange인 차이 허용.
- [x] TODO-P5.4: 07 textarea placeholder를 pencil graphic + `당신의 솔직한 이야기를 들려주세요`로 구현한다.
  - 대상 파일: write worry screen file, `src/screens/writeForm/contract.ts`
  - 완료 기준: 입력 전에는 pencil과 문구가 보이고, 입력 시작 시 둘 다 숨는다.
  - 검증: screen interaction test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P5.8.
  - completion note:
    - changed files: `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.test.ts`, `src/screens/writeForm/contract.ts`
    - test command/result: `npm test` 성공; `WriteWorryScreen.test.ts` visual placeholder 표시/숨김, textarea change handler, submit disabled 검증.
    - production PNG path: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`
    - capture type: harness component
    - harness route/data verification: `WriteWorryContainer` draft 저장/검증 경계는 `npm run lint`, import boundary, source inspection으로 확인.
    - reference PNG path: `design/reference/pngs/screens/07-question-write-a.png`
    - measured result: reference placeholder region `(20,120)-(373,190)`, production placeholder region visual text/pencil rendered at top-left of textarea; native `placeholder=` attribute 없음.
    - tolerated difference: pencil은 lucide icon이라 glyph pixel은 reference와 다르지만 bbox 비교 가능한 overlay 구조로 구현.
- [x] TODO-P5.5: 필터링 실패 시 07에 남고 draft를 유지한다.
  - 대상 파일: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: moderation rejected/failed는 09로 이동하지 않고 draft storage를 clear하지 않는다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.test.ts`
    - test command/result: `npm test` 성공; rejected/failed는 route 없음, `clearDraft: false`; published는 `clearDraft: true`, route `{ route: 'write_worry_success' }`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `WriteWorryScreen.test.ts` rejected/failed 안내 문구 표시; `rg`로 `clearStoredDraft(WRITE_WORRY_DRAFT_KEY)`가 success policy branch 뒤에만 위치함을 확인.
    - reference PNG path: 해당 없음
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P5.6: 성공 시 toast를 폐기하고 09 success screen을 표시한다.
  - 대상 파일: `src/screens/writeForm/*`, `src/App.tsx`
  - 완료 기준: 09에서는 확인 버튼 외 상호작용이 없고 `filterAlert` success toast를 쓰지 않는다.
  - 검증: route/rendering test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P5.8.
  - completion note:
    - changed files: `src/App.tsx`, `src/screens/writeForm/WriteWorrySuccessContainer.tsx`, `src/screens/writeForm/WriteWorrySuccessContainer.test.ts`, `src/screens/writeForm/WriteWorrySuccessScreen.tsx`, `src/screens/writeForm/WriteWorrySuccessScreen.test.ts`, `src/screens/writeForm/appBoundary.test.ts`
    - test command/result: `npm test` 성공; success screen은 button 1개만 렌더링, App은 `write_worry_success` route에서 container 렌더링, source test로 성공 `filterAlert` toast 부재 검증.
    - production PNG path: `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`
    - capture type: harness component
    - harness route/data verification: `routeRenderingBoundary.test.ts` `write_worry_success` write worry group; `appBoundary.test.ts` App success route rendering; `WriteWorrySuccessContainer.test.ts` confirm route.
    - reference PNG path: `design/reference/pngs/screens/09-question-write-b.png`
    - measured result: 09 production size `393x852`, dominant `#ffffff 72545`, `#a6a19b 63557`, `#a69f99 50147`, non-bg bbox `(0,0)-(393,852)`, success card white bbox `(42,282)-(352,570)`, title/text dark bbox `(93,382)-(298,401)`, confirm orange bbox `(66,490)-(328,538)`, bottom bar dark bbox `(231,765)-(331,837)`.
    - tolerated difference: production success modal is `+31px` lower than reference card top and confirm button is `+38px` lower; harness keeps production shell bottom nav and omits static mobile chrome.
- [x] TODO-P5.7: 09 확인 버튼은 20-my-worries로 이동한다.
  - 대상 파일: success screen/container contract, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: 확인 클릭 후 `my_worries` 또는 `나의 고민` route로 이동하고 작성 직후 답변 0개면 `아직 답변이 없어요.` 상태다.
  - 검증: route flow test 07→09→20.
  - production PNG evidence: 없음. Downstream visual confirmation only: 20 phase PNG는 이 체크박스의 완료 조건이 아니다.
  - completion note:
    - changed files: `src/screens/writeForm/WriteWorrySuccessContainer.tsx`, `src/screens/writeForm/WriteWorrySuccessContainer.test.ts`
    - test command/result: `npm test` 성공; `routeAfterWorrySuccessConfirmation()`은 `나의 고민`; `MyWorries` mapping test는 0개 답변 label `아직 답변이 없어요.` 유지.
    - production PNG path: `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`
    - capture type: harness component
    - harness route/data verification: `WriteWorrySuccessContainer.test.ts` 확인 클릭 시 `나의 고민`; `prdNavigationPolicy.test.ts` helper 반환; `src/screens/myPage/mapping.test.ts` 0 reply label.
    - reference PNG path: `design/reference/pngs/screens/09-question-write-b.png`
    - measured result: confirm button only interactive; screen HTML button count 1.
    - tolerated difference: helper는 기존 PRD tab alias `나의 고민` 유지.
- [x] TODO-P5.8: 07/09 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`, `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`
  - 완료 기준: 두 PNG가 393x852 production capture이고 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.
  - completion note:
    - changed files: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`, `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`, `tmp/write-worry-pixel-alignment/harness/index.html`, `tmp/write-worry-pixel-alignment/harness/src/main.tsx`, `docs/TODO.md`
    - test command/result: `npm run build` 성공 후 Playwright screenshot 성공; PIL 측정 성공; `npm test`, `npm run lint`, `npm run build`, `npm run validate:design-reference` 모두 성공.
    - production PNG path: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`, `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`
    - capture type: harness component
    - harness route/data verification: production `WriteWorryScreen.tsx`, `WriteWorrySuccessScreen.tsx`, `MobileAppShell`, `BottomNavigation` import harness; route/container는 `WriteWorrySuccessContainer.test.ts`, `appBoundary.test.ts`, `containerPolicy.test.ts`, `routeRenderingBoundary.test.ts`로 검증.
    - reference PNG path: `design/reference/pngs/screens/07-question-write-a.png`, `design/reference/pngs/screens/09-question-write-b.png`
    - measured result: 07 production size `393x852`, dominant `#fff5eb 193146`, non-bg bbox `(0,0)-(393,852)`, textarea/card `(16,108)-(377,656)`, CTA `(16,600)-(377,706)`. 09 production size `393x852`, dominant `#ffffff 72545`, non-bg bbox `(0,0)-(393,852)`, success card `(42,282)-(352,570)`, confirm `(66,490)-(328,538)`.
    - tolerated difference: static mobile status/home indicator excluded; 07 CTA disabled color reflects empty validation; 09 modal vertical offset within `38px` due production shell/font and overlay implementation.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- draft/moderation route 정책, 07/09 pixel mismatch, evidence 경로를 보고한다.

## Phase 6: 17/18/19 Write-Reply Flow

목표: 답변 작성 17, 원문 overlay 18, 성공 확인 19 흐름을 PRD와 PNG에 맞춘다.
허용 수정 범위: `src/screens/writeForm/**`, appShell success route helpers/tests.
금지 수정 범위: `publishReplyViaApi` 내부, reply publication server logic.

- [x] TODO-P6.1: 17/18/19 PNG PIL anchor를 재측정한다.
  - 대상 파일: `design/reference/pngs/screens/17-answer-write-1.png`, `18-answer-write-2.png`, `19-answer-write-3.png`
  - 완료 기준: worry summary card, overlay panel, textarea, success screen, 확인 버튼 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 completion note.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `tmp/write-reply-pixel-alignment/measurements.html`
    - test command/result: PIL 측정 성공. 17/18/19 reference와 production 모두 `393x852` 확인.
    - production PNG path: 해당 없음
    - capture type: reference PIL measurement
    - reference PNG path: `design/reference/pngs/screens/17-answer-write-1.png`, `18-answer-write-2.png`, `19-answer-write-3.png`
    - measured result: 17 summary card bbox `(16,127)-(377,230)`, 18 overlay panel white bbox `(7,201)-(384,705)`, 19 success modal bbox `(42,251)-(352,539)`, 19 확인 버튼 bbox `(66,452)-(328,504)`.
    - tolerated difference: static status bar/home indicator는 PRD에 따라 production 구현에서 제외한다.
- [x] TODO-P6.2: `WriteReplyContainer`는 API/draft/validation/moderation 경계를 유지하고 성공 route만 19로 바꾼다.
  - 대상 파일: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: success route가 19 confirmation이며 draft clear는 성공 시에만 수행된다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P6.10.
  - completion note:
    - changed files: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`, `src/screens/writeForm/containerPolicy.test.ts`, `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`
    - test command/result: `npm test -- src/screens/writeForm/*.test.ts` pass; `npm test -- src/services/appShell/*.test.ts` pass; full `npm test` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `resolveReplyPublicationResult` success returns `{ route: 'write_reply_success', deliveryId, worryId }`; rejected/failed keep `clearDraft: false`; container clears stored draft only after success.
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P6.3: 17 화면 props에 LLM summary, first valid category, createdAt display date, 답변 입력 영역을 명시한다.
  - 대상 파일: `src/screens/writeForm/contract.ts`, `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/WriteFormScreen.tsx`
  - 완료 기준: 원문 대신 summary가 기본 카드에 표시되고 원문은 18 overlay에서만 보인다.
  - 검증: mapping/screen tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P6.10.
  - completion note:
    - changed files: `src/screens/writeForm/contract.ts`, `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteFormScreen.test.ts`, `src/screens/writeForm/mapping.test.ts`
    - test command/result: `WriteFormScreen.test.ts` and `mapping.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: screen test verifies summary appears on base card and original body appears only when overlay state is open.
    - measured result: 17 production summary card white bbox `(16,100)-(377,246)`; static status chrome 제외로 reference y보다 위.
    - tolerated difference: static status bar 제외에 따른 vertical shift는 허용.
- [x] TODO-P6.4: summary 생성 실패 fallback을 mapping/service boundary에 명시한다.
  - 대상 파일: `src/screens/writeForm/mapping.ts`, service policy test if summary is read model owned
  - 완료 기준: 원문 앞 20자 + `...` fallback이 사용자-facing summary로 표시된다.
  - 검증: mapping test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/mapping.test.ts`
    - test command/result: `mapping.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `buildUserFacingSummary` returns trimmed LLM summary when present; missing/blank summary returns original first 20 characters plus `...`; 20자 이하도 원문 전체 plus `...`; empty original returns `...`.
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P6.5: 18은 별도 full route가 아니라 17 위 overlay로 구현한다.
  - 대상 파일: `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/contract.ts`
  - 완료 기준: overlay 열기/닫기 후 reply draft가 유지되고 URL route는 17 write_reply 상태다.
  - 검증: state interaction test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P6.10.
  - completion note:
    - changed files: `src/screens/writeForm/contract.ts`, `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteFormScreen.test.ts`, `src/screens/writeForm/WriteReplyContainer.tsx`
    - test command/result: `WriteFormScreen.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: 18 overlay is controlled by write reply state (`isOriginalOverlayOpen`) and no `AppRoute` is added; screen callbacks open/close overlay while draft callback remains independent.
    - measured result: 18 production overlay panel white bbox `(0,201)-(393,705)` after correcting initial bottom-sheet offset.
    - tolerated difference: production panel width uses full shell width, about 7-9px wider than reference.
- [x] TODO-P6.6: 17 뒤로 가기는 06으로 이동하고 draft를 폐기한다.
  - 대상 파일: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: back click이 `received_worries`로 이동하고 해당 delivery draft key를 clear한다.
  - 검증: container interaction test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/screens/writeForm/WriteFormScreen.tsx`, `src/services/appShell/prdNavigationPolicy.ts`, `src/screens/writeForm/WriteFormScreen.test.ts`
    - test command/result: `WriteFormScreen.test.ts`, `prdNavigationPolicy.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: back intent routes through `backRouteFromWriteReply()` to `답변하기`; container clears `replyDraftKey(deliveryId)` and selected reply/worry state on back.
    - measured result: 해당 없음
    - tolerated difference: TODO text says `received_worries`; policy canonical tab alias remains `답변하기`, which renders the 06 answer feed route.
- [x] TODO-P6.7: 17 답변 입력 placeholder를 pencil icon + `고민자에게 따뜻한 말을 전달해주세요!`로 구현한다.
  - 대상 파일: write reply screen file, `src/screens/writeForm/contract.ts`
  - 완료 기준: icon과 문구가 겹치지 않고 입력 시작 시 둘 다 숨는다.
  - 검증: screen interaction test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P6.10.
  - completion note:
    - changed files: `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteFormScreen.test.ts`
    - test command/result: `WriteFormScreen.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: native placeholder attribute is absent; empty draft renders pencil visual placeholder and copy; non-empty draft hides both.
    - measured result: 17 reference placeholder icon/text bbox is inside input area `(20,227)-(373,661)`; production placeholder is inside textarea and does not overlap typed text because it is hidden when `draft.value !== ''`.
    - tolerated difference: exact icon path differs because production uses lucide `Pencil`.
- [x] TODO-P6.8: 19 확인 버튼은 06으로 이동하고 방금 답변한 고민은 목록에서 사라진다.
  - 대상 파일: success route/screen, `src/screens/receivedWorries/ReceivedWorriesContainer.tsx` if suppression state needed
  - 완료 기준: 17→19→06 route flow와 feed suppression/refresh가 테스트된다.
  - 검증: route flow/container policy test.
  - production PNG evidence: 없음. Downstream visual confirmation only: 06 phase PNG는 이 체크박스의 완료 조건이 아니다.
  - completion note:
    - changed files: `src/screens/writeForm/WriteReplySuccessScreen.tsx`, `src/screens/writeForm/WriteReplySuccessContainer.tsx`, `src/screens/writeForm/WriteReplySuccessScreen.test.ts`, `src/screens/writeForm/WriteReplySuccessContainer.test.ts`, `src/App.tsx`, `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
    - test command/result: `WriteReplySuccessContainer.test.ts`, `prdNavigationPolicy.test.ts`, `src/services/homeWorryFeed/serverAnswerFeed.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: success route keeps `deliveryId/worryId`; confirm calls `routeAfterReplySuccessConfirmation()` -> `답변하기`; App records answered delivery id and passes it to `ReceivedWorriesContainer`, which suppresses it in addition to server refresh/read model exclusion.
    - measured result: 19 production modal bbox `(42,251)-(352,544)`, 확인 button bbox `(66,464)-(328,512)`.
    - tolerated difference: 확인 button y is +12/+8px vs reference due production CTA typography/padding.
- [x] TODO-P6.9: 17/18 답변 작성 화면에서 고민 작성자의 개인정보가 노출되지 않음을 검증한다.
  - 대상 파일: `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/contract.ts`, `src/screens/writeForm/WriteFormScreen.tsx`
  - 완료 기준: publisher nickname, gender, age, interests, profile metadata가 17 summary card와 18 원문 overlay props/DOM에 없고 PRD가 허용한 고민 내용/context만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/writeForm/contract.ts`, `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteFormScreen.test.ts`, `src/screens/writeForm/mapping.test.ts`
    - test command/result: `WriteFormScreen.test.ts` and `mapping.test.ts` pass through full `npm test`.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: mapping output keys are limited to `deliveryId`, `worryId`, `category`, `summaryText`, `originalBodyText`, `receivedAt`; test fixtures containing `senderId/authorUid` do not leak into output; screen DOM does not contain publisher nickname/gender/age/interests/profile metadata/internal uid strings.
    - measured result: 해당 없음
    - tolerated difference: 해당 없음
- [x] TODO-P6.10: 17/18/19 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`, `18-answer-write-2-production.png`, `19-answer-write-3-production.png`
  - 완료 기준: 세 PNG가 393x852 production capture이고 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.
  - completion note:
    - changed files: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`, `tmp/write-reply-pixel-alignment/18-answer-write-2-production.png`, `tmp/write-reply-pixel-alignment/19-answer-write-3-production.png`, `tmp/write-reply-pixel-alignment/harness/index.html`, `tmp/write-reply-pixel-alignment/harness/src/main.tsx`, `tmp/write-reply-pixel-alignment/measurements.html`
    - test command/result: Playwright/Chrome capture success; PIL size verification success; `npm test` pass; `npm run lint` pass; `npm run build` pass.
    - production PNG path: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`, `18-answer-write-2-production.png`, `19-answer-write-3-production.png`
    - capture type: harness component
    - harness route/data verification: production screen/container contracts are imported in harness; actual route flow is verified by `prdNavigationPolicy.test.ts`, `WriteReplySuccessContainer.test.ts`, `WriteFormScreen.test.ts`, and `containerPolicy.test.ts`.
    - reference PNG path: `design/reference/pngs/screens/17-answer-write-1.png`, `18-answer-write-2.png`, `19-answer-write-3.png`
    - measured result: all production PNGs are `393x852`; 18 overlay panel corrected from initial bottom-sheet y=604 to `(0,201)-(393,705)`; 19 modal `(42,251)-(352,544)`.
    - tolerated difference: production design tokens differ from exact reference colors; 17 omits static status bar/home indicator; 18 panel full shell width is wider than reference; 19 CTA y differs by about 8-12px.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- 17/18/19 route/draft 정책, overlay state, evidence 경로를 보고한다.

## Phase 7: 08 Answer-Check Feedback Flow

목표: 08 내 고민 + 여러 답변 박스 + 좋아요/싫어요/코멘트 정책 화면을 구현한다.
허용 수정 범위: 새 `src/screens/answerCheck/**` deep module, legacy `src/screens/replyDetail/**` route removal edits, relevant route helpers/tests, feedback container policy tests.
금지 수정 범위: feedback server/API internals unless PRD 기능 정합성 테스트가 먼저 실패한다.

- [x] TODO-P7.1: 08 PNG PIL anchor를 재측정한다.
  - 대상 파일: `design/reference/pngs/screens/08-answer-check.png`, `docs/TODO.md`
  - 완료 기준: 내 고민 박스, 답변 박스들, 좋아요/싫어요 버튼, 하단바 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 completion note.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `docs/TODO.md`, `tmp/answer-check-pixel-alignment/measurements.html`
    - test command/result: PIL one-off measurement pass; `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: reference PIL measurement
    - harness route/data verification: 해당 없음
    - reference PNG path: `design/reference/pngs/screens/08-answer-check.png`
    - measured result: reference size `393x852`; dominant `#ffffff 195303`, `#fff1d1 75583`, `#fff5eb 12101`, `#ff8b3d 4265`; non-bg bbox `(0,0)-(393,852)`. Header `(0,0)-(393,130)`, back `(0,50)-(80,130)`, title `(120,50)-(280,127)`, 내 고민 crop `(0,110)-(393,315)`, 내 고민 텍스트 crop `(15,150)-(380,290)`, answer1 `(0,300)-(393,490)`, answer2 `(0,490)-(393,700)`, answer text crop `(15,330)-(380,620)`, like crop `(15,400)-(190,693)`, dislike crop `(190,400)-(380,700)`, bottom bar `(0,720)-(393,852)`, home indicator crop `(80,820)-(320,852)`. Reference에 별도 comment UI는 보이지 않음.
    - tolerated difference: reference status bar/time/network/battery와 home indicator는 production UI에서 제외하는 static OS chrome으로 기록.
- [x] TODO-P7.2: 08을 `src/screens/answerCheck/**` 전용 deep module로 분리하고 `replyDetail` 단일 답변 상세 의존을 제거한다.
  - 대상 파일: `src/screens/answerCheck/AnswerCheckContainer.tsx`, `src/screens/answerCheck/AnswerCheckScreen.tsx`, `src/screens/answerCheck/contract.ts`, `src/screens/answerCheck/mapping.ts`, `src/screens/importBoundaries.test.ts`
  - 완료 기준: 08은 단일 답변 상세가 아니라 여러 답변 read model을 받는 screen contract를 갖고, `replyDetail`은 새 PRD route flow에서 호출되지 않는다.
  - 검증: import boundary test와 route rendering test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P7.11.
  - completion note:
    - changed files: `src/screens/answerCheck/contract.ts`, `src/screens/answerCheck/mapping.ts`, `src/screens/answerCheck/AnswerCheckScreen.tsx`, `src/screens/answerCheck/AnswerCheckContainer.tsx`, `src/screens/answerCheck/AnswerCheckScreen.test.tsx`, `src/screens/answerCheck/mapping.test.ts`, `src/screens/importBoundaries.test.ts`, `src/App.tsx`, `src/services/appShell/routeRenderingBoundary.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/services/appShell/appMonolithGuardrail.test.ts`, `src/services/replyPublication/runtimeBoundary.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`
    - capture type: harness component
    - harness route/data verification: `routeRenderingBoundary.test.ts`, `prdNavigationPolicy.test.ts`, `appMonolithGuardrail.test.ts`, `runtimeBoundary.test.ts`, `importBoundaries.test.ts`가 answerCheck route/container 연결과 replyDetail 비호출/비의존을 검증.
    - reference PNG path: `design/reference/pngs/screens/08-answer-check.png`
    - measured result: 08 contract는 `worry` 1개와 `replies[]` 여러 개를 받으며 `AnswerCheckScreen.test.tsx`가 여러 답변 카드 렌더링을 검증. `answerCheck/**`는 `replyDetail` 구현을 import/reference하지 않는다.
    - tolerated difference: legacy `src/screens/replyDetail/**` 파일은 삭제하지 않고 새 PRD route flow에서 호출하지 않게 분리.
- [x] TODO-P7.3: 08 뒤로 가기는 20-my-worries로 이동한다.
  - 대상 파일: appShell route helper, answer check container
  - 완료 기준: back route가 `my_worries`이고 06/13/기존 detail로 이동하지 않는다.
  - 검증: route test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/answerCheck/AnswerCheckContainer.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `backRouteForRoute({ route: 'answer_check', worryId })` returns `my_worries`; tests assert it is not `답변하기`, `my_answers`, or `received_answer_detail`.
    - reference PNG path: 해당 없음
    - measured result: 08 `onBack` uses route policy and returns to 20/my_worries.
    - tolerated difference: `my_worries` is canonical route object target; active tab remains `나의 고민`.
- [x] TODO-P7.4: Phase 4의 `answer_check` route object를 실제 08 route rendering과 연결한다.
  - 대상 파일: `src/App.tsx`, `src/services/appShell/routeRenderingBoundary.ts`, `src/screens/answerCheck/AnswerCheckContainer.tsx`, route tests
  - 완료 기준: 20에서 만든 `answer_check` route state가 `AnswerCheckContainer`를 렌더링하고 worryId를 전달한다. 20 화면 구현 자체를 다시 수정하지 않는다.
  - 검증: route rendering test와 20→08 container flow test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/App.tsx`, `src/services/appShell/routeRenderingBoundary.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/screens/answerCheck/AnswerCheckContainer.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `MyWorriesContainerPolicy.test.ts` verifies 20 card creates `routeToAnswerCheck({ worryId })`; `routeRenderingBoundary.test.ts` maps `answer_check` to answer-check group; `App.tsx` mounts `AnswerCheckContainer` only for id-bearing `answer_check` route state.
    - reference PNG path: 해당 없음
    - measured result: App shell only wires route/container and does not include feedback/data mapping logic.
    - tolerated difference: string `answer_check` without `worryId` does not mount 08; no PRD-unowned error UI added.
- [x] TODO-P7.5: 답변 0개 상태는 내 고민만 보이고 별도 empty 문구를 표시하지 않는다.
  - 대상 파일: answer check screen/contract
  - 완료 기준: replies array가 비어도 empty component가 렌더링되지 않는다.
  - 검증: screen state test.
  - production PNG evidence: 없음. 같은 phase에서 empty visual을 캡처하면 `tmp/answer-check-pixel-alignment/08-answer-check-empty-production.png`를 기록한다.
  - completion note:
    - changed files: `src/screens/answerCheck/AnswerCheckScreen.test.tsx`, `src/screens/answerCheck/mapping.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `AnswerCheckScreen.test.tsx` verifies zero replies renders my worry and no answer card/empty copy.
    - reference PNG path: 해당 없음
    - measured result: replies `[]` keeps worry card visible and renders no `도착한 답변</p>` cards; no `아직 답변이 없어요` or `첫 고민을 남겨보세요` copy.
    - tolerated difference: optional empty-state PNG not created.
- [x] TODO-P7.6: 좋아요 클릭은 즉시 확정되고 helpedCount 증가와 코멘트 선택 입력을 분리한다.
  - 대상 파일: answer check container, `src/services/replyFeedback/**` tests if existing API supports it
  - 완료 기준: like mutation 성공 후 답변 박스는 유지되고 comment dialog는 submit/skip 가능하다.
  - 검증: container/service policy tests.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/answerCheck/AnswerCheckContainer.tsx`, `src/screens/answerCheck/AnswerCheckScreen.tsx`, `src/screens/answerCheck/AnswerCheckScreen.test.tsx`, `src/services/replyFeedback/serverFirestore.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `AnswerCheckContainer` calls `submitReplyFeedbackWithProductionAdapters` immediately on like without comment, keeps local feedback state, and opens optional comment dialog after success; `serverFirestore.test.ts` verifies like creates helpedCount application once and delayed like comment does not increment again.
    - reference PNG path: 해당 없음
    - measured result: like and comment are separate actions in screen contract; comment dialog supports submit and skip/close.
    - tolerated difference: mutation failure UX remains existing alert-only `전송 실패`; no optimistic rollback policy added.
- [x] TODO-P7.7: 싫어요 클릭은 즉시 확정하되 답변 숨김은 코멘트 창 종료 후 수행한다.
  - 대상 파일: answer check container/screen
  - 완료 기준: dislike selected state와 comment dialog lifecycle이 테스트되고, dialog 종료 후 해당 answer card가 숨겨진다.
  - 검증: state interaction test.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/answerCheck/AnswerCheckContainer.tsx`, `src/services/replyFeedback/serverFirestore.ts`, `src/services/replyFeedback/serverFirestore.test.ts`, `src/screens/answerCheck/AnswerCheckScreen.test.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `AnswerCheckContainer.closeComment` hides disliked reply only when disliked comment dialog closes; `serverFirestore.test.ts` verifies delayed dislike comment updates once and stays `admin_only`.
    - reference PNG path: 해당 없음
    - measured result: dislike mutation is immediate; local hidden state is applied after submit/skip close, not on click.
    - tolerated difference: server read-model hide policy remains separate from local dialog lifecycle.
- [x] TODO-P7.8: 좋아요/싫어요 코멘트는 답변 하나당 1개만 허용하고 AI 필터링을 거친다.
  - 대상 파일: answer check container, `src/services/replyFeedback/*`
  - 완료 기준: duplicate comment attempt와 moderation rejected case가 테스트된다.
  - 검증: `src/services/replyFeedback/*.test.ts`
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/services/replyFeedback/serverFirestore.ts`, `src/services/replyFeedback/serverFirestore.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: existing moderation tests cover rejected moderation saves moderation log only and no feedback; `serverFirestore.test.ts` covers delayed like/dislike comment one-time update and conflict on duplicate overwrite.
    - reference PNG path: 해당 없음
    - measured result: duplicate comment attempts conflict; moderation rejected comments are not stored as feedback; dislike comments use `admin_only`.
    - tolerated difference: feedback server/API internals changed only after tests exposed delayed dislike comment policy mismatch.
- [x] TODO-P7.9: 싫어요와 싫어요 코멘트가 답변자용 read model/API에 노출되지 않는 정책을 검증한다.
  - 대상 파일: `src/services/replyFeedback/*`, answer check tests, existing read model policy tests when that layer owns the behavior
  - 완료 기준: dislike/comment는 answer-check 피드백 처리에는 저장되지만 답변자에게 반환되는 read model에는 포함되지 않는다. 13 화면 표시 검증은 Phase 8에서 수행한다.
  - 검증: service/read model policy tests.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/services/myWorries/prdPolicy.ts`, `src/services/myWorries/prdPolicy.test.ts`, `src/services/replyFeedback/serverFirestore.test.ts`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: `prdPolicy.test.ts` verifies disliked reply remains in replier's given-replies list as no-feedback and dislike comment is absent from replier read model.
    - reference PNG path: 해당 없음
    - measured result: `selectMyGivenReplies` filters replier-visible feedbacks to like only; dislike/comment can exist in feedbacks but do not become `feedback` or `publisherComment` in replier read model.
    - tolerated difference: Phase 8 will handle 13 visual display, but service/read-model policy is locked here.
- [x] TODO-P7.10: 08 answer check 화면에서 답변 작성자의 개인정보가 노출되지 않음을 검증한다.
  - 대상 파일: `src/screens/answerCheck/mapping.ts`, `src/screens/answerCheck/contract.ts`, `src/screens/answerCheck/AnswerCheckScreen.tsx`
  - 완료 기준: answer writer nickname, gender, age, interests, profile metadata가 answer cards props/DOM에 없고 PRD가 허용한 답변 내용과 feedback controls만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
  - completion note:
    - changed files: `src/screens/answerCheck/contract.ts`, `src/screens/answerCheck/mapping.ts`, `src/screens/answerCheck/AnswerCheckScreen.tsx`, `src/screens/answerCheck/mapping.test.ts`, `src/screens/answerCheck/AnswerCheckScreen.test.tsx`
    - test command/result: `npm test` pass; `npm run lint` pass; `npm run build` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: 해당 없음
    - capture type: 해당 없음
    - harness route/data verification: mapping fixture injects answer writer nickname/gender/age/interests/profile metadata/internal uid strings and asserts output JSON excludes them; screen DOM test asserts sensitive strings are absent.
    - reference PNG path: 해당 없음
    - measured result: answer card props contain only reply id/body/date/feedback control state; worry props contain PRD-allowed worry context only.
    - tolerated difference: internal `senderId/replierUid` remains service read model input but is not mapped into answer card props/DOM.
- [x] TODO-P7.11: 08 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`
  - 완료 기준: 393x852 production capture이며 추가 보고 파일이 필요하면 한국어 HTML만 있고 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`.
  - completion note:
    - changed files: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`, `tmp/answer-check-pixel-alignment/measurements.html`, `tmp/answer-check-pixel-alignment/harness/index.html`, `tmp/answer-check-pixel-alignment/harness/src/main.tsx`
    - test command/result: `npm run build` pass; Playwright capture pass; PIL PNG size verification pass; `npm test` pass; `npm run lint` pass; `npm run validate:design-reference` pass; `npm run test:rules` pass.
    - production PNG path: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`
    - capture type: harness component
    - harness route/data verification: production `AnswerCheckScreen.tsx`, real answer-check contract, `MobileAppShell`, and `BottomNavigation` imported by harness; route/container verified by `routeRenderingBoundary.test.ts`, `prdNavigationPolicy.test.ts`, `appMonolithGuardrail.test.ts`, `runtimeBoundary.test.ts`, and `MyWorriesContainerPolicy.test.ts`.
    - reference PNG path: `design/reference/pngs/screens/08-answer-check.png`
    - measured result: production size `393x852`; dominant `#ffffff 176638`, `#fff3df 61261`, `#fff8ef 12698`, `#fdf6ed 4624`; non-bg bbox `(0,0)-(393,852)`. Reference size `393x852`; dominant `#ffffff 195303`, `#fff1d1 75583`, `#fff5eb 12101`, `#ff8b3d 4265`; non-bg bbox `(0,0)-(393,852)`. Main crops recorded in `tmp/answer-check-pixel-alignment/measurements.html`.
    - tolerated difference: reference static OS chrome excluded; full route capture avoided because auth/Firebase seed data would obscure pixel verification; harness capture is component-level with route/container closed by tests.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:rules` if feedback/read model rules changed.

완료 보고 형식:
- answer-check module decision, feedback state policy, privacy test 결과, evidence 경로를 보고한다.

## Phase 8: 10/12/13/14 My-Page Subflows

목표: 마이페이지와 관심 분야 수정, 내가 쓴 답변 목록, 개인정보처리방침을 MVP 범위와 PNG에 맞춘다.
허용 수정 범위: `src/screens/myPage/**`, `src/services/policyDocuments/**` only for privacy-only/empty message policy, relevant tests.
금지 수정 범위: app install/PWA guide 기능 추가, operation policy route 유지.

- [ ] TODO-P8.1: 10/12/13/14 PNG PIL anchor를 재측정한다.
  - 대상 파일: `design/reference/pngs/screens/10-my-page.png`, `12-edit-interests.png`, `13-my-answers.png`, `14-privacy-policy.png`
  - 완료 기준: profile summary, setting rows, chip grid, answer list cards, policy body area bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 completion note.
  - production PNG evidence: 없음.
- [ ] TODO-P8.2: `MyPageScreen`에서 앱처럼 사용하기 QR/공유 영역과 운영정책 항목을 제거한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 10 PNG 항목만 남고 `QrCode`, `Share2`, `QRCodeSVG`, `operation_policy`, `app_install_guide` UI가 없다.
  - 검증: `rg -n "QrCode|Share2|QRCodeSVG|operation_policy|app_install_guide" src/screens/myPage`
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.3: `MyPageContainer`/contract에서 MVP 제외 props와 route handling을 제거한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/contract.ts`, tests
  - 완료 기준: operation policy/app install props와 dispatch가 사라지고 개인정보처리방침만 policy route로 남는다.
  - 검증: `src/screens/myPage/contract.test.ts`, `src/screens/myPage/importBoundary.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P8.4: 10 마이페이지 표시 항목을 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/mapping.ts`
  - 완료 기준: 닉네임, 받은 좋아요/하트 총합, 관심 분야 수정, 내가 쓴 답변 preview, 전체보기, 알림 토글, 개인정보처리방침, 로그아웃, 회원 탈퇴만 표시한다.
  - 검증: screen rendering test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.5: 알림 설정을 토글 UI와 브라우저 권한 제약 문구로 표현한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`
  - 완료 기준: 별도 `notification_settings` route 없이 10 화면 안에서 토글 상태를 제어한다.
  - 검증: screen interaction test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.6: 12 관심 분야 수정 화면을 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyPageContainer.tsx`
  - 완료 기준: 3열 고정 크기 칩, 0개 저장 시 `1개 이상의 관심 분야를 선택해주세요.`, 저장 성공 후 10 이동, 실패 시 기존 선택 유지.
  - 검증: container/screen interaction tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.7: 13 내가 쓴 답변 목록을 PRD feedback visibility로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyAnswersScreen.tsx`, `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.ts`
  - 완료 기준: 모든 답변 동일 형식, 좋아요는 하트만, 코멘트 있으면 1개 작은 폰트, 싫어요는 피드백 없음처럼 표시.
  - 검증: mapping/screen tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.8: 13 내가 쓴 답변 목록에서 고민 작성자의 개인정보가 노출되지 않음을 검증한다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyAnswersScreen.tsx`
  - 완료 기준: worry publisher nickname, gender, age, interests, profile metadata가 my answers props/DOM에 없고 PRD가 허용한 고민 context/답변/피드백만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
- [ ] TODO-P8.9: 마이페이지 profile summary가 PRD가 허용한 현재 사용자 본인 nickname만 표시하는지 검증한다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyPageScreen.tsx`
  - 완료 기준: 현재 사용자 본인 nickname 외 gender, age, profile metadata가 profile summary에 노출되지 않는다. 관심 분야는 PRD가 허용한 수정 화면/선택 상태에서만 표시된다.
  - 검증: mapping/screen test 또는 completion note의 수동 DOM verification.
  - production PNG evidence: 없음.
- [ ] TODO-P8.10: 내가 쓴 답변 상세 route를 PRD대로 제거 또는 비활성화한다.
  - 대상 파일: `src/screens/myPage/MyAnswersContainer.tsx`, appShell routes, replyDetail routes/tests
  - 완료 기준: 새 PRD의 `내가 쓴 답변 상세 화면은 MVP에서 제공하지 않는다`에 맞춰 `my_answer_detail` 이동이 제거된다.
  - 검증: `rg -n "my_answer_detail|routeToMyReplyDetail|read_my_reply" src`
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.11: 14 개인정보처리방침 source와 empty 문구를 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/MyPageScreen.tsx`, `src/services/policyDocuments/*`
  - 완료 기준: `docs/privacy_policy.md`만 source of truth이고 빈 경우 `정책을 준비 중입니다.`를 표시한다.
  - 검증: `src/services/policyDocuments/policyLoader.test.ts`, screen test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P8.12.
- [ ] TODO-P8.12: 10/12/13/14 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-page-pixel-alignment/10-my-page-production.png`, `12-edit-interests-production.png`, `13-my-answers-production.png`, `14-privacy-policy-production.png`
  - 완료 기준: 네 PNG가 393x852 production capture이고 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run validate:design-reference`

완료 보고 형식:
- MVP 제외 항목 제거, helpedCount 문구, 12/13/14 정책, evidence 경로를 보고한다.

## Phase 9: 15/16 Logout/Account Deletion Overlays

목표: 로그아웃/탈퇴 확인을 10 마이페이지 위 overlay/dialog로 맞춘다.
허용 수정 범위: `src/screens/myPage/**`, `src/services/userAccount/**` tests only if deletion policy requires.
금지 수정 범위: DB 완전 삭제 정책 추가, 별도 full page route로 전환.

- [ ] TODO-P9.1: 15/16 PNG PIL anchor를 재측정한다.
  - 대상 파일: `design/reference/pngs/screens/15-logout.png`, `16-account-deletion.png`
  - 완료 기준: dimmed background, dialog card, 취소/확인 버튼 bbox와 text/glyph bbox, safe-area/home-indicator 제외 여부가 기록된다.
  - 검증: PIL 측정 completion note.
  - production PNG evidence: 없음.
- [ ] TODO-P9.2: 로그아웃/탈퇴 확인을 마이페이지 위 overlay/dialog로 구현한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/shared/ui.tsx`
  - 완료 기준: 배경의 마이페이지와 하단바가 흐릿하게 보이고 클릭 불가능하다.
  - 검증: screen interaction/accessibility test.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P9.6.
- [ ] TODO-P9.3: 15 취소/로그아웃 flow를 검증한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/services/userAccount/accountSession.test.ts`
  - 완료 기준: 취소는 10 복귀, 로그아웃은 signOut/cleanup 후 02-login 이동.
  - 검증: container/service tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P9.6.
- [ ] TODO-P9.4: 16 취소/탈퇴 flow를 검증한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/services/userAccount/deleteMyAccount.test.ts`
  - 완료 기준: 취소는 10 복귀, 탈퇴는 account deletion API와 cleanup 후 02-login 이동.
  - 검증: container/service tests.
  - production PNG evidence: 없음. Same-phase visual confirmation: TODO-P9.6.
- [ ] TODO-P9.5: 탈퇴 정책을 접근권 삭제/비활성화 의미로 테스트에 고정한다.
  - 대상 파일: `src/services/userAccount/*`, `src/server/userAccountRoutes.test.ts`, `src/firestore.rules.test.ts`
  - 완료 기준: 추가 확인 입력 없이 동작하고 DB 문서 완전 삭제가 아닌 deleted/inactive 접근 제한 정책을 검증한다.
  - 검증: `npm test`, `npm run test:rules`
  - production PNG evidence: 없음.
- [ ] TODO-P9.6: 15/16 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/account-overlays-pixel-alignment/15-logout-production.png`, `tmp/account-overlays-pixel-alignment/16-account-deletion-production.png`
  - 완료 기준: 두 PNG가 393x852 production capture이고 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:rules`

완료 보고 형식:
- overlay interaction, account/session policy tests, evidence 경로를 보고한다.

## Phase 10: Empty/Loading States Not Present in PNG

목표: PNG에 없는 empty/loading/comment states를 PRD 문구와 구현 범위 안에서만 정리한다.
허용 수정 범위: relevant screen files, shared spinner primitive, screen state tests.
금지 수정 범위: PRD에 없는 네트워크 오류 UX 확장, 별도 디자인 문서 산출물.

- [ ] TODO-P10.1: PNG에 없는 답변하기 empty/loading, 나의 고민 empty/loading, feedback comment UI를 06~20 톤에 맞춰 정리한다.
  - 대상 파일: `src/screens/receivedWorries/*`, `src/screens/myPage/*`, answer check module
  - 완료 기준: 별도 reference PNG가 없는 상태도 기존 색상/spacing/token을 쓰며 PRD 문구를 넘어서지 않는다.
  - 검증: screen state tests.
  - production PNG evidence: 없음. Optional Phase 10 PNGs are handled only by TODO-P10.5 and are not a completion condition for this checkbox.
- [ ] TODO-P10.2: empty 문구를 screen state test로 검증한다.
  - 대상 파일: `src/screens/receivedWorries/*`, `src/screens/myPage/MyWorries*`
  - 완료 기준: 답변하기 empty는 `지금은 도착한 고민이 없어요.`, 나의 고민 empty는 `첫 고민을 남겨보세요.`.
  - 검증: screen state tests.
  - production PNG evidence: 없음. Optional Phase 10 PNGs are handled only by TODO-P10.5 and are not a completion condition for this checkbox.
- [ ] TODO-P10.3: loading은 skeleton이 아니라 spinner로 통일한다.
  - 대상 파일: shared/screen files
  - 완료 기준: loading states use spinner primitive.
  - 검증: screen tests 또는 DOM inspection.
  - production PNG evidence: 없음. Optional Phase 10 PNGs are handled only by TODO-P10.5 and are not a completion condition for this checkbox.
- [ ] TODO-P10.4: 네트워크 오류 상태를 PRD 제품 정책으로 확장하지 않는다.
  - 대상 파일: screen state files
  - 완료 기준: 오류 상태는 기존 구현 세부로 유지하고 새 PRD UI 요구로 과도하게 확장하지 않는다.
  - 검증: code review note.
  - production PNG evidence: 없음.
- [ ] TODO-P10.5: Phase 10에서 empty/loading visual review를 의도적으로 수행한 경우 production PNG evidence를 모아 기록한다.
  - 대상 파일: `tmp/empty-loading-pixel-alignment/*-production.png`
  - 완료 기준: Phase 10에서 empty/loading PNG를 만들었다면 production PNG가 있고, 추가 보고 파일이 필요하면 한국어 HTML만 있으며 capture note 필수 필드가 기록된다. PNG를 만들지 않았다면 `production PNG evidence: 없음; visual review not performed`를 completion note에 기록한다.
  - 검증: `find tmp/empty-loading-pixel-alignment -type f | sort`
  - production PNG evidence: `tmp/empty-loading-pixel-alignment/*-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- empty/loading 문구, spinner 통일, 생성한 evidence 경로를 보고한다.

## Phase 11: Design/Reference Screen-Map and Validation Hardening

목표: `design/reference/screen-map.json`과 validator가 01~20 기준과 production files를 정확히 추적하게 한다.
허용 수정 범위: `design/reference/screen-map.json`, `scripts/validateDesignReference.mjs`, validator tests if added.
금지 수정 범위: reference PNG 수정/복사, production UI 코드 변경.

- [ ] TODO-P11.1: `screen-map.json`을 06~20 실제 PNG 파일명과 production files로 업데이트한다.
  - 대상 파일: `design/reference/screen-map.json`
  - 완료 기준: `design/reference/pngs/screens/*.png` 경로를 사용하고 06~20 production screen/container/contract/mapping이 정확하다.
  - 검증: `npm run validate:design-reference`
  - production PNG evidence: 없음.
- [ ] TODO-P11.2: 11번 화면은 없음/미사용으로 명시하고 production route에 매핑하지 않는다.
  - 대상 파일: `design/reference/screen-map.json`, `scripts/validateDesignReference.mjs`
  - 완료 기준: screen 11이 required production mapping으로 취급되지 않는다.
  - 검증: validator output.
  - production PNG evidence: 없음.
- [ ] TODO-P11.3: `validateDesignReference.mjs`가 새 screen-map 구조와 PNG 경로를 검증하게 한다.
  - 대상 파일: `scripts/validateDesignReference.mjs`
  - 완료 기준: missing reference PNG, missing production file, wildcard misuse, 11 misuse를 실패로 잡는다.
  - 검증: `npm run validate:design-reference`
  - production PNG evidence: 없음.
- [ ] TODO-P11.4: `design/current`나 reference fixture가 있다면 preview-only 범위를 명시한다.
  - 대상 파일: `design/reference/screen-map.json`, validator notes fields
  - 완료 기준: production UI와 PRD 정책을 reference preview 코드가 오염시키지 않는다.
  - 검증: `rg -n "design/reference/src|screenshots|pngs/screens" design/reference/screen-map.json`
  - production PNG evidence: 없음.
- [ ] TODO-P11.5: phase 완료 조건에 design validation을 포함한다.
  - 대상 파일: package/validator config
  - 완료 기준: `npm run validate:design-reference`가 통과한다.
  - 검증: `npm run validate:design-reference`
  - production PNG evidence: 없음.

검증 명령:
- `npm run validate:design-reference`
- `npm test` if validator tests are added

완료 보고 형식:
- screen-map 변경, 11 미사용 처리, validator 결과를 보고한다.

## Phase 12: Final PRD Compliance and Pixel Evidence Audit

목표: 모든 PRD 요구사항, route flow, screen-map, production PNG evidence를 최종 점검한다.
허용 수정 범위: 누락된 tests/evidence generation only, final audit fixes in already-owned modules.
금지 수정 범위: 새 기능 추가, PRD 수정, Markdown/JSON 부가 audit 문서 산출물.

- [ ] TODO-P12.1: `docs/PRD.md`의 모든 화면 요구사항을 01~20 screen/file/test/evidence에 매핑한다.
  - 대상 파일: `docs/TODO.md` completion notes only, production files/tests as evidence
  - 완료 기준: 01~20 중 11 없음/미사용을 제외한 모든 화면이 file/test/PNG evidence와 연결된다.
  - 검증: code review note in TODO completion.
  - production PNG evidence: all phase PNGs.
- [ ] TODO-P12.2: MVP 제외 범위가 실제 route/settings/screen-map에서 제거되었는지 rg로 검증한다.
  - 대상 파일: `src/**`, `design/reference/screen-map.json`
  - 완료 기준: `operation_policy`, `app_install_guide`, 중앙 액션, `my_answer_detail` 등 PRD상 제외 항목이 접근 가능한 route/UI에 남지 않는다.
  - 검증: `rg -n "operation_policy|app_install_guide|CENTRAL_BOTTOM_NAVIGATION_ACTION|onCentralAction|my_answer_detail|read_my_reply|notification_settings" src design/reference/screen-map.json`
  - production PNG evidence: 없음.
- [ ] TODO-P12.3: PRD route flow를 테스트로 검증한다.
  - 대상 파일: appShell/writeForm/myPage/answerCheck tests
  - 완료 기준: 07→09→20, 17→19→06, 20→08, 10→12/13/14/15/16 flow가 통과한다.
  - 검증: `npm test`
  - production PNG evidence: corresponding phase PNGs.
- [ ] TODO-P12.4: 모든 screen production PNG evidence가 패턴대로 남아 있는지 확인한다.
  - 대상 파일: `tmp/*-pixel-alignment/*-production.png`
  - 완료 기준: 06, 07, 08, 09, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20 및 01~05 regression capture가 존재한다.
  - 검증: `find tmp -path '*pixel-alignment*/*-production.png' -type f | sort`
  - production PNG evidence: all listed PNG files.
- [ ] TODO-P12.5: final audit 산출물이 필요하면 production PNG 중심으로 생성한다.
  - 대상 파일: `tmp/final-prd-design-audit/*-production.png`
  - 완료 기준: final audit 디렉터리에 production PNG가 있고, 추가 보고 파일이 필요하면 한국어 HTML만 있다.
  - 검증: `find tmp/final-prd-design-audit -type f | sort`
  - production PNG evidence: `tmp/final-prd-design-audit/*-production.png`.
- [ ] TODO-P12.6: 최종 검증 명령을 모두 통과해야 체크한다.
  - 대상 파일: whole repo
  - 완료 기준: `npm test`, `npm run lint`, `npm run build`, `npm run test:rules`, `npm run validate:design-reference`가 모두 통과한다.
  - 검증: listed commands.
  - production PNG evidence: 없음.
- [ ] TODO-P12.7: 최종 보고서에는 완료/미완료 TODO ID와 잔여 mismatch를 포함한다.
  - 대상 파일: final chat/report only; 파일 보고가 필요하면 한국어 HTML
  - 완료 기준: 체크 완료/미완료 TODO ID, 미완료 사유, PRD 불일치 잔여 항목, pixel mismatch 잔여 항목, 수동 확인 필요 화면, 각 PNG의 `capture type`이 보고된다.
  - 검증: final review.
  - production PNG evidence: 없음.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:rules`
- `npm run validate:design-reference`

완료 보고 형식:
- 변경 파일, phase별 완료 상태, PRD 요구사항 closure, 01~20 mapping, deep module guardrail 준수, production PNG evidence 경로, 실행 명령 결과, 추가 확인 필요 사항을 한국어로 보고한다.
