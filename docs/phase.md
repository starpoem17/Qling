아래처럼 **17개 TODO slice를 그대로 17번에 나누기보다, 구현 단위가 안정적으로 검증되는 9단계**로 묶어 진행하는 게 좋습니다. 핵심은 **데이터/서버 불변식 → read model → 사용자 action → job → UI → 제거/문서화** 순서입니다.

현재 TODO는 server-owned mutation, PRD collection, `activeDeliveryCount`, additive rematch, deep module guardrail, deletion test를 명시하고 있으므로 이 순서를 기준으로 삼으면 됩니다. 

---

## 전체 권장 순서

```text
Stage 0. TODO 고정 및 구현 전 점검
Stage 1. Slice 1: Server-owned worry publication
Stage 2. Slice 2: Firestore rules first hardening
Stage 3. Slice 3~4: Reply + My worries/mailbox migration
Stage 4. Slice 5~7: Read / Pass / Feedback
Stage 5. Slice 8~9: Rematch + AI fallback jobs
Stage 6. Slice 10: Example worries
Stage 7. Slice 11~13: UI navigation / validation-copy / notifications
Stage 8. Slice 14~15: Account deletion / admin hiding & logs
Stage 9. Slice 16~17: Legacy removal / documentation & ops
```

---

# Stage 0. 구현 전 점검

## 목표

TODO 문서 기준으로 **첫 구현 범위를 Slice 1로 제한**하고, 에이전트가 전체 PRD를 한 번에 구현하려는 것을 막습니다.

## 에이전트에게 요구할 것

```text
Read docs/TODO.md and inspect the current codebase. Do not implement yet.

Produce an implementation plan for Slice 1 only:
- server-owned /api/worries/publish
- Firebase auth boundary
- moderation/category preservation
- Round 0 deliveryBatches/{batchId}
- exactly 5 Round 0 deliveries
- 4 matched + 1 random
- transactionally maintained activeDeliveryCount
- best-effort push + pushLogs
- answer feed reads new deliveries with legacy letters fallback
- tests for Slice 1 observable behavior

Do not implement reply migration, pass, rematch, AI fallback, example worries, or UI tab restructuring.
Preserve deep module guardrails.
```

## 통과 기준

에이전트의 계획이 다음을 지키면 진행합니다.

```text
- App.tsx에 정책을 넣지 않음
- browser Firestore write를 source-of-truth로 유지하지 않음
- activeDeliveryCount를 Slice 1부터 transaction으로 처리
- Round 0 deliveryBatches 생성 포함
- tests 먼저 또는 같은 PR에서 추가
```

---

# Stage 1. Server-owned worry publication

## 대응 TODO

```text
Slice 1: Server-owned worry publication
```

## 구현 범위

가장 중요한 첫 vertical slice입니다.

구현해야 할 것:

```text
1. Firebase auth middleware
2. POST /api/worries/publish
3. moderation/category normalization
4. moderationLogs 생성
5. worries/{worryId} 생성
6. deliveryBatches/{batchId} Round 0 생성
7. deliveries/{deliveryId} 5개 생성
8. 4 matched + 1 random recipient selection
9. users/{uid}.activeDeliveryCount transaction increment
10. push best-effort + pushLogs
11. client publish wrapper
12. answer feed가 new deliveries를 읽고 legacy letters fallback 유지
13. Slice 1 tests
```

## 절대 하지 말아야 할 것

```text
- reply migration
- pass
- rematch
- AI fallback
- example worries
- bottom tab UI restructure
- legacy letters 완전 삭제
```

## 검토 포인트

이 단계에서 가장 중요한 것은 “publish worry”가 더 이상 client-side Firestore write로 `letters`를 만들지 않는 것입니다. 단, legacy read fallback은 남겨도 됩니다.

## 통과 기준

```text
- publish 성공 시 worry 1개, Round 0 deliveryBatch 1개, delivery 5개 생성
- delivery 5개는 4 matched + 1 random
- selected recipient는 transaction 안에서 activeDeliveryCount < 10 재검증
- recipient activeDeliveryCount가 정확히 +1
- push 실패해도 core state rollback 없음
- rejected moderation이면 worry/delivery/batch 미생성
- App.tsx는 wrapper 호출만 하고 정책을 갖지 않음
```

---

# Stage 2. Firestore rules first hardening

## 대응 TODO

```text
Slice 2: Firestore rules first hardening
```

## 구현 범위

Stage 1에서 새 source-of-truth가 생겼으므로, 이제 클라이언트가 직접 PRD collection을 쓰지 못하도록 막습니다.

구현해야 할 것:

```text
1. worries client write deny
2. deliveries client write deny
3. deliveryBatches client write deny
4. moderationLogs / pushLogs client read-write deny
5. users/{uid}.activeDeliveryCount client write deny
6. letters delete deny
7. letters type == worry client create deny
8. users read/write narrow
9. Firestore rules tests
```

## 통과 기준

```text
- 클라이언트가 worries/deliveries/deliveryBatches 직접 생성 불가
- 클라이언트가 activeDeliveryCount 조작 불가
- 기존 앱의 최소 read path는 깨지지 않음
- rules tests로 권한 경계가 고정됨
```

이 단계는 Stage 1 직후가 적절합니다. 나중으로 미루면 새 모델을 만들고도 기존 보안 구멍이 계속 남습니다.

---

# Stage 3. Reply + My worries/mailbox migration

## 대응 TODO

```text
Slice 3: Reply migration
Slice 4: My worries and reply mailbox migration
```

## 구현 범위

이제 사용자가 받은 delivery에 답변할 수 있게 하고, 작성자가 그 답변을 볼 수 있게 합니다.

구현해야 할 것:

```text
1. POST /api/deliveries/:deliveryId/replies
2. reply moderation
3. replies/{deliveryId} deterministic create
4. delivery active -> answered
5. activeDeliveryCount decrement exactly once
6. worry humanReplyCount / hasHumanReply update
7. best-effort new reply notification
8. 기존 letters reply creation 제거 또는 비활성화
9. my worries read model
10. replies received read model
11. replies written by me read model
12. legacy letters reply fallback은 임시 유지
13. tests
```

## 왜 Slice 3과 4를 묶는가

Reply creation만 만들고 mailbox/my worries를 바꾸지 않으면, 답변은 저장되지만 사용자가 확인하기 어렵습니다. 반대로 read model만 먼저 바꿔도 새 replies가 없습니다. 따라서 둘은 하나의 feature migration으로 묶는 편이 낫습니다.

## 통과 기준

```text
- delivery 하나당 reply 하나만 생성 가능
- reply 생성과 delivery answered 전환이 transaction으로 묶임
- activeDeliveryCount가 정확히 -1
- 중복 submit/retry가 double decrement하지 않음
- 작성자는 내 고민에서 새 reply를 볼 수 있음
- 답변자는 내가 쓴 답변 목록에서 볼 수 있음
- letters reply write path가 더 이상 핵심 경로가 아님
```

---

# Stage 4. Read / Pass / Feedback

## 대응 TODO

```text
Slice 5: Read state
Slice 6: Pass
Slice 7: Feedback migration
```

## 구현 범위

이 단계는 delivery/reply lifecycle을 완성합니다.

### 4-1. Read state

```text
1. POST /api/deliveries/:deliveryId/read
2. POST /api/worries/:worryId/replies/read
3. delivery.readAt
4. reply.readByAuthorAt
5. answer tab unread emphasis
6. my worries unread reply emphasis
```

### 4-2. Pass

```text
1. POST /api/deliveries/:deliveryId/pass
2. delivery active -> passed
3. activeDeliveryCount decrement exactly once
4. answer feed에서 제거
5. same worry 재수신 방지
```

### 4-3. Feedback

```text
1. POST /api/replies/:replyId/feedback
2. feedbacks/{replyId} deterministic create
3. like/dislike immutable
4. helpedCount transaction
5. AI like excluded from helpedCount
6. dislike hides reply from publisher view
7. like comment visible to replier
8. dislike comment admin-only
9. no comment push
10. like push only
```

## 왜 이 셋을 같은 단계로 묶는가

Read, pass, feedback은 모두 “답변 이후 사용자 interaction”입니다. 특히 feedback은 `helpedCount`와 matching 품질에 영향을 주므로 rematch/AI fallback보다 먼저 갖추는 게 맞습니다.

## 통과 기준

```text
- read state는 상대에게 노출되지 않음
- pass는 activeDeliveryCount를 정확히 -1
- pass한 사용자는 같은 worry를 다시 받지 않음
- feedback은 한 번만 가능
- like만 helpedCount 증가
- dislike는 publisher view에서 숨김
- comment notification 제거
- reply liked notification만 남음
```

---

# Stage 5. Rematch + AI fallback jobs

## 대응 TODO

```text
Slice 8: Rematch job
Slice 9: AI fallback
```

## 구현 범위

이 단계는 서버 job 중심입니다. UI보다 job idempotency와 transaction correctness가 핵심입니다.

### 5-1. Rematch job

구현해야 할 것:

```text
1. POST /api/internal/rematch-due-deliveries
2. internal auth
3. jobLocks
4. rematchRuns
5. deliveryBatches lineage
6. Round 0 -> Round 1 -> Round 2
7. No Round 3
8. sourceBatchId/sourceBatchRound
9. PRD 8.5 random-slot replacement
10. existing active deliveries remain answerable
11. no branching rematch tree
12. total human delivery count <= 15
13. selected new recipients activeDeliveryCount < 10 transaction check
14. new recipients activeDeliveryCount increment
```

### 5-2. AI fallback

구현해야 할 것:

```text
1. POST /api/internal/create-ai-fallbacks
2. 24h condition
3. human delivery limit exhausted
4. zero human replies
5. disliked human replies still count as human replies
6. existing active deliveries do not need to expire
7. one AI reply per worry
8. AI reply moderation before save
9. notify author
```

## 왜 rematch 다음 AI인가

AI fallback 조건이 rematch 결과에 의존합니다. 인간 delivery 15개를 모두 소진했고, 인간 reply가 0개일 때만 AI fallback이 가능합니다. 따라서 rematch가 먼저입니다.

## 통과 기준

```text
- Round 1은 Round 0 source
- Round 2는 Round 1 source
- Round 3 없음
- historical earlier batches가 독립 branch 생성하지 않음
- source batch random recipient 답변 여부에 따라 random replacement 결정
- 기존 active delivery는 계속 answerable
- AI fallback은 late human reply가 있으면 생성되지 않음
```

---

# Stage 6. Example worries

## 대응 TODO

```text
Slice 10: Example worries
```

## 구현 범위

온보딩 직후 예제 고민을 생성합니다. 이 단계는 real delivery/reply/feedback 구조가 안정화된 뒤 해야 합니다.

구현해야 할 것:

```text
1. exampleWorrySeeds
2. onboarding 완료 hook/API
3. 최대 5개 생성
4. 선택 interests 기반 seed 선택
5. created once
6. answer feed에는 실제 고민처럼 표시
7. UI에 example label 없음
8. example reply도 moderation 적용
9. reply 후 5~15분 delayed like
10. no auto comment
11. helpedCount 증가
12. example feedback job
```

## 통과 기준

```text
- 신규 유저 온보딩 후 최대 5개 예제 delivery 생성
- 같은 유저에게 중복 생성되지 않음
- 관심 분야 수보다 많이 생성하지 않음
- 예제 답변도 일반 답변처럼 처리
- delayed like가 한 번만 발생
```

---

# Stage 7. UI navigation / validation-copy / notifications

## 대응 TODO

```text
Slice 11: UI navigation PRD alignment
Slice 12: Input validation and copy
Slice 13: Notifications
```

## 구현 범위

서버/데이터 모델이 안정화된 뒤 사용자-facing 구조를 PRD에 맞춥니다.

### 7-1. UI navigation

```text
1. 첫 화면 답변하기
2. 하단 탭: 답변하기 / 나의 고민 / 마이페이지
3. 고민 작성은 나의 고민에서 시작
4. inbox/settings/home 개념 분해
5. 마이페이지 More menu
6. 공개 게시판처럼 보이는 요소 제거
```

### 7-2. Validation/copy

```text
1. common content validator
2. trim non-empty
3. max 1000
4. min 10 제거
5. moderation reason별 message
6. high-risk help message
7. moderation 실패 후 draft 유지
```

### 7-3. Notifications

```text
1. notification service 추출
2. PRD notification kinds only
   - new worry
   - new reply
   - reply liked
3. comment notification 제거
4. dislike notification 없음
5. invalid token cleanup
6. pushLogs durable
7. foreground duplication policy
```

## 왜 UI를 이 시점에 하는가

UI부터 하면 잘못된 legacy data flow에 맞춰 화면을 다시 짜게 됩니다. 서버 model/read model이 잡힌 뒤 UI를 맞추는 편이 덜 위험합니다.

## 통과 기준

```text
- PRD 탭 구조와 진입점이 맞음
- 공개 feed처럼 보이는 요소 없음
- 모든 입력 정책이 통일됨
- notification 종류가 PRD 3종으로 제한됨
```

---

# Stage 8. Account deletion / Admin hiding / logs

## 대응 TODO

```text
Slice 14: Account deletion and inactive users
Slice 15: Admin hiding and internal logs
```

## 구현 범위

운영 정책과 안전장치를 완성합니다.

### 8-1. Account deletion

```text
1. POST /api/users/me/delete
2. soft delete only
3. push token cleanup
4. deleted user future activity block
5. matching exclusion
6. existing content preserved
```

### 8-2. Admin hiding/logs

```text
1. hidden fields on worries/replies/deliveries
2. read models exclude hidden
3. active delivery hidden이면 activeDeliveryCount decrement exactly once
4. moderation/matching/pass/rematch/push/AI/example logs
5. DB-manual hiding support
```

## 통과 기준

```text
- 탈퇴자는 publish/reply/pass/feedback 불가
- 탈퇴자 기존 content는 유지
- 탈퇴자 matching/push 대상 제외
- admin hidden content가 모든 read model에서 제외
- logs가 주요 server action에 남음
```

---

# Stage 9. Legacy removal / Docs & ops

## 대응 TODO

```text
Slice 16: Legacy letters removal
Slice 17: Documentation and operational setup
```

## 구현 범위

최종 정리 단계입니다. 이 단계 전까지는 legacy fallback이 일부 남아 있을 수 있지만, 여기서 제거합니다.

### 9-1. Legacy removal

```text
1. receiverId === 'public' 제거
2. deleteLetter 제거
3. letters worry fallback 제거
4. letters reply fallback 제거
5. old bot schedule endpoint 제거
6. old comment notification endpoint 제거
7. client Firestore adapters that create/update letters 제거
8. final rules deny letters
9. rg "letters" 검증
```

### 9-2. Documentation / ops

```text
1. docs/matching_algorithm.md 업데이트
2. README 또는 docs/ops.md 업데이트
3. env vars 정리
4. internal job 실행 방식 문서화
5. Firebase emulator/rules test command
6. deploy notes
```

## 통과 기준

```text
- runtime에서 letters 의존 제거
- public worry feed 없음
- old bot schedule 없음
- rules에서 letters 차단
- 새 개발자가 ops docs 보고 실행/배포 가능
```

---

## 최종 실행 방식

각 stage마다 에이전트에게 아래 형식으로 요구하는 게 좋습니다.

```text
Implement only Stage N / Slice X from docs/TODO.md.

Before coding:
1. Inspect the relevant files.
2. Produce a short implementation plan.
3. Identify deletion test.
4. Identify tests to add/update.

During implementation:
- Keep policy out of App.tsx.
- Do not add shallow adapters.
- Add tests for observable PRD behavior.
- Preserve legacy compatibility only where TODO explicitly allows it.

After implementation:
- Report files changed.
- Report tests run.
- Report any TODO item intentionally deferred.
- Report any behavior that differs from docs/TODO.md.
```

---

## 첫 번째로 시킬 작업

바로 구현으로 들어가려면 **Stage 1 / Slice 1만** 시키면 됩니다.

```text
Implement only Slice 1 from docs/TODO.md.

Focus on:
- server-owned /api/worries/publish
- Firebase auth boundary
- moderation/category preservation
- Round 0 deliveryBatches/{batchId}
- exactly 5 Round 0 deliveries
- 4 matched + 1 random
- transactionally maintained activeDeliveryCount
- best-effort push and pushLogs
- answer feed reads new deliveries with legacy letters fallback
- tests for Slice 1 observable behavior

Do not implement reply migration, pass, rematch, AI fallback, example worries, UI tab restructuring, or legacy letters removal.
```

이렇게 진행하면 됩니다.
