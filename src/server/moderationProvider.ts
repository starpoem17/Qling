import { DEFAULT_WORRY_CATEGORY, WORRY_CATEGORIES } from '@midnight-radio/domain';
import type {
  MatchingJudgeProvider,
  MatchingJudgeResult,
} from '../services/matching/server/llmJudge';

export const MODERATION_PROVIDER = 'openai';
export const MODERATION_MODEL = 'gpt-5.4-mini';

export async function fetchFromOpenAI(systemInstruction: string, userContent: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in .env file');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODERATION_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_completion_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  let textContent = data.choices?.[0]?.message?.content || '{}';
  if (textContent.includes('```')) {
    textContent = textContent.replace(/```json|```/g, '').trim();
  }

  return JSON.parse(textContent);
}

async function fetchTextFromOpenAI(systemInstruction: string, userContent: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in .env file');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODERATION_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_completion_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  let textContent = data.choices?.[0]?.message?.content || '';
  if (textContent.includes('```')) {
    textContent = textContent.replace(/```json|```/g, '').trim();
  }

  return textContent;
}

export async function moderateAndInferWorryCategories(content: string, strictRetry = false): Promise<unknown> {
  const systemInstruction = `You are a moderator and category inference engine for a Korean anonymous worry-sharing app.
Use ONLY this fixed category vocabulary:
${WORRY_CATEGORIES.join(', ')}

Decision policy:
1. Reject ONLY when the text falls into one of the 6 rejection categories below. If rejected, return exactly the corresponding JSON object:
- 공격적/혐오/욕설: { "status": "rejected", "reason": "공격적, 혐오, 또는 욕설이 포함되어 있어 전송할 수 없어요." }
- 성적 표현: { "status": "rejected", "reason": "성적인 표현이 포함되어 있어 전송할 수 없어요." }
- 자해/자살 위험: { "status": "rejected", "reason": "자해나 자살과 관련된 내용은 전송할 수 없어요.", "helpMessage": "당신은 혼자가 아닙니다. 힘든 시간을 보내고 있다면 자살예방 상담전화 109에서 언제든 도움을 받을 수 있습니다." }
- 범죄/폭력 피해: { "status": "rejected", "reason": "범죄나 폭력 피해와 관련된 내용은 전송할 수 없어요.", "helpMessage": "긴급한 도움이 필요하다면 경찰청 민원콜센터 182 또는 112를 통해 도움을 받을 수 있습니다." }
- 개인정보 포함: { "status": "rejected", "reason": "연락처, 실명 등 개인정보가 포함되어 있어 전송할 수 없어요." }
- 스팸/홍보: { "status": "rejected", "reason": "스팸이나 홍보성 내용은 전송할 수 없어요." }

2. Otherwise, the text is considered acceptable and MUST be approved.

3. For approved text, return the best category labels from the fixed vocabulary above.

4. If category inference is uncertain, choose exactly ["${DEFAULT_WORRY_CATEGORY}"].

5. Never include explanations, markdown, or extra text.
6. Return JSON only.
7. Approved shape must be exactly:
   { "status": "approved", "categories": ["카테고리1", "카테고리2"] }
${strictRetry ? '8. This is a retry because the previous answer had invalid JSON or invalid shape. Return valid JSON only.' : ''}`;

  return fetchFromOpenAI(systemInstruction, content);
}

export async function summarizeWorryContent(content: string, strictRetry = false): Promise<unknown> {
  const systemInstruction = `You summarize Korean anonymous worry posts for user-facing cards.
Return ONLY one Korean single-line summary.
The returned summary MUST be 20 characters or fewer, counting spaces and punctuation.
Do not include markdown, explanations, labels, quotes, or extra text.
${strictRetry ? 'This is a retry because the previous summary was invalid or longer than 20 characters. Return a valid summary of 20 characters or fewer.' : ''}`;

  const text = await fetchTextFromOpenAI(systemInstruction, content);
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return trimmed;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export async function analyzeConcernForExperienceMatching(content: string, strictRetry = false): Promise<unknown> {
  const systemInstruction = `You analyze Korean anonymous worry posts for experience-based matching.
Return JSON only with this exact shape:
{
  "topicTags": [],
  "emotionTags": [],
  "situationTags": [],
  "desiredResponse": [],
  "suggestedNewTags": [],
  "riskLevel": "low",
  "riskReason": "",
  "matchingBrief": ""
}

Use ONLY these topicTags:
진로, 취업, 직장, 학업, 시험, 경제, 연애, 결혼, 가족, 인간관계, 육아, 건강, 외모, 군대, 미래, 일상

Use ONLY these emotionTags:
불안, 우울감, 외로움, 자존감저하, 무기력, 좌절, 슬픔, 분노, 죄책감, 후회, 혼란, 부담감

Use ONLY these desiredResponse tags:
공감, 경험공유, 현실조언, 정보제공, 격려, 관점정리

Use ONLY these situationTags:
장기취준, 서류탈락, 면접실패, 이직고민, 직장적응, 상사갈등, 번아웃, 성적부진, 시험불안, 진로혼란, 휴학고민, 전공불만, 이별, 짝사랑, 연애갈등, 부모갈등, 친구갈등, 대인관계어려움, 경제부담, 미래불확실성, 건강염려, 외모고민, 군생활적응, 일상무기력

Constraints:
- topicTags: at most 3
- emotionTags: at most 2
- situationTags: at most 3
- desiredResponse: at most 2
- riskLevel: one of low, medium, high
- matchingBrief: Korean, 30 to 60 characters, exactly one sentence
- suggestedNewTags may contain short Korean tags only when the fixed ontology is insufficient
- Do not include scores, markdown, explanations, or extra keys.
${strictRetry ? 'This is a retry because the previous response was invalid. Return valid JSON only and satisfy every constraint.' : ''}`;

  return fetchFromOpenAI(systemInstruction, content);
}

const MATCHING_JUDGE_CANDIDATE_LIMIT = 20;

export const EXPERIENCE_MATCHING_JUDGE_PROVIDER = MODERATION_PROVIDER;
export const EXPERIENCE_MATCHING_JUDGE_MODEL = MODERATION_MODEL;

export const judgeExperienceMatchingCandidates: MatchingJudgeProvider = async params => {
  const candidates = params.candidates.slice(0, MATCHING_JUDGE_CANDIDATE_LIMIT);
  if (candidates.length === 0) {
    return { rankedCandidates: [] };
  }

  const payload = JSON.stringify({
    concern: params.concern,
    candidates,
  });
  const allowedCandidateIds = new Set(candidates.map(candidate => candidate.candidateId));

  const first = normalizeJudgeProviderOutput(
    await fetchFromOpenAI(buildMatchingJudgeInstruction(false), payload),
    allowedCandidateIds,
  );
  if (first.status === 'valid') return first.result;

  const second = normalizeJudgeProviderOutput(
    await fetchFromOpenAI(buildMatchingJudgeInstruction(true), payload),
    allowedCandidateIds,
  );
  if (second.status === 'valid') return second.result;

  throw new Error('OpenAI matching judge returned invalid output');
};

function buildMatchingJudgeInstruction(strictRetry: boolean): string {
  return `You rank recipient candidates for a Korean anonymous worry-sharing app.
Return JSON only with this exact shape:
{
  "rankedCandidates": [
    { "candidateId": "candidate-id-from-input", "reason": "짧은 한국어 한 문장" }
  ]
}

Rules:
- Use ONLY candidateId values from the input candidates.
- Include each candidateId at most once.
- Rank candidates by fit for the concern using only topic, situation, answer style, profile summary, recent positive signals, helpedCount, safetyPenalty, tier, and profileStatus.
- Prefer candidates who can share relevant experience or give the desired response style.
- Do not infer or use private, sensitive, demographic, or identity traits.
- reason must be Korean, one short sentence, and must not mention internal scores.
- Return up to ${MATCHING_JUDGE_CANDIDATE_LIMIT} ranked candidates.
- Do not include markdown, explanations, comments, or extra keys.
${strictRetry ? 'This is a retry because the previous response was invalid. Return valid JSON only and satisfy every constraint.' : ''}`;
}

function normalizeJudgeProviderOutput(
  value: unknown,
  allowedCandidateIds: ReadonlySet<string>,
): { status: 'valid'; result: MatchingJudgeResult } | { status: 'invalid' } {
  if (!isRecord(value) || !Array.isArray(value.rankedCandidates)) {
    return { status: 'invalid' };
  }

  const seen = new Set<string>();
  const rankedCandidates = value.rankedCandidates
    .map(item => {
      if (!isRecord(item)) return null;
      const candidateId = typeof item.candidateId === 'string' ? item.candidateId : '';
      const reason = typeof item.reason === 'string' ? item.reason.trim() : '';
      if (!allowedCandidateIds.has(candidateId) || seen.has(candidateId) || reason.length === 0) return null;
      seen.add(candidateId);
      return { candidateId, reason };
    })
    .filter((item): item is MatchingJudgeResult['rankedCandidates'][number] => Boolean(item));

  if (rankedCandidates.length === 0 && allowedCandidateIds.size > 0) {
    return { status: 'invalid' };
  }

  return { status: 'valid', result: { rankedCandidates } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
