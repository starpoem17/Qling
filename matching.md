# 매칭 알고리즘 고도화

사람: Hun

# Qling MVP v1 - Experience-based Matching System

## 1. Objective

### Goal

Qling은 단순 관심사 매칭이 아닌,

> 비슷한 경험을 가진 사용자를 연결하여 고민에 대한 공감과 경험 기반 답변을 제공하는 서비스이다.
> 

MVP에서는 별도의 추천 모델을 학습하지 않고,

```
Firestore
+
LLM Agent
+
Experience Profile
```

구조를 이용하여 매칭을 수행한다.

---

## 2. High-Level Architecture

```
User Onboarding

↓

Experience Profile Initialization

↓

User Writes Worry

↓

Concern Analyzer

↓

Tier-based Candidate Retrieval

↓

Tier-aware LLM Matching Judge

↓

Post-processing Rule

↓

Delivery Generation

↓

Reply / Feedback

↓

Experience Profile Update
```

---

## 3. Ontology v1

### 3.1 Topic Tags

```json
[
  "진로",
  "취업",
  "직장",
  "학업",
  "시험",
  "경제",
  "연애",
  "결혼",
  "가족",
  "인간관계",
  "육아",
  "건강",
  "외모",
  "군대",
  "미래",
  "일상"
]
```

---

### 3.2 Emotion Tags

```json
[
  "불안",
  "우울감",
  "외로움",
  "자존감저하",
  "무기력",
  "좌절",
  "슬픔",
  "분노",
  "죄책감",
  "후회",
  "혼란",
  "부담감"
]
```

---

### 3.3 Desired Response Tags

```json
[
  "공감",
  "경험공유",
  "현실조언",
  "정보제공",
  "격려",
  "관점정리"
]
```

---

### 3.4 Situation Tags

```json
[
  "장기취준",
  "서류탈락",
  "면접실패",
  "이직고민",
  "직장적응",
  "상사갈등",
  "번아웃",
  "성적부진",
  "시험불안",
  "진로혼란",
  "휴학고민",
  "전공불만",
  "이별",
  "짝사랑",
  "연애갈등",
  "부모갈등",
  "친구갈등",
  "대인관계어려움",
  "경제부담",
  "미래불확실성",
  "건강염려",
  "외모고민",
  "군생활적응",
  "일상무기력"
]
```

---

## 4. Onboarding

### Question

```
내가 공감하거나 답변할 수 있는 고민 주제를 골라주세요.
```

### Selected Topics

사용자는 Topic Tag 중 복수 선택.

### Initial Experience Profile

온보딩 완료 시:

```json
{
  "topicScores": {
    "취업": 1,
    "학업": 1
  }
}
```

초기 생성.

### Initial Status

```
profileStatus = cold_start
```

---

## 5. Concern Analyzer

### Input

```json
{
  "content": "고민 원문"
}
```

### Output

```json
{
  "topicTags": [],
  "emotionTags": [],
  "situationTags": [],
  "desiredResponse": [],
  "suggestedNewTags": [],
  "riskLevel": "",
  "riskReason": "",
  "matchingBrief": ""
}
```

### Constraints

```
topicTags ≤ 3
emotionTags ≤ 2
situationTags ≤ 3
desiredResponse ≤ 2
matchingBrief = 30~60자
matchingBrief = 반드시 1문장
```

---

## 6. Risk Policy

### low

```
일반 매칭
```

### medium

```
일반 매칭
추가 moderation
```

### high

```
매칭 중단
경고 문구 생성
전문기관 안내
```

---

## 7. Experience Profile

### profileStatus

```
cold_start
light
validated
trusted
```

---

### Profile Structure

```json
{
  "topicScores": {},
  "situationScores": {},
  "answerStyleScores": {},
  "topTopics": [],
  "topSituations": [],
  "topAnswerStyles": [],
  "profileSummary": "",
  "recentPositiveSignals": [],
  "safetyPenalty": 0
}
```

---

### trusted Promotion Rule

```
helpedCount >= 10

AND

safetyPenalty <= 1

AND

최근 90일 내 활동 존재
```

---

## 8. Candidate Retrieval

### Retrieval Score

```
retrieval_score

=

2 × topic_overlap

+

3 × situation_overlap

+

1 × answer_style_overlap
```

---

### Tier A

```
retrieval_score >= 7

AND

profileStatus ∈ {validated, trusted}
```

---

### Tier B

```
retrieval_score >= 4
```

---

### Tier C

```
retrieval_score >= 1

AND

profileStatus != cold_start
```

---

### Exploration

```
profileStatus == cold_start
```

---

## 9. Matching Judge

### Input

```
Concern

+

Candidates(20~30명)
```

---

### Candidate Context

```json
{
  "candidateId": "",
  "tier": "",
  "profileStatus": "",
  "topTopics": [],
  "topicScores": {},
  "topSituations": [],
  "situationScores": {},
  "topAnswerStyles": [],
  "answerStyleScores": {},
  "profileSummary": "",
  "recentPositiveSignals": [],
  "qualitySignals": {}
}
```

---

### Output

```json
{
  "rankedCandidates": []
}
```

### Rules

```
score 사용 금지

rank만 사용

reason = 1문장
```

---

## 10. Post-processing Rule

Final Delivery = 5

```
Tier A : 2~3명

Tier B : 1~2명

Tier C : 최대 1명

Exploration : Tier 부족 시 최대 1명
```

---

## 11. Experience Profile Update

### Reply Created

```
topicScores += 0.5

situationScores += 0.5

answerStyleScores += 0.5
```

---

### Like Received

```
topicScores += 2

situationScores += 2

answerStyleScores += 2

helpedCount += 1
```

---

### Moderation Fail

```
safetyPenalty += 1
```

---

### Profile Summary Regeneration

조건:

```
helpedCount +3

OR

topTopics 변경

OR

7일 경과

OR

중요 moderation 이벤트
```

---

### Experience Decay

MVP v1:

```
최근 90일 데이터만 반영
```

오래된 signal은 자동 제외.

---

## 12. Firestore Additions

### worries.llmAnalysis

### users.profileStatus

### users.experienceProfile

### deliveries.llmMatch

---

## 13. Cloud Function Flow

```
Worry Created

↓

Moderation

↓

Concern Analyzer

↓

Candidate Retrieval

↓

Matching Judge

↓

Post-processing

↓

Deliveries 생성

↓

Reply

↓

Feedback

↓

Experience Profile Update
```