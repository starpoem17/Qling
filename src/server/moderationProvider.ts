import { WORRY_CATEGORIES } from '@midnight-radio/domain';

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

4. If category inference is uncertain, choose exactly ["잡담"].

5. Never include explanations, markdown, or extra text.
6. Return JSON only.
7. Approved shape must be exactly:
   { "status": "approved", "categories": ["카테고리1", "카테고리2"] }
${strictRetry ? '8. This is a retry because the previous answer had invalid JSON or invalid shape. Return valid JSON only.' : ''}`;

  return fetchFromOpenAI(systemInstruction, content);
}
