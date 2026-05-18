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
  - completion note는 체크박스 아래에 한 줄로 남기되 별도 markdown/html/json 리포트 파일을 만들지 않는다.
  - `TODO-P0.4`가 완료되기 전에는 Phase 1~12의 구현 체크박스를 시작하지 않는다. Phase 1~12 작업자는 먼저 06~20 Measurement Anchor 표가 모든 필수 항목을 채웠는지 확인한다.
  - PRD와 구현 가능성이 충돌하면 해당 TODO를 체크하지 않는다. 체크박스 아래에 `PRD clarification required: ...` completion note를 남기고, 사용자 확인 전까지 다음 구현으로 진행하지 않는다.
- 금지사항:
  - `docs/PRD.md`는 절대 수정하지 않는다. PRD 오류가 의심되면 사용자에게 정정을 요청한다.
  - 이번 전체 작업에서 운영정책, 앱처럼 사용하기 안내, 이용약관, 로그인 화면 정책/약관 링크를 MVP 기능으로 되살리지 않는다.
  - 중앙 하단 눈 인디케이터를 클릭 가능한 button/action으로 구현하지 않는다.
  - 고민 작성 진입점을 하단 중앙 눈 또는 답변하기 화면에 추가하지 않는다.
  - pixel evidence 디렉터리에 `measurement.md`, `implementation-notes.md`, `verification.md`, `*.html`, JSON 리포트 등 부가 산출물을 남기지 않는다.
- 공통 검증 명령:
  - 계획 작성 검증: `git diff -- docs/TODO.md`, `npm run validate:design-reference`
  - 구현 phase 완료 검증: `npm test`, `npm run lint`, `npm run build`, `npm run test:rules`, `npm run validate:design-reference`
- Phase별 production PNG evidence 규칙:
  - 기존 `tmp/onboarding-pixel-alignment/**-production.png` 패턴을 따른다.
  - 산출물 디렉터리에는 production 화면 캡처 PNG만 남긴다.
  - PNG 파일명은 route/screen/state를 알 수 있게 `*-production.png` suffix를 사용한다.
  - PNG는 실제 production route/screen을 렌더링한 결과여야 한다.
  - reference PNG 복사, `design/reference` preview 앱 캡처, `design/reference/src` component 캡처는 금지한다.
  - 캡처 자동화에 필요한 일시적 파일은 생성 후 제거한다.
  - capture helper가 필요하면 임시 생성 후 제거하고, 최종 산출물은 `tmp/*-pixel-alignment/*-production.png`만 남긴다.
  - 모든 PNG는 393x852 reference PNG와 비교 가능한 production capture인지 확인한다.
- Pixel mismatch 허용 기준:
  - canvas size: `393x852` exact.
  - layout bbox: reference anchor 대비 `±1px`.
  - text/glyph bbox: reference anchor 대비 `±2px`.
  - dominant background color: exact hex match를 우선한다. anti-aliasing으로 인한 소수 픽셀 차이는 bbox 판정에 포함하지 않되 dominant color hex 자체는 바꾸지 않는다.
  - status/time/network/battery와 home indicator bbox는 reference 분석용 anchor로만 유지한다. production pixel mismatch 판정 대상에서는 제외하며, production DOM에 해당 요소를 구현해서 맞추는 것은 금지한다.
  - 06~20 Measurement Anchor 표에 근사 표기가 남아 있으면 `TODO-P0.4`를 체크하지 않는다.

## Fresh Measurement Anchors

### Already Implemented Onboarding Regression Anchors

| Screen | Item | Fresh PNG-measured bbox/value |
|---|---|---|
| 03 | size | `393x852` |
| 03 | dominant colors | `#fff7e3` 226111 px, `#ff8b0d` 92531 px |
| 03 | non-dominant bbox | `(0,0)-(393,843)` |
| 03 | status/time | `(30,21)-(74,34)` |
| 03 | header title | `(165,73)-(222,89)` |
| 03 | question badge | `(30,132)-(118,141)` |
| 03 | main title | `(28,140)-(253,175)` |
| 03 | progress | `(24,235)-(369,241)` |
| 03 | subtitle | `(24,260)-(292,272)` |
| 03 | nickname input | `(22,339)-(367,399)` |
| 03 | gender boxes | `(22,452)-(367,512)` |
| 03 | age input | `(22,580)-(367,640)` |
| 03 | CTA | `(24,752)-(369,808)` |
| 04 | size | `393x852` |
| 04 | dominant colors | `#fff7e3` 224562 px, `#ff8b0d` 92531 px |
| 04 | duplicate message | `(89,311)-(365,323)` |
| 04 | red error/input bbox | `(22,312)-(367,399)` |
| 04 | other major boxes | same as 03 |
| 05 | size | `393x852` |
| 05 | dominant colors | `#fff7e3` 163556 px, `#ff8b0d` 88103 px, `#fff1d1` 57070 px |
| 05 | header title | `(171,73)-(228,89)` |
| 05 | question badge | `(30,132)-(120,141)` |
| 05 | main title | `(28,140)-(287,175)` |
| 05 | subtitle/helper | `(24,260)-(295,292)` |
| 05 | chip grid outer | `(34,322)-(358,708)` |
| 05 | chip size/gap | each `103x44`; rows at `322,379,436,493,550,607,664`; columns mostly `35/145/255`, lower rows `34/144/254` |
| 05 | previous CTA | `(24,752)-(120,808)` |
| 05 | complete CTA | `(130,752)-(369,808)` |

### 06~20 Required Measurement Anchor Tables

이 섹션은 Phase 1~12 구현의 gate다. `TODO-P0.4` 완료 전에는 아래 각 화면 표를 PIL 재측정값으로 검증하고, 필요한 경우 completion note로 수정한 뒤에만 구현 체크박스를 시작한다. 모든 bbox는 `design/reference/pngs/screens/*.png`를 393x852 canvas 기준으로 측정한 `(left,top)-(right,bottom)` 값이다. `none`은 해당 화면에 그 element가 없거나 production에서 구현하지 않아야 함을 뜻한다.

#### Screen 06: received-worries

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ffffff` 181468 px, `#ff8b3d` 54530 px, `#fff1d1` 35241 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | full orange header `(0,0)-(393,121)`, right my-page icon/text cluster `(341,76)-(362,97)` |
| primary card/input/modal bbox | worry cards `(12,129)-(381,272)`, `(12,278)-(381,421)`, `(12,427)-(381,570)`, `(12,576)-(381,719)` |
| text/glyph bbox | card category chips `(34,150)-(78,174)`, `(34,299)-(78,323)`, `(34,448)-(79,471)`, `(34,597)-(78,621)`, summary text clusters `(52,200)-(279,215)`, `(82,349)-(212,364)`, `(82,498)-(354,513)`, `(52,647)-(267,662)` |
| CTA bbox | skip buttons `(301,150)-(366,173)`, `(301,299)-(366,322)`, `(301,448)-(366,471)`, `(301,597)-(366,620)` |
| bottom navigation bbox | `(0,746)-(393,852)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 07: question-write-a

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#fff5eb` 201042 px, `#fff1d1` 101783 px, `#ff8b3d` 17679 px |
| non-bg bbox | `(0,0)-(393,828)` |
| top header/icon/button bbox | top/back/title band `(0,0)-(393,121)`, title glyph cluster `(115,147)-(282,164)` |
| primary card/input/modal bbox | write input panel `(24,183)-(369,650)` |
| text/glyph bbox | placeholder/helper glyphs `(303,626)-(353,637)`, title line `(44,144)-(282,164)` |
| CTA bbox | bottom left nav button `(16,792)-(132,828)`, bottom center eye `(149,764)-(244,823)`, bottom right nav button `(262,792)-(378,828)` |
| bottom navigation bbox | `(0,764)-(393,828)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 08: answer-check

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ffffff` 195303 px, `#fff1d1` 75583 px, `#fff5eb` 12101 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | header band `(0,0)-(393,118)`, category chip `(34,138)-(79,161)` |
| primary card/input/modal bbox | my worry card `(12,122)-(381,229)`, answer cards `(12,241)-(381,477)`, `(12,494)-(381,706)`, third visible start `(12,726)-(381,852)` |
| text/glyph bbox | my worry text `(35,176)-(283,216)`, divider `(31,226)-(363,227)`, answer text clusters `(80,271)-(272,330)`, `(80,524)-(272,583)`, `(78,732)-(229,767)` |
| CTA bbox | feedback button clusters inside cards around `(173,247)-(231,256)`, `(173,500)-(231,509)`, `(171,732)-(229,741)` |
| bottom navigation bbox | PRD 기준으로 08은 `my_worries` 하위 `answer_check` route이므로 production 하단바를 유지한다. reference PNG의 하단바 crop/미노출보다 PRD route shell 정책을 우선하며, production expected bbox는 `20`과 같은 `(0,765)-(393,852)`이다. 이로 인한 reference mismatch는 PRD clarification 대상이 아니라 의도된 PRD override로 completion note에 기록한다. |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 09: question-write-b

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ada48e` 96655 px, `#ada7a0` 76675 px, `#ffffff` 71853 px |
| non-bg bbox | `(0,21)-(393,852)` |
| top header/icon/button bbox | status/header glyphs `(24,21)-(376,88)` |
| primary card/input/modal bbox | success modal/card `(9,120)-(386,661)` |
| text/glyph bbox | modal title/body cluster `(75,230)-(318,510)`, header title glyphs `(164,72)-(224,88)` |
| CTA bbox | confirm CTA `(63,684)-(330,732)` |
| bottom navigation bbox | dimmed bottom area `(0,755)-(393,852)` |
| floating action bbox | none |
| overlay bbox | dimmed overlay full canvas `(0,0)-(393,852)`, foreground modal `(9,120)-(386,661)` |

#### Screen 10: my-page

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ffffff` 145916 px, `#ff8b0d` 129361 px, `#fff5eb` 18912 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | orange header `(0,0)-(393,121)`, profile motif `(37,147)-(101,211)`, right icon/text cluster `(276,160)-(339,171)` |
| primary card/input/modal bbox | profile summary card `(24,132)-(369,254)`, my answers preview rows `(24,300)-(369,438)`, settings rows `(44,592)-(349,689)` |
| text/glyph bbox | nickname/helped text `(121,158)-(317,175)`, preview row text `(38,318)-(293,366)`, answer preview text `(89,452)-(285,464)`, setting glyphs `(42,557)-(128,576)`, `(43,605)-(178,627)`, `(76,657)-(127,672)` |
| CTA bbox | edit interests button `(244,184)-(349,219)`, all-view answer button `(308,553)-(359,584)` |
| bottom navigation bbox | `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 11: none/unused

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | none |
| dominant colors | none |
| non-bg bbox | none |
| top header/icon/button bbox | none |
| primary card/input/modal bbox | none |
| text/glyph bbox | none |
| CTA bbox | none |
| bottom navigation bbox | none |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 12: edit-interests

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#fff7e3` 160903 px, `#ff8b0d` 92763 px, `#fff1d1` 56994 px |
| non-bg bbox | `(0,0)-(393,843)` |
| top header/icon/button bbox | orange header `(0,0)-(393,238)`, header title area `(24,70)-(369,175)` |
| primary card/input/modal bbox | chip grid outer `(34,322)-(358,708)` |
| text/glyph bbox | helper/subtitle `(24,260)-(295,292)`, chip text contained inside each `103x44` chip |
| CTA bbox | save CTA `(24,752)-(369,808)` |
| bottom navigation bbox | none; home indicator/reference bottom glyph `(129,838)-(264,843)` is not production UI |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 13: my-answers

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ff8b0d` 173469 px, `#ffffff` 103655 px, `#fff5eb` 18586 px |
| non-bg bbox | `(0,21)-(393,852)` |
| top header/icon/button bbox | status/header glyphs `(24,21)-(376,88)`, title glyphs `(157,72)-(236,88)` |
| primary card/input/modal bbox | answer cards `(12,127)-(381,303)`, `(11,314)-(380,490)` |
| text/glyph bbox | card text clusters inside `(34,162)-(295,214)` and `(34,349)-(295,401)` |
| CTA bbox | back button/icon `(24,70)-(33,85)` |
| bottom navigation bbox | `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 14: privacy-policy

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ffffff` 205773 px, `#ff8b0d` 82259 px, `#fff5eb` 18586 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | orange header `(0,0)-(393,121)`, back/title glyphs `(24,70)-(224,88)` |
| primary card/input/modal bbox | policy content area `(24,139)-(369,714)` |
| text/glyph bbox | policy title/body clusters `(34,162)-(295,214)`, `(54,262)-(299,354)` |
| CTA bbox | back button/icon `(24,70)-(33,85)` |
| bottom navigation bbox | `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 15: logout

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#adadad` 91956 px, `#ad5f09` 90140 px, `#ffffff` 59897 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | dimmed my-page header/profile remains `(0,0)-(393,254)`, profile motif `(37,147)-(101,211)` |
| primary card/input/modal bbox | confirmation modal `(44,321)-(349,531)` |
| text/glyph bbox | dimmed background setting glyphs `(42,557)-(178,720)`, modal title/body `(88,355)-(305,435)` |
| CTA bbox | modal cancel/confirm buttons `(64,466)-(188,510)`, `(205,466)-(329,510)` |
| bottom navigation bbox | dimmed `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | full dim overlay `(0,0)-(393,852)`, foreground dialog `(44,321)-(349,531)` |

#### Screen 16: account-deletion

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#adadad` 91956 px, `#ad5f09` 90140 px, `#ffffff` 59324 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | dimmed my-page header/profile remains `(0,0)-(393,254)`, profile motif `(37,147)-(101,211)` |
| primary card/input/modal bbox | confirmation modal `(44,310)-(349,543)` |
| text/glyph bbox | dimmed background setting glyphs `(42,557)-(178,720)`, modal title/body `(80,346)-(313,444)` |
| CTA bbox | modal cancel/confirm buttons `(64,478)-(188,522)`, `(205,478)-(329,522)` |
| bottom navigation bbox | dimmed `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | full dim overlay `(0,0)-(393,852)`, foreground dialog `(44,310)-(349,543)` |

#### Screen 17: answer-write-1

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#fff5eb` 156619 px, `#fff1d1` 106351 px, `#ffffff` 32146 px |
| non-bg bbox | `(0,0)-(393,828)` |
| top header/icon/button bbox | top/back/title band `(0,0)-(393,121)`, title/category glyphs `(44,271)-(295,291)` |
| primary card/input/modal bbox | worry summary card `(24,143)-(369,336)`, reply input panel `(24,371)-(369,670)` |
| text/glyph bbox | worry summary text `(72,274)-(295,289)`, placeholder/helper glyphs `(303,646)-(353,657)` |
| CTA bbox | bottom left nav button `(16,792)-(132,828)`, bottom center eye `(149,764)-(244,823)`, bottom right nav button `(262,792)-(378,828)` |
| bottom navigation bbox | `(0,764)-(393,828)` |
| floating action bbox | none |
| overlay bbox | none |

#### Screen 18: answer-write-2

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ffffff` 161394 px, `#ada48e` 62959 px, `#adadad` 17319 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | dimmed 17 header area `(0,0)-(393,121)`, overlay category chip `(16,256)-(61,279)` |
| primary card/input/modal bbox | original worry overlay panel `(0,176)-(393,692)` |
| text/glyph bbox | overlay title/content clusters `(60,293)-(365,308)`, `(16,387)-(363,493)`, `(195,217)-(221,230)` |
| CTA bbox | close CTA `(65,617)-(327,669)` |
| bottom navigation bbox | dimmed `(0,764)-(393,852)` |
| floating action bbox | none |
| overlay bbox | full dim overlay `(0,0)-(393,852)`, foreground overlay panel `(0,176)-(393,692)` |

#### Screen 19: answer-write-3

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#ada48e` 97421 px, `#ffffff` 71429 px, `#ada7a0` 43148 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | status/header glyphs `(24,21)-(376,88)` |
| primary card/input/modal bbox | success modal/card `(9,127)-(386,661)` |
| text/glyph bbox | header title glyphs `(164,72)-(224,88)`, modal title/body `(75,230)-(318,510)` |
| CTA bbox | confirm CTA `(63,684)-(330,732)` |
| bottom navigation bbox | dimmed/full canvas background `(0,751)-(393,852)` |
| floating action bbox | none |
| overlay bbox | dimmed overlay full canvas `(0,0)-(393,852)`, foreground modal `(9,127)-(386,661)` |

#### Screen 20: my-worries

| Item | PNG-measured bbox/value |
|---|---|
| canvas size | `393x852` |
| dominant colors | `#fff1d1` 130921 px, `#ffffff` 110161 px, `#ff8b3d` 51555 px |
| non-bg bbox | `(0,0)-(393,852)` |
| top header/icon/button bbox | orange header `(0,0)-(393,149)` |
| primary card/input/modal bbox | worry cards `(12,149)-(381,325)`, `(12,331)-(381,507)` |
| text/glyph bbox | card text clusters inside first/second cards `(34,176)-(300,256)`, `(34,358)-(300,438)` |
| CTA bbox | bottom navigation buttons in `(0,765)-(393,852)` |
| bottom navigation bbox | `(0,765)-(393,852)` |
| floating action bbox | write worry floating message button `(316,714)-(376,774)` |
| overlay bbox | none |

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

- [ ] TODO-P0.1: `docs/PRD.md`의 06~20 화면 요구사항, MVP 제외 범위, 제출 후 route, 중앙 눈 인디케이터, 정책 문서 범위를 TODO completion note 표로 확정한다.
  - 대상 파일: `docs/PRD.md`, `docs/TODO.md`
  - 완료 기준: 06~20 각 화면이 어느 phase에서 닫히는지와 MVP 제외 항목이 문서 안에서 추적 가능하다.
  - 검증: `rg -n "중앙 눈|앱처럼 사용하기|운영정책|09-question|19-answer|정책을 준비" docs/PRD.md`
  - production PNG evidence: 없음.
- [ ] TODO-P0.2: 현재 route 목록을 `src/services/appShell/prdNavigationPolicy.ts`와 `src/services/appShell/routeRenderingBoundary.ts`에서 추출하고 PRD route와 불일치하는 항목을 completion note에 기록한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/routeRenderingBoundary.ts`
  - 완료 기준: `operation_policy`, `app_install_guide`, `notification_settings`, `my_answer_detail`, 중앙 액션, 성공 route 불일치가 누락 없이 기록된다.
  - 검증: `rg -n "operation_policy|app_install_guide|notification_settings|my_answer_detail|CENTRAL_BOTTOM_NAVIGATION_ACTION|routeAfterWorryPublish|routeAfterReplyPublish" src/services/appShell src/App.tsx`
  - production PNG evidence: 없음.
- [ ] TODO-P0.3: `design/reference/pngs/screens`의 실제 파일 목록을 확인하고 01~20 존재/미존재/이미 구현/구현 필요 상태를 이 파일의 Screen Mapping Inventory와 대조한다.
  - 대상 파일: `design/reference/pngs/screens/*`, `docs/TODO.md`
  - 완료 기준: 11번이 없음/미사용으로 명시되고 06~20 중 존재하는 reference PNG가 모두 phase에 배정된다.
  - 검증: `find design/reference/pngs/screens -maxdepth 1 -type f | sort`
  - production PNG evidence: 없음.
- [ ] TODO-P0.4: Phase 1~12 구현 gate로 06~20 PNG Measurement Anchor 표를 PIL 재측정값으로 확정한다.
  - 대상 파일: `design/reference/pngs/screens/*.png`, `docs/TODO.md`
  - 완료 기준: 각 화면 표가 canvas size, dominant colors, non-bg bbox, top header/icon/button bbox, primary card/input/modal bbox, text/glyph bbox, CTA bbox, bottom navigation bbox, floating action bbox, overlay bbox를 모두 포함한다. 이 체크박스가 완료되기 전 Phase 1~12 구현 체크박스를 시작하지 않는다.
  - 검증: PIL 기반 일회성 명령 또는 스크립트 출력값을 TODO completion note에 기록하고, 표 좌표와 reference PNG를 수동 대조한다.
  - production PNG evidence: 없음.
- [ ] TODO-P0.5: 03/04/05 Fresh Measurement Anchors를 온보딩 회귀 방지 기준으로 유지한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/03-onboarding-basic.png`, `04-onboarding-duplicate.png`, `05-onboarding-interests.png`
  - 완료 기준: Phase 12에서 03/04/05 production PNG evidence와 비교할 수 있는 기준값이 남아 있다.
  - 검증: `rg -n "Already Implemented Onboarding Regression Anchors|03 |04 |05 " docs/TODO.md`
  - production PNG evidence: Phase 12에서 `tmp/onboarding-pixel-alignment/*-production.png`.
- [ ] TODO-P0.6: phase별 production PNG evidence 경로 규칙을 고정한다.
  - 대상 파일: `docs/TODO.md`
  - 완료 기준: 각 phase에 `tmp/*-pixel-alignment/*-production.png` 경로와 PNG 외 부가 산출물 금지가 명시된다.
  - 검증: `rg -n "production PNG evidence|PNG 외 부가 산출물|\\*-production\\.png" docs/TODO.md`
  - production PNG evidence: 없음.
- [ ] TODO-P0.7: 계획 작성 커밋 또는 구현 시작 전 변경 파일이 의도대로 제한되어 있는지 확인한다.
  - 대상 파일: `docs/TODO.md`
  - 완료 기준: 계획 작성 단계에서는 `docs/TODO.md` 외 변경이 없다.
  - 검증: `git diff --name-only`
  - production PNG evidence: 없음.

검증 명령:
- `git diff -- docs/TODO.md`
- `npm run validate:design-reference`

완료 보고 형식:
- 변경 파일, route 불일치 목록, screen mapping 상태, 측정 보강 여부를 한국어로 보고한다.

## Phase 1: Navigation/App Shell PRD Cleanup

목표: 중앙 눈을 비상호작용 인디케이터로 바꾸고 PRD route flow를 안정화한다.
허용 수정 범위: `src/services/appShell/**`, `src/screens/shared/uiContract.ts`, `src/screens/shared/ui.tsx`, `src/App.tsx`, 관련 appShell/shared tests.
금지 수정 범위: 화면 pixel 세부 조정, `src/services/**` domain/API/server logic, `src/server/**`, `server.ts`, `firestore.rules`.

- [ ] TODO-P1.1: `BottomNavigationCentralAction` 계약을 제거하고 중앙 눈 인디케이터 계약으로 대체한다.
  - 대상 파일: `src/screens/shared/uiContract.ts`, `src/screens/shared/uiContract.test.ts`
  - 완료 기준: `centralWriteWorryAction` primitive id가 제거 또는 indicator id로 대체되고, props에 `onCentralAction`/`targetRoute`가 없다.
  - 검증: `rg -n "BottomNavigationCentralAction|onCentralAction|centralWriteWorryAction|targetRoute" src/screens/shared`
  - production PNG evidence: `tmp/shared-pixel-alignment/bottom-navigation-production.png`.
- [ ] TODO-P1.2: `BottomNavigation`에서 중앙 button/onClick을 제거하고 좌/우/마이페이지 특수 상태 indicator를 구현한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`
  - 완료 기준: 중앙 눈은 `button`이 아닌 visual element이고, 답변하기/나의 고민/마이페이지 상태별 하이라이트가 PRD 7.2와 일치한다.
  - 검증: shared UI rendering test에서 중앙 element가 click handler를 갖지 않음을 확인한다.
  - production PNG evidence: `tmp/shared-pixel-alignment/bottom-navigation-production.png` if captured.
- [ ] TODO-P1.3: `App.tsx`에서 `onCentralAction={() => setView(routeToWriteWorry())}` 경로를 제거한다.
  - 대상 파일: `src/App.tsx`
  - 완료 기준: 고민 작성 진입점은 `MyWorriesScreen` 우측 하단 메시지 버튼뿐이다.
  - 검증: `rg -n "onCentralAction|routeToWriteWorry\\(\\)" src/App.tsx src/screens`
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png` in Phase 4.
- [ ] TODO-P1.4: 고민 제출 성공과 답변 제출 성공 route를 success confirmation route로 바꾼다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/screens/writeForm/containerPolicy.ts`, 관련 tests
  - 완료 기준: 고민 성공은 09 success screen route, 답변 성공은 19 success screen route로 이동하고 기존 `my_worry_detail`/`my_answer_detail` 자동 이동이 사라진다.
  - 검증: `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: Phase 5 `09-question-write-b-production.png`, Phase 6 `19-answer-write-3-production.png`.
- [ ] TODO-P1.5: PRD 기준으로 MVP 제외 route/item을 제거한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/routeRenderingBoundary.ts`, `src/App.tsx`, appShell tests
  - 완료 기준: `operation_policy`, `app_install_guide`, `notification_settings`가 route 목록, subroute 목록, rendering boundary, settings dispatch에서 제거되거나 접근 불가 MVP 제외 상태로 고정된다.
  - 검증: `rg -n "operation_policy|app_install_guide|notification_settings" src/services/appShell src/App.tsx src/screens/myPage`
  - production PNG evidence: Phase 8A `10-my-page-production.png`.
- [ ] TODO-P1.6: 06~20 PNG에 없는 `App.tsx` 전역 fixed header를 제거하거나 screen-local header로 이전한다.
  - 대상 파일: `src/App.tsx`, 06~20 각 screen `*Screen.tsx`
  - 완료 기준: App shell은 route selection과 bottom navigation만 조립하고, 화면별 상단 좌측 눈/우측 마이페이지 버튼은 screen contract 또는 shared primitive로 소유권이 분리된다.
  - 검증: `src/services/appShell/appMonolithGuardrail.test.ts`, `src/services/appShell/appShellBoundary.test.ts`
  - production PNG evidence: 각 화면 phase의 production PNG.
- [ ] TODO-P1.7: appShell contract/route tests를 PRD route flow로 갱신한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.test.ts`, `src/services/appShell/routeRenderingBoundary.test.ts`, `src/services/appShell/appShellBoundary.test.ts`
  - 완료 기준: 중앙 눈 클릭 불가, 작성 진입점 단일화, 07→09→20, 17→19→06, 20→08, 10→12/13/14/15/16이 테스트로 검증된다.
  - 검증: `npm test -- src/services/appShell` 또는 전체 `npm test`
  - production PNG evidence: 없음.
- [ ] TODO-P1.8: 이 phase에서 캡처가 필요하면 production PNG만 남긴다.
  - 대상 파일: `tmp/*-pixel-alignment/*-production.png`
  - 완료 기준: `tmp` 안에 PNG 외 phase 문서 파일이 없다.
  - 검증: `find tmp -path '*pixel-alignment*' -type f | sort`
  - production PNG evidence: 해당되는 `tmp/*-pixel-alignment/*-production.png`.

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

- [ ] TODO-P2.1: 393x852 reference canvas 기준 production preview/capture 방식을 구현한다.
  - 대상 파일: `src/index.css`, `src/screens/shared/ui.tsx`, capture-only route/test helper
  - 완료 기준: production route를 393x852 viewport로 캡처할 때 reference PNG와 같은 비교 기준을 얻는다.
  - 검증: 06 또는 20 한 화면을 393x852 production PNG로 캡처해 크기를 확인한다.
  - production PNG evidence: `tmp/shared-pixel-alignment/canvas-frame-production.png` if captured.
- [ ] TODO-P2.2: status bar/time/network/battery와 최하단 home indicator를 production UI에서 구현하지 않도록 검증한다.
  - 대상 파일: `src/index.css`, `src/screens/shared/ui.tsx`, screen files
  - 완료 기준: capture PNG가 393x852이더라도 OS chrome fake element는 production DOM에 없다.
  - 검증: screen DOM test 또는 수동 DOM inspection note.
  - production PNG evidence: 각 phase production PNG.
- [ ] TODO-P2.3: `CategoryChip` 고정 폭 정책을 관심 분야 최장 텍스트 기준으로 구현한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, `src/screens/shared/uiContract.ts`, `packages/domain/src/index.ts`
  - 완료 기준: 카테고리 글자 수로 칩 폭이 달라지지 않고 3열 칩 화면에서도 안정적으로 맞는다.
  - 검증: shared rendering test와 12 화면 capture.
  - production PNG evidence: Phase 8B `12-edit-interests-production.png`.
- [ ] TODO-P2.4: 로컬 타임존 기준 display date formatter를 shared pure function으로 분리한다.
  - 대상 파일: `src/screens/shared/contract.ts` 또는 new shared mapping utility, mapping tests
  - 완료 기준: 1분 미만 `방금 전`, 1시간 미만 `n분 전`, 날짜가 바뀌기 전 `n시간 전`, 날짜가 바뀌면 `YYYY-MM-DD`가 테스트된다.
  - 검증: `src/screens/receivedWorries/mapping.test.ts`, `src/screens/writeForm/mapping.test.ts`, `src/screens/myPage/mapping.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P2.5: spinner loading primitive와 PNG에 없는 empty/loading state 책임 범위를 분리한다.
  - 대상 파일: `src/screens/shared/ui.tsx`, screen `*Screen.tsx`
  - 완료 기준: PRD empty 문구는 screen별 contract에서 관리하고 loading은 shared spinner primitive로 통일된다.
  - 검증: shared UI tests와 screen state tests.
  - production PNG evidence: Phase 10 `tmp/empty-loading-pixel-alignment/*-production.png` if captured.
- [ ] TODO-P2.6: shared primitive 변경이 presentational-only임을 테스트로 증명한다.
  - 대상 파일: `src/screens/shared/uiContract.test.ts`, `src/screens/importBoundaries.test.ts`
  - 완료 기준: shared UI가 `src/services/**`를 import하지 않는다.
  - 검증: `npm test`
  - production PNG evidence: 없음.
- [ ] TODO-P2.7: shared primitive evidence는 PNG만 생성한다.
  - 대상 파일: `tmp/shared-pixel-alignment/*-production.png`
  - 완료 기준: shared evidence 디렉터리에 PNG 외 파일이 없다.
  - 검증: `find tmp/shared-pixel-alignment -type f | sort`
  - production PNG evidence: `tmp/shared-pixel-alignment/*-production.png`.

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

- [ ] TODO-P3.1: `TODO-P0.4`로 확정된 06 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/06-received-worries.png`, `docs/TODO.md`
  - 완료 기준: 상단 좌측 눈, 우측 마이페이지 버튼, 고민 카드, 건너뛰기 버튼, 하단바 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P3.2: `ReceivedWorriesScreen`을 06 구조로 재구성한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: 상단 좌측 눈은 기능 없음, 우측 마이페이지 버튼은 이동 action, 고민 카드와 하단 고정바가 06 PNG 구조를 따른다.
  - 검증: screen rendering test 또는 manual DOM check.
  - production PNG evidence: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`.
- [ ] TODO-P3.3: `ReceivedWorriesContainer`는 기존 data/action 경계를 유지하고 screen props만 확장한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: `useHomeWorryFeed`, `passDeliveryViaApi`, `markDeliveryReadWithServer` import 경계가 유지된다.
  - 검증: `src/screens/receivedWorries/importBoundary.test.ts`, `src/screens/receivedWorries/containerPolicy.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P3.4: 고민 박스 클릭 시 17 route state가 `deliveryId`/`worryId`를 보존하고 read 처리한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: `routeToWriteReply({ deliveryId, worryId })`가 안정적으로 호출되고 selected worry fallback 없이 새로고침/route state 테스트가 가능하다.
  - 검증: container policy 또는 route test.
  - production PNG evidence: 없음.
- [ ] TODO-P3.5: 건너뛰기 버튼은 확인 모달 없이 즉시 목록 제거와 pass domain action을 수행한다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesContainer.tsx`, `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`
  - 완료 기준: pass success 후 suppressed set과 refresh가 적용되고 modal/dialog가 뜨지 않는다.
  - 검증: `src/screens/receivedWorries/containerPolicy.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P3.6: category mapping을 PRD fallback 정책으로 수정한다.
  - 대상 파일: `src/screens/receivedWorries/mapping.ts`, `src/screens/receivedWorries/mapping.test.ts`
  - 완료 기준: `validCategories[0]` 우선, 없고 fallback이 `잡담`이면 `잡담`, 무효 카테고리는 사용자-facing 미표시.
  - 검증: mapping tests.
  - production PNG evidence: 없음.
- [ ] TODO-P3.7: createdAt 표시 규칙을 06 카드에서 검증한다.
  - 대상 파일: `src/screens/receivedWorries/mapping.ts`, shared date formatter
  - 완료 기준: `방금 전`, `n분 전`, `n시간 전`, `YYYY-MM-DD` 케이스가 로컬 타임존 기준으로 통과한다.
  - 검증: `src/screens/receivedWorries/mapping.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P3.8: empty/loading 상태를 PRD 문구와 spinner로 맞춘다.
  - 대상 파일: `src/screens/receivedWorries/ReceivedWorriesScreen.tsx`, `src/screens/receivedWorries/contract.ts`
  - 완료 기준: empty title/message는 `지금은 도착한 고민이 없어요.`, loading은 skeleton이 아닌 spinner.
  - 검증: screen state test.
  - production PNG evidence: Phase 10 if captured.
- [ ] TODO-P3.9: 06 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`
  - 완료 기준: 393x852 production capture이며 reference PNG 복사본이 아니다.
  - 검증: PNG 크기 확인과 reference anchor 비교 completion note.
  - production PNG evidence: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`

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

- [ ] TODO-P4.1: `TODO-P0.4`로 확정된 20 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/20-my-worries.png`, `docs/TODO.md`
  - 완료 기준: 상단 눈, 마이페이지 버튼, 목록 카드, 우측 하단 메시지 버튼, 하단바 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P4.2: `MyWorriesScreen`을 20 목록 화면으로 재구성하고 selected worry 아래 reply list 펼침 UI를 제거한다.
  - 대상 파일: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 목록 화면에서 reply list가 inline으로 펼쳐지지 않고 고민 박스 클릭은 08 route로 이동한다.
  - 검증: screen test에서 selected reply panel DOM 부재 확인.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`.
- [ ] TODO-P4.3: 20 화면 좌상단/우상단/우측 하단 action을 PRD대로 구현한다.
  - 대상 파일: `src/screens/myPage/MyWorriesScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 좌상단 눈은 기능 없음, 우상단은 마이페이지 이동, 우측 하단 메시지 버튼만 `write_worry` 진입점이다.
  - 검증: click/role test.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`.
- [ ] TODO-P4.4: `MyWorriesContainer`가 20 목록 클릭 시 `answer_check` route로 이동하게 바꾼다.
  - 대상 파일: `src/screens/myPage/MyWorriesContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: `selectedMyWorry`를 설정한 뒤 `routeToAnswerCheck({ worryId })` 또는 동등한 route state로 이동하고, read 처리는 08 진입에서 수행된다.
  - 검증: container policy/route test.
  - production PNG evidence: 없음.
- [ ] TODO-P4.5: `MyWorryListItemProps`를 20 표시 정보로 갱신한다.
  - 대상 파일: `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`
  - 완료 기준: createdAt display date, LLM summary text, first valid category, visible reply count label을 포함한다.
  - 검증: `src/screens/myPage/contract.test.ts`, `src/screens/myPage/mapping.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P4.6: reply count read model/mapping 정책을 검증한다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/services/myWorries/prdPolicy.test.ts` if service policy already owns count
  - 완료 기준: AI 포함, 싫어요 숨김/운영자 숨김 제외, 0개면 `아직 답변이 없어요.` 표시.
  - 검증: mapping/service policy tests.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`.
- [ ] TODO-P4.7: 나의 고민 empty 문구를 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyWorriesContainer.tsx`, `src/screens/myPage/MyWorriesScreen.tsx`
  - 완료 기준: empty 문구가 `첫 고민을 남겨보세요.`이고 CTA는 우측 하단 메시지 버튼 정책과 충돌하지 않는다.
  - 검증: screen state test.
  - production PNG evidence: Phase 10 if captured.
- [ ] TODO-P4.8: 20 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`
  - 완료 기준: 393x852 production capture이며 PNG 외 부가 산출물이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`

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

- [ ] TODO-P5.1: `TODO-P0.4`로 확정된 07/09 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/07-question-write-a.png`, `09-question-write-b.png`, `docs/TODO.md`
  - 완료 기준: textarea, pencil placeholder, CTA, success dialog/card, 확인 버튼 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P5.2: `WriteWorryContainer`는 API/draft/validation/moderation 경계를 유지하고 성공 route만 09로 바꾼다.
  - 대상 파일: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: `publishWorryViaApi`, draft storage, validation import 경계는 유지되고 success route는 09 confirmation이다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`, import boundary test.
  - production PNG evidence: `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`.
- [ ] TODO-P5.3: 07 write-worry variant를 `WriteWorryScreen` 전용 presentational component로 분리한다.
  - 대상 파일: `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/WriteWorryScreen.tsx`, `src/screens/writeForm/contract.ts`
  - 완료 기준: 답변 작성 17과 고민 작성 07의 JSX/pixel work가 별도 screen component로 분리되고, container/draft 계약은 writeForm deep module 안에 유지된다.
  - 검증: import boundary tests.
  - production PNG evidence: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`.
- [ ] TODO-P5.4: 07 textarea placeholder를 pencil graphic + `당신의 솔직한 이야기를 들려주세요`로 구현한다.
  - 대상 파일: write worry screen file, `src/screens/writeForm/contract.ts`
  - 완료 기준: 입력 전에는 pencil과 문구가 보이고, 입력 시작 시 둘 다 숨는다.
  - 검증: screen interaction test.
  - production PNG evidence: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`.
- [ ] TODO-P5.5: 필터링 실패 시 07에 남고 draft를 유지한다.
  - 대상 파일: `src/screens/writeForm/WriteWorryContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: moderation rejected/failed는 09로 이동하지 않고 draft storage를 clear하지 않는다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P5.6: 성공 시 toast를 폐기하고 09 success screen을 표시한다.
  - 대상 파일: `src/screens/writeForm/*`, `src/App.tsx`
  - 완료 기준: 09에서는 확인 버튼 외 상호작용이 없고 `filterAlert` success toast를 쓰지 않는다.
  - 검증: route/rendering test.
  - production PNG evidence: `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`.
- [ ] TODO-P5.7: 09 확인 버튼은 20-my-worries로 이동한다.
  - 대상 파일: success screen/container contract, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: 확인 클릭 후 `my_worries` 또는 `나의 고민` route로 이동하고 작성 직후 답변 0개면 `아직 답변이 없어요.` 상태다.
  - 검증: route flow test 07→09→20.
  - production PNG evidence: `tmp/my-worries-pixel-alignment/20-my-worries-production.png`.
- [ ] TODO-P5.8: 07/09 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/write-worry-pixel-alignment/07-question-write-a-production.png`, `tmp/write-worry-pixel-alignment/09-question-write-b-production.png`
  - 완료 기준: 두 PNG가 393x852 production capture이고 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.

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

- [ ] TODO-P6.1: `TODO-P0.4`로 확정된 17/18/19 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/17-answer-write-1.png`, `18-answer-write-2.png`, `19-answer-write-3.png`
  - 완료 기준: worry summary card, overlay panel, textarea, success screen, 확인 버튼 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P6.2: `WriteReplyContainer`는 API/draft/validation/moderation 경계를 유지하고 성공 route만 19로 바꾼다.
  - 대상 파일: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/screens/writeForm/containerPolicy.ts`
  - 완료 기준: success route가 19 confirmation이며 draft clear는 성공 시에만 수행된다.
  - 검증: `src/screens/writeForm/containerPolicy.test.ts`
  - production PNG evidence: `tmp/write-reply-pixel-alignment/19-answer-write-3-production.png`.
- [ ] TODO-P6.3: 17 화면 props에 LLM summary, first valid category, createdAt display date, 답변 입력 영역을 명시한다.
  - 대상 파일: `src/screens/writeForm/contract.ts`, `src/screens/writeForm/mapping.ts`, `src/screens/writeForm/WriteFormScreen.tsx`
  - 완료 기준: 원문 대신 summary가 기본 카드에 표시되고 원문은 18 overlay에서만 보인다.
  - 검증: mapping/screen tests.
  - production PNG evidence: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`.
- [ ] TODO-P6.4: summary 생성 실패 fallback을 mapping/service boundary에 명시한다.
  - 대상 파일: `src/screens/writeForm/mapping.ts`, service policy test if summary is read model owned
  - 완료 기준: 원문 앞 20자 + `...` fallback이 사용자-facing summary로 표시된다.
  - 검증: mapping test.
  - production PNG evidence: 없음.
- [ ] TODO-P6.5: 18은 별도 full route가 아니라 17 위 overlay로 구현한다.
  - 대상 파일: `src/screens/writeForm/WriteFormScreen.tsx`, `src/screens/writeForm/contract.ts`
  - 완료 기준: overlay 열기/닫기 후 reply draft가 유지되고 URL route는 17 write_reply 상태다.
  - 검증: state interaction test.
  - production PNG evidence: `tmp/write-reply-pixel-alignment/18-answer-write-2-production.png`.
- [ ] TODO-P6.6: 17 뒤로 가기는 06으로 이동하고 draft를 폐기한다.
  - 대상 파일: `src/screens/writeForm/WriteReplyContainer.tsx`, `src/services/appShell/prdNavigationPolicy.ts`
  - 완료 기준: back click이 `received_worries`로 이동하고 해당 delivery draft key를 clear한다.
  - 검증: container interaction test.
  - production PNG evidence: 없음.
- [ ] TODO-P6.7: 17 답변 입력 placeholder를 pencil icon + `고민자에게 따뜻한 말을 전달해주세요!`로 구현한다.
  - 대상 파일: write reply screen file, `src/screens/writeForm/contract.ts`
  - 완료 기준: icon과 문구가 겹치지 않고 입력 시작 시 둘 다 숨는다.
  - 검증: screen interaction test.
  - production PNG evidence: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`.
- [ ] TODO-P6.8: 19 확인 버튼은 06으로 이동하고 방금 답변한 고민은 목록에서 사라진다.
  - 대상 파일: success route/screen, `src/screens/receivedWorries/ReceivedWorriesContainer.tsx` if suppression state needed
  - 완료 기준: 17→19→06 route flow와 feed suppression/refresh가 테스트된다.
  - 검증: route flow/container policy test.
  - production PNG evidence: `tmp/received-worries-pixel-alignment/06-received-worries-production.png`.
- [ ] TODO-P6.9: 17/18/19 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/write-reply-pixel-alignment/17-answer-write-1-production.png`, `18-answer-write-2-production.png`, `19-answer-write-3-production.png`
  - 완료 기준: 세 PNG가 393x852 production capture이고 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: listed files.

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

- [ ] TODO-P7.1: `TODO-P0.4`로 확정된 08 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/08-answer-check.png`, `docs/TODO.md`
  - 완료 기준: 내 고민 박스, 답변 박스들, 좋아요/싫어요 버튼, 하단바 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P7.2: 08을 `src/screens/answerCheck/**` 전용 deep module로 분리하고 `replyDetail` 단일 답변 상세 의존을 제거한다.
  - 대상 파일: `src/screens/answerCheck/AnswerCheckContainer.tsx`, `src/screens/answerCheck/AnswerCheckScreen.tsx`, `src/screens/answerCheck/contract.ts`, `src/screens/answerCheck/mapping.ts`, `src/screens/importBoundaries.test.ts`
  - 완료 기준: 08은 단일 답변 상세가 아니라 여러 답변 read model을 받는 screen contract를 갖고, `replyDetail`은 새 PRD route flow에서 호출되지 않는다.
  - 검증: import boundary test와 route rendering test.
  - production PNG evidence: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`.
- [ ] TODO-P7.3: `answer_check` route state contract를 `worryId` 필수로 고정한다.
  - 대상 파일: `src/services/appShell/prdNavigationPolicy.ts`, `src/services/appShell/prdNavigationPolicy.test.ts`, `src/screens/answerCheck/AnswerCheckContainer.tsx`
  - 완료 기준: `AppRouteState`에 `{ route: 'answer_check'; worryId: string }` 또는 동등한 필수 `worryId` route state가 있고, `AnswerCheckContainer`는 `selectedMyWorry` React state만으로 동작하지 않는다. 직접 복원을 지원하지 않는 경우 `worryId`로 read model 복원 실패 시 fallback route는 `my_worries`로 명시한다.
  - 검증: route test에서 `answer_check` without `worryId`가 생성되지 않거나 `my_worries` fallback으로 정리됨을 확인한다.
  - production PNG evidence: 없음.
- [ ] TODO-P7.4: 08 뒤로 가기는 20-my-worries로 이동한다.
  - 대상 파일: appShell route helper, answer check container
  - 완료 기준: back route가 `my_worries`이고 06/13/기존 detail로 이동하지 않는다.
  - 검증: route test.
  - production PNG evidence: 없음.
- [ ] TODO-P7.5: 답변 0개 상태는 내 고민만 보이고 별도 empty 문구를 표시하지 않는다.
  - 대상 파일: answer check screen/contract
  - 완료 기준: replies array가 비어도 empty component가 렌더링되지 않는다.
  - 검증: screen state test.
  - production PNG evidence: Phase 10에서 캡처할 경우 `tmp/empty-loading-pixel-alignment/08-answer-check-empty-production.png`.
- [ ] TODO-P7.6: 좋아요 클릭은 즉시 확정되고 helpedCount 증가와 코멘트 선택 입력을 분리한다.
  - 대상 파일: answer check container, `src/services/replyFeedback/**` tests if existing API supports it
  - 완료 기준: like mutation 성공 후 답변 박스는 유지되고 comment dialog는 submit/skip 가능하다.
  - 검증: container/service policy tests.
  - production PNG evidence: 없음.
- [ ] TODO-P7.7: 싫어요 클릭은 즉시 확정하되 답변 숨김은 코멘트 창 종료 후 수행한다.
  - 대상 파일: answer check container/screen
  - 완료 기준: dislike selected state와 comment dialog lifecycle이 테스트되고, dialog 종료 후 해당 answer card가 숨겨진다.
  - 검증: state interaction test.
  - production PNG evidence: 없음.
- [ ] TODO-P7.8: 좋아요/싫어요 코멘트는 답변 하나당 1개만 허용하고 AI 필터링을 거친다.
  - 대상 파일: answer check container, `src/services/replyFeedback/*`
  - 완료 기준: duplicate comment attempt와 moderation rejected case가 테스트된다.
  - 검증: `src/services/replyFeedback/*.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P7.9: 싫어요/싫어요 코멘트는 답변자에게 절대 노출되지 않는다.
  - 대상 파일: `src/screens/myPage/mapping.ts`, `src/services/myWorries/prdPolicy.test.ts`, answer check tests
  - 완료 기준: my answers read model에서는 dislike가 피드백 없음처럼 보인다.
  - 검증: mapping/service tests.
  - production PNG evidence: Phase 8C `13-my-answers-production.png`.
- [ ] TODO-P7.10: 08 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`
  - 완료 기준: 393x852 production capture이며 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/answer-check-pixel-alignment/08-answer-check-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run test:rules` if feedback/read model rules changed.

완료 보고 형식:
- answer-check module decision, feedback state policy, privacy test 결과, evidence 경로를 보고한다.

## Phase 8A: 10 My-Page

목표: 10-my-page를 MVP 범위와 PNG에 맞춘다.
허용 수정 범위: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`, related tests.
금지 수정 범위: app install/PWA guide 기능 추가, operation policy route 유지, 12/13/14 세부 pixel work.

- [ ] TODO-P8A.1: 10 PNG Measurement Anchor 표를 구현 시작 전 재확인한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/10-my-page.png`
  - 완료 기준: 10 표의 profile summary, setting rows, bottom nav bbox가 PIL 재측정값과 맞는다.
  - 검증: `TODO-P0.4` completion note 확인.
  - production PNG evidence: 없음.
- [ ] TODO-P8A.2: `MyPageScreen`에서 앱처럼 사용하기 QR/공유 영역과 운영정책 항목을 제거한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`
  - 완료 기준: 10 PNG 항목만 남고 `QrCode`, `Share2`, `QRCodeSVG`, `operation_policy`, `app_install_guide` UI가 없다.
  - 검증: `rg -n "QrCode|Share2|QRCodeSVG|operation_policy|app_install_guide" src/screens/myPage`
  - production PNG evidence: `tmp/my-page-pixel-alignment/10-my-page-production.png`.
- [ ] TODO-P8A.3: `MyPageContainer`/contract에서 MVP 제외 props와 route handling을 제거한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/contract.ts`, tests
  - 완료 기준: operation policy/app install props와 dispatch가 사라지고 개인정보처리방침만 policy route로 남는다.
  - 검증: `src/screens/myPage/contract.test.ts`, `src/screens/myPage/importBoundary.test.ts`
  - production PNG evidence: 없음.
- [ ] TODO-P8A.4: 10 마이페이지 표시 항목을 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/mapping.ts`
  - 완료 기준: 닉네임, 받은 좋아요/하트 총합, 관심 분야 수정, 내가 쓴 답변 preview, 전체보기, 알림 토글, 개인정보처리방침, 로그아웃, 회원 탈퇴만 표시한다.
  - 검증: screen rendering test.
  - production PNG evidence: `tmp/my-page-pixel-alignment/10-my-page-production.png`.
- [ ] TODO-P8A.5: 알림 설정을 토글 UI와 브라우저 권한 제약 문구로 표현한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`
  - 완료 기준: 별도 `notification_settings` route 없이 10 화면 안에서 토글 상태를 제어한다.
  - 검증: screen interaction test.
  - production PNG evidence: `tmp/my-page-pixel-alignment/10-my-page-production.png`.
- [ ] TODO-P8A.6: 10 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-page-pixel-alignment/10-my-page-production.png`
  - 완료 기준: 393x852 production capture이고 reference PNG 복사 또는 design/reference preview 캡처가 아니며 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-page-pixel-alignment/10-my-page-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run validate:design-reference`

완료 보고 형식:
- 10 MVP 제외 항목 제거, helpedCount 문구, 알림 토글, evidence 경로를 보고한다.

## Phase 8B: 12 Edit-Interests

목표: 12-edit-interests를 PRD 관심 분야 수정 정책과 PNG에 맞춘다.
허용 수정 범위: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/contract.ts`, related tests.
금지 수정 범위: 온보딩 관심 분야 flow 리팩터링, 10/13/14 pixel work.

- [ ] TODO-P8B.1: 12 PNG Measurement Anchor 표를 구현 시작 전 재확인한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/12-edit-interests.png`
  - 완료 기준: chip grid outer, chip size/gap, CTA bbox가 PIL 재측정값과 맞는다.
  - 검증: `TODO-P0.4` completion note 확인.
  - production PNG evidence: 없음.
- [ ] TODO-P8B.2: 12 관심 분야 수정 화면을 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/MyPageContainer.tsx`
  - 완료 기준: 3열 고정 크기 칩, 0개 저장 시 `1개 이상의 관심 분야를 선택해주세요.`, 저장 성공 후 10 이동, 실패 시 기존 선택 유지.
  - 검증: container/screen interaction tests.
  - production PNG evidence: `tmp/my-page-pixel-alignment/12-edit-interests-production.png`.
- [ ] TODO-P8B.3: 12 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-page-pixel-alignment/12-edit-interests-production.png`
  - 완료 기준: 393x852 production capture이고 reference PNG 복사 또는 design/reference preview 캡처가 아니며 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-page-pixel-alignment/12-edit-interests-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- 12 validation/save flow, fixed chip grid, evidence 경로를 보고한다.

## Phase 8C: 13 My-Answers

목표: 13-my-answers를 PRD feedback visibility와 PNG에 맞춘다.
허용 수정 범위: `src/screens/myPage/MyAnswersScreen.tsx`, `src/screens/myPage/MyAnswersContainer.tsx`, `src/screens/myPage/contract.ts`, `src/screens/myPage/mapping.ts`, appShell legacy detail route removal tests.
금지 수정 범위: answerCheck feedback mutation implementation, 10/12/14 pixel work.

- [ ] TODO-P8C.1: 13 PNG Measurement Anchor 표를 구현 시작 전 재확인한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/13-my-answers.png`
  - 완료 기준: answer cards, title, bottom nav bbox가 PIL 재측정값과 맞는다.
  - 검증: `TODO-P0.4` completion note 확인.
  - production PNG evidence: 없음.
- [ ] TODO-P8C.2: 13 내가 쓴 답변 목록을 PRD feedback visibility로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyAnswersScreen.tsx`, `src/screens/myPage/mapping.ts`, `src/screens/myPage/contract.ts`
  - 완료 기준: 모든 답변 동일 형식, 좋아요는 하트만, 코멘트 있으면 1개 작은 폰트, 싫어요는 피드백 없음처럼 표시.
  - 검증: mapping/screen tests.
  - production PNG evidence: `tmp/my-page-pixel-alignment/13-my-answers-production.png`.
- [ ] TODO-P8C.3: 내가 쓴 답변 상세 route를 PRD대로 제거 또는 비활성화한다.
  - 대상 파일: `src/screens/myPage/MyAnswersContainer.tsx`, appShell routes, replyDetail routes/tests
  - 완료 기준: 새 PRD의 `내가 쓴 답변 상세 화면은 MVP에서 제공하지 않는다`에 맞춰 `my_answer_detail` 이동이 제거된다.
  - 검증: `rg -n "my_answer_detail|routeToMyReplyDetail|read_my_reply" src`
  - production PNG evidence: `tmp/my-page-pixel-alignment/13-my-answers-production.png`.
- [ ] TODO-P8C.4: 13 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-page-pixel-alignment/13-my-answers-production.png`
  - 완료 기준: 393x852 production capture이고 reference PNG 복사 또는 design/reference preview 캡처가 아니며 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-page-pixel-alignment/13-my-answers-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`

완료 보고 형식:
- 13 feedback visibility, 상세 route 제거, evidence 경로를 보고한다.

## Phase 8D: 14 Privacy-Policy

목표: 14-privacy-policy를 개인정보처리방침 단일 정책 문서와 PNG에 맞춘다.
허용 수정 범위: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/contract.ts`, `src/services/policyDocuments/**` privacy-only/empty message policy, related tests.
금지 수정 범위: operation policy route 복원, 이용약관/앱 사용 안내 추가, 10/12/13 pixel work.

- [ ] TODO-P8D.1: 14 PNG Measurement Anchor 표를 구현 시작 전 재확인한다.
  - 대상 파일: `docs/TODO.md`, `design/reference/pngs/screens/14-privacy-policy.png`
  - 완료 기준: policy content area, text/glyph, bottom nav bbox가 PIL 재측정값과 맞는다.
  - 검증: `TODO-P0.4` completion note 확인.
  - production PNG evidence: 없음.
- [ ] TODO-P8D.2: 14 개인정보처리방침 source와 empty 문구를 PRD대로 맞춘다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/screens/myPage/MyPageScreen.tsx`, `src/services/policyDocuments/*`
  - 완료 기준: `docs/privacy_policy.md`만 source of truth이고 빈 경우 `정책을 준비 중입니다.`를 표시한다.
  - 검증: `src/services/policyDocuments/policyLoader.test.ts`, screen test.
  - production PNG evidence: `tmp/my-page-pixel-alignment/14-privacy-policy-production.png`.
- [ ] TODO-P8D.3: 14 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/my-page-pixel-alignment/14-privacy-policy-production.png`
  - 완료 기준: 393x852 production capture이고 reference PNG 복사 또는 design/reference preview 캡처가 아니며 PNG 외 파일이 없다.
  - 검증: PNG 크기와 anchor mismatch completion note.
  - production PNG evidence: `tmp/my-page-pixel-alignment/14-privacy-policy-production.png`.

검증 명령:
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run validate:design-reference`

완료 보고 형식:
- 14 privacy-only policy, empty 문구, evidence 경로를 보고한다.

## Phase 9: 15/16 Logout/Account Deletion Overlays

목표: 로그아웃/탈퇴 확인을 10 마이페이지 위 overlay/dialog로 맞춘다.
허용 수정 범위: `src/screens/myPage/**`, `src/services/userAccount/**` tests only if deletion policy requires.
금지 수정 범위: DB 완전 삭제 정책 추가, 별도 full page route로 전환.

- [ ] TODO-P9.1: `TODO-P0.4`로 확정된 15/16 Measurement Anchor 표를 구현 시작 전에 확인한다.
  - 대상 파일: `design/reference/pngs/screens/15-logout.png`, `16-account-deletion.png`
  - 완료 기준: dimmed background, dialog card, 취소/확인 버튼 bbox가 `TODO-P0.4` completion note와 일치한다.
  - 검증: `TODO-P0.4` completion note 확인. 불일치하면 이 phase를 시작하지 않고 P0.4를 먼저 갱신한다.
  - production PNG evidence: 없음.
- [ ] TODO-P9.2: 로그아웃/탈퇴 확인을 마이페이지 위 overlay/dialog로 구현한다.
  - 대상 파일: `src/screens/myPage/MyPageScreen.tsx`, `src/screens/shared/ui.tsx`
  - 완료 기준: 배경의 마이페이지와 하단바가 흐릿하게 보이고 클릭 불가능하다.
  - 검증: screen interaction/accessibility test.
  - production PNG evidence: `tmp/account-overlays-pixel-alignment/15-logout-production.png`, `16-account-deletion-production.png`.
- [ ] TODO-P9.3: 15 취소/로그아웃 flow를 검증한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/services/userAccount/accountSession.test.ts`
  - 완료 기준: 취소는 10 복귀, 로그아웃은 signOut/cleanup 후 02-login 이동.
  - 검증: container/service tests.
  - production PNG evidence: `tmp/account-overlays-pixel-alignment/15-logout-production.png`.
- [ ] TODO-P9.4: 16 취소/탈퇴 flow를 검증한다.
  - 대상 파일: `src/screens/myPage/MyPageContainer.tsx`, `src/services/userAccount/deleteMyAccount.test.ts`
  - 완료 기준: 취소는 10 복귀, 탈퇴는 account deletion API와 cleanup 후 02-login 이동.
  - 검증: container/service tests.
  - production PNG evidence: `tmp/account-overlays-pixel-alignment/16-account-deletion-production.png`.
- [ ] TODO-P9.5: 탈퇴 정책을 접근권 삭제/비활성화 의미로 테스트에 고정한다.
  - 대상 파일: `src/services/userAccount/*`, `src/server/userAccountRoutes.test.ts`, `src/firestore.rules.test.ts`
  - 완료 기준: 추가 확인 입력 없이 동작하고 DB 문서 완전 삭제가 아닌 deleted/inactive 접근 제한 정책을 검증한다.
  - 검증: `npm test`, `npm run test:rules`
  - production PNG evidence: 없음.
- [ ] TODO-P9.6: 15/16 production PNG evidence를 생성한다.
  - 대상 파일: `tmp/account-overlays-pixel-alignment/15-logout-production.png`, `tmp/account-overlays-pixel-alignment/16-account-deletion-production.png`
  - 완료 기준: 두 PNG가 393x852 production capture이고 PNG 외 파일이 없다.
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
  - production PNG evidence: 캡처 시 `tmp/empty-loading-pixel-alignment/*-production.png`.
- [ ] TODO-P10.2: empty 문구를 screen state test로 검증한다.
  - 대상 파일: `src/screens/receivedWorries/*`, `src/screens/myPage/MyWorries*`
  - 완료 기준: 답변하기 empty는 `지금은 도착한 고민이 없어요.`, 나의 고민 empty는 `첫 고민을 남겨보세요.`.
  - 검증: screen state tests.
  - production PNG evidence: 캡처 시 `tmp/empty-loading-pixel-alignment/*-production.png`.
- [ ] TODO-P10.3: loading은 skeleton이 아니라 spinner로 통일한다.
  - 대상 파일: shared/screen files
  - 완료 기준: loading states use spinner primitive.
  - 검증: screen tests 또는 DOM inspection.
  - production PNG evidence: 캡처 시 `tmp/empty-loading-pixel-alignment/*-production.png`.
- [ ] TODO-P10.4: 네트워크 오류 상태를 PRD 제품 정책으로 확장하지 않는다.
  - 대상 파일: screen state files
  - 완료 기준: 오류 상태는 기존 구현 세부로 유지하고 새 PRD UI 요구로 과도하게 확장하지 않는다.
  - 검증: code review note.
  - production PNG evidence: 없음.
- [ ] TODO-P10.5: empty/loading evidence가 필요하면 PNG만 생성한다.
  - 대상 파일: `tmp/empty-loading-pixel-alignment/*-production.png`
  - 완료 기준: PNG 외 부가 산출물이 없다.
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
금지 수정 범위: 새 기능 추가, PRD 수정, PNG 외 부가 audit 문서 산출물.

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
- [ ] TODO-P12.5: final audit 산출물이 필요하면 PNG만 생성한다.
  - 대상 파일: `tmp/final-prd-design-audit/*-production.png`
  - 완료 기준: final audit 디렉터리에 production PNG 외 파일이 없다.
  - 검증: `find tmp/final-prd-design-audit -type f | sort`
  - production PNG evidence: `tmp/final-prd-design-audit/*-production.png`.
- [ ] TODO-P12.6: 최종 검증 명령을 모두 통과해야 체크한다.
  - 대상 파일: whole repo
  - 완료 기준: `npm test`, `npm run lint`, `npm run build`, `npm run test:rules`, `npm run validate:design-reference`가 모두 통과한다.
  - 검증: listed commands.
  - production PNG evidence: 없음.
- [ ] TODO-P12.7: 최종 보고서에는 완료/미완료 TODO ID와 잔여 mismatch를 포함한다.
  - 대상 파일: final chat/report only
  - 완료 기준: 체크 완료/미완료 TODO ID, 미완료 사유, PRD 불일치 잔여 항목, pixel mismatch 잔여 항목, 수동 확인 필요 화면이 보고된다.
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
