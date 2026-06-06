export type ChatRuleSafetyResult =
  | { status: 'approved' }
  | { status: 'rejected'; reasonCode: ChatRuleSafetyReasonCode; reason: string };

export type ChatRuleSafetyReasonCode =
  | 'abuse_hate_profanity'
  | 'sexual'
  | 'personal_info'
  | 'unsafe_url'
  | 'too_long';

export const CHAT_MESSAGE_MAX_LENGTH = 1000;

const REJECTION_COPY: Record<ChatRuleSafetyReasonCode, string> = {
  abuse_hate_profanity: '공격적이거나 혐오, 욕설 표현이 포함되어 전송할 수 없습니다.',
  sexual: '성적 표현이 포함되어 전송할 수 없습니다.',
  personal_info: '개인정보나 연락처가 포함되어 전송할 수 없습니다.',
  unsafe_url: '외부 링크는 안전을 위해 전송할 수 없습니다.',
  too_long: '메시지는 1000자 이내로 입력해주세요.',
};

const RULES: ReadonlyArray<{ readonly reasonCode: ChatRuleSafetyReasonCode; readonly pattern: RegExp }> = [
  {
    reasonCode: 'personal_info',
    pattern: /(?:010[-.\s]?\d{4}[-.\s]?\d{4}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:카톡|카카오톡|오픈채팅|오픈챗|라인\s?id|텔레그램).{0,12}(?:아이디|id|연락|추가|친추|알려|보내|하자)|(?:아이디|id|연락처).{0,12}(?:카톡|카카오톡|오픈채팅|오픈챗|라인|텔레그램))/i,
  },
  {
    reasonCode: 'unsafe_url',
    pattern: /(?:https?:\/\/|www\.|bit\.ly|tinyurl\.com|t\.me\/|open\.kakao\.com)/i,
  },
  {
    reasonCode: 'sexual',
    pattern: /(?:강간|성폭행|섹스|야동|자위|보지|자지|성기|음란|섹드립|원나잇)/i,
  },
  {
    reasonCode: 'abuse_hate_profanity',
    pattern: /(?:씨발|시발|ㅅㅂ|병신|ㅂㅅ|좆|존나|개새끼|꺼져|죽어라|한남충|김치녀|틀딱|맘충|장애인\s*새끼)/i,
  },
];

export function evaluateChatMessageRuleSafety(content: string): ChatRuleSafetyResult {
  const normalized = content.normalize('NFKC').trim();
  if (normalized.length > CHAT_MESSAGE_MAX_LENGTH) {
    return {
      status: 'rejected',
      reasonCode: 'too_long',
      reason: REJECTION_COPY.too_long,
    };
  }
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        status: 'rejected',
        reasonCode: rule.reasonCode,
        reason: REJECTION_COPY[rule.reasonCode],
      };
    }
  }
  return { status: 'approved' };
}
