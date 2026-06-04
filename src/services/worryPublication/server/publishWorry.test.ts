import test from 'node:test';
import assert from 'node:assert/strict';
import { selectActivePrdAnswerFeedItems } from '../../homeWorryFeed/prdPolicy';
import { selectMyWorries } from '../../myWorries/prdPolicy';
import { FALLBACK_CONCERN_ANALYSIS } from './concernAnalysis';
import { publishWorryOnServer } from './publishWorry';
import type { ExperienceProfile } from '../../matching/server/experienceProfile';
import type {
  InitialWorryPublicationRepository,
  CommittedInitialWorryPublication,
  DeliveryBatchWriteModel,
  DeliveryWriteModel,
  ModerationLogWriteModel,
  SummaryFailureLogWriteModel,
  Phase1HumanCandidate,
  WorryWriteModel,
} from './types';

function createFakeDb(options: {
  tokenDocsByUid?: Record<string, Array<{ id: string; token: string }>>;
  onPushLog?: (data: unknown) => void;
} = {}) {
  const pushLogs: unknown[] = [];
  return {
    pushLogs,
    collection(name: string) {
      if (name === 'pushLogs') {
        return { add: async (data: unknown) => {
          options.onPushLog?.(data);
          pushLogs.push(data);
        } };
      }
      return {
        doc(uid?: string) {
          return {
            get: async () => ({ exists: true, data: () => ({}) }),
            collection(collectionName: string) {
              assert.equal(collectionName, 'fcmTokens');
              const tokenDocs = uid ? (options.tokenDocsByUid?.[uid] ?? []) : [];
              return {
                get: async () => ({
                  empty: tokenDocs.length === 0,
                  docs: tokenDocs.map(tokenDoc => ({
                    id: tokenDoc.id,
                    data: () => ({ token: tokenDoc.token }),
                    ref: { delete: async () => undefined },
                  })),
                }),
              };
            },
          };
        },
      };
    },
  };
}

function candidate(uid: string, interests = ['취업']): Phase1HumanCandidate {
  const position = uid.charCodeAt(0) - 'a'.charCodeAt(0);
  const experienceProfile: Partial<ExperienceProfile> = position < 2
    ? {
      topicScores: { '취업': 1, '진로': 1 },
      situationScores: { '장기취준': 1 },
      answerStyleScores: { '공감': 1 },
      topTopics: ['취업', '진로'],
      topSituations: ['장기취준'],
      topAnswerStyles: ['공감'],
      profileSummary: '',
      recentPositiveSignals: [],
      safetyPenalty: 0,
    }
    : position < 4
      ? {
        topicScores: { '취업': 1 },
        situationScores: { '장기취준': 1 },
        answerStyleScores: { '공감': 1 },
        topTopics: ['취업'],
        topSituations: ['장기취준'],
        topAnswerStyles: ['공감'],
        profileSummary: '',
        recentPositiveSignals: [],
        safetyPenalty: 0,
      }
      : {
        topicScores: { '취업': 1 },
        situationScores: {},
        answerStyleScores: {},
        topTopics: ['취업'],
        topSituations: [],
        topAnswerStyles: [],
        profileSummary: '',
        recentPositiveSignals: [],
        safetyPenalty: 0,
      };

  return {
    uid,
    gender: 'female',
    interests,
    helpedCount: 0,
    profileStatus: 'validated',
    experienceProfile,
    activeDeliveryCount: 0,
  };
}

function createFakeRepository(candidates: Phase1HumanCandidate[]): InitialWorryPublicationRepository & {
  moderationLogs: ModerationLogWriteModel[];
  commits: number;
  fetches: number;
  lastCommit?: {
    worry: WorryWriteModel;
    batch: DeliveryBatchWriteModel;
    deliveries: DeliveryWriteModel[];
    summaryFailureLog?: SummaryFailureLogWriteModel;
    selectedRecipientUids: string[];
  };
} {
  return {
    moderationLogs: [],
    commits: 0,
    fetches: 0,
    createIds: () => ({
      worryId: 'worry1',
      batchId: 'batch1',
      moderationLogId: 'mod1',
      summaryFailureLogId: 'summary-log1',
    }),
    fetchRecipientCandidates: async params => {
      repo.fetches += 1;
      assert.equal(params.authorUid, 'author');
      assert.equal(params.minimumCandidateCount, 5);
      return candidates;
    },
    commitRejectedWorryModeration: async ({ moderationLog }) => {
      (repo.moderationLogs as ModerationLogWriteModel[]).push(moderationLog);
      return { moderationLogId: moderationLog.id, targetId: moderationLog.targetId };
    },
    commitInitialWorryPublication: async params => {
      repo.commits += 1;
      repo.lastCommit = {
        worry: params.worry,
        batch: params.batch,
        deliveries: params.deliveries,
        summaryFailureLog: params.summaryFailureLog,
        selectedRecipientUids: params.selectedRecipientUids,
      };
      assert.equal(params.worry.id, 'worry1');
      assert.equal(params.batch.batchRound, 0);
      assert.equal(params.worry.initialDeliveryTargetCount, 5);
      assert.equal(params.worry.humanDeliveryLimit, 15);
      assert.equal(params.worry.humanDeliveryCount, params.deliveries.length);
      assert.equal(params.batch.targetCount, 5);
      assert.equal(params.batch.createdCount, params.deliveries.length);
      assert.equal(params.batch.matchedCount, params.deliveries.filter(delivery => delivery.selectionType === 'matched').length);
      assert.equal(params.batch.randomCount, params.deliveries.filter(delivery => delivery.selectionType === 'random').length);
      assert.deepEqual(params.deliveries.map(d => d.id), params.deliveries.map(d => `worry1_${d.recipientUid}`));
      assert.ok(params.deliveries.every(d => d.authorGenderSnapshot === 'female'));
      return {
        worryId: params.worry.id,
        deliveryIds: params.deliveries.map(d => d.id),
        moderationLogId: params.moderationLog.id,
      } satisfies CommittedInitialWorryPublication;
    },
  } as InitialWorryPublicationRepository & {
    moderationLogs: ModerationLogWriteModel[];
    commits: number;
    fetches: number;
    lastCommit?: {
      worry: WorryWriteModel;
      batch: DeliveryBatchWriteModel;
      deliveries: DeliveryWriteModel[];
      summaryFailureLog?: SummaryFailureLogWriteModel;
      selectedRecipientUids: string[];
    };
  };
}

let repo: ReturnType<typeof createFakeRepository>;

const defaultConcernAnalysis = {
  topicTags: ['취업', '진로'],
  emotionTags: ['불안'],
  situationTags: ['장기취준'],
  desiredResponse: ['공감'],
  suggestedNewTags: [],
  riskLevel: 'low',
  riskReason: '',
  matchingBrief: '취업과 진로 고민이 길어지며 공감 답변이 필요한 상황입니다.',
};

const defaultConcernAnalyzerProvider = async () => defaultConcernAnalysis;

test('happy path creates canonical worry batch deliveries and moderation log', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e', 'f'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '  고민  ',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
    random: () => 0.1,
  });

  assert.equal(result.status, 'published');
  if (result.status !== 'published') return;
  assert.equal(result.deliveryIds.length, 5);
  assert.equal(repo.commits, 1);
  assert.equal(repo.lastCommit?.batch.matchedCount, 5);
  assert.equal(repo.lastCommit?.batch.randomCount, 0);
  assert.equal(repo.lastCommit?.worry.authorUid, 'author');
  assert.equal(repo.lastCommit?.worry.content, '고민');
  assert.equal(repo.lastCommit?.worry.summaryText, '고민');
  assert.equal(repo.lastCommit?.worry.summaryStatus, 'original');
  assert.equal(repo.lastCommit?.worry.summaryGeneratedBy, 'none');
  assert.deepEqual(repo.lastCommit?.worry.llmAnalysis, defaultConcernAnalysis);
  assert.equal(repo.lastCommit?.deliveries.every(delivery => (
    delivery.recipientUid
    && delivery.authorUid === 'author'
    && delivery.worryId === 'worry1'
    && delivery.status === 'active'
    && delivery.answeredAt === null
  )), true);
});

test('approved worry stores normalized concern analysis without changing delivery selection', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e', 'f'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '취업 준비가 길어져서 면접이 너무 불안해요',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: async () => ({
      topicTags: ['취업', '진로', '없는주제'],
      emotionTags: ['불안', '좌절', '분노'],
      situationTags: ['장기취준', '면접실패', '없는상황'],
      desiredResponse: ['공감', '현실조언', '격려'],
      suggestedNewTags: ['압박면접', '압박면접'],
      riskLevel: 'low',
      riskReason: '',
      matchingBrief: '취업 준비가 길어지며 면접 불안을 크게 느끼는 상황입니다.',
    }),
    repository: repo,
    random: () => 0.1,
  });

  assert.equal(result.status, 'published');
  assert.deepEqual(repo.lastCommit?.worry.llmAnalysis, {
    topicTags: ['취업', '진로'],
    emotionTags: ['불안', '좌절'],
    situationTags: ['장기취준', '면접실패'],
    desiredResponse: ['공감', '현실조언'],
    suggestedNewTags: ['압박면접'],
    riskLevel: 'low',
    riskReason: '',
    matchingBrief: '취업 준비가 길어지며 면접 불안을 크게 느끼는 상황입니다.',
  });
  assert.equal(repo.lastCommit?.batch.matchedCount, 5);
  assert.equal(repo.lastCommit?.batch.randomCount, 0);
  assert.deepEqual(repo.lastCommit?.deliveries.map(delivery => delivery.llmMatch?.tier), ['A', 'A', 'B', 'B', 'C']);
});

test('concern analyzer retries invalid output once and stores retry result', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const calls: boolean[] = [];
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '취업 고민이 길어져서 불안하고 현실적인 조언이 필요해요',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: async (_content, strictRetry) => {
      calls.push(Boolean(strictRetry));
      return strictRetry
        ? {
          topicTags: ['취업'],
          emotionTags: ['불안'],
          situationTags: ['장기취준'],
          desiredResponse: ['현실조언'],
          suggestedNewTags: [],
          riskLevel: 'low',
          riskReason: '',
          matchingBrief: '취업 준비가 길어지며 현실적인 조언이 필요한 상황입니다.',
        }
        : { topicTags: ['취업'], matchingBrief: '짧음' };
    },
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.deepEqual(calls, [false, true]);
  assert.deepEqual(repo.lastCommit?.worry.llmAnalysis?.topicTags, ['취업']);
  assert.deepEqual(repo.lastCommit?.worry.llmAnalysis?.desiredResponse, ['현실조언']);
});

test('concern analyzer failure stores fallback and does not block publish', async () => {
  for (const provider of [
    async () => ({ topicTags: ['취업'], matchingBrief: '짧음' }),
    async () => { throw new Error('analyzer down'); },
  ]) {
    repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
    const result = await publishWorryOnServer({
      db: createFakeDb() as never,
      messaging: null,
      author: { uid: 'author', gender: 'female', interests: ['취업'] },
      content: 'content',
      moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
      concernAnalyzerProvider: provider,
      repository: repo,
    });

    assert.equal(result.status, 'published');
    assert.deepEqual(repo.lastCommit?.worry.llmAnalysis, FALLBACK_CONCERN_ANALYSIS);
  }
});

test('high risk concern blocks matching and stores moderation log only', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '위험한 고민',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'], raw: 'moderation' }),
    concernAnalyzerProvider: async () => ({
      topicTags: ['취업'],
      emotionTags: ['불안'],
      situationTags: ['장기취준'],
      desiredResponse: ['공감'],
      suggestedNewTags: [],
      riskLevel: 'high',
      riskReason: '즉각적인 안전 확인이 필요합니다.',
      matchingBrief: '즉각적인 안전 확인과 전문기관 안내가 먼저 필요한 고민 상황입니다.',
    }),
    repository: repo,
  });

  assert.equal(result.status, 'risk_blocked');
  if (result.status !== 'risk_blocked') return;
  assert.equal(result.code, 'high_risk');
  assert.equal(result.moderationLogId, 'mod1');
  assert.equal(result.targetId, 'worry1');
  assert.equal(repo.fetches, 0);
  assert.equal(repo.commits, 0);
  assert.equal(repo.moderationLogs.length, 1);
  assert.equal(repo.moderationLogs[0].status, 'rejected');
  assert.equal(repo.moderationLogs[0].reasonCode, 'high_risk');
  assert.equal(repo.moderationLogs[0].helpMessage, result.helpMessage);
  assert.equal((repo.moderationLogs[0].rawProviderResponse as { concernAnalysis: { riskLevel: string } }).concernAnalysis.riskLevel, 'high');
});

test('long approved worry stores generated LLM summary', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '012345678901234567890123456789',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    summaryProvider: async () => 'LLM 요약',
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.equal(repo.lastCommit?.worry.summaryText, 'LLM 요약');
  assert.equal(repo.lastCommit?.worry.summaryStatus, 'llm_generated');
  assert.equal(repo.lastCommit?.worry.summaryGeneratedBy, 'llm');
  assert.equal(repo.lastCommit?.summaryFailureLog, undefined);
});

test('long approved worry retries overlong summary once', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const calls: boolean[] = [];
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '012345678901234567890123456789',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    summaryProvider: async (_content, strictRetry) => {
      calls.push(Boolean(strictRetry));
      return strictRetry ? { summaryText: '재요약' } : '012345678901234567890';
    },
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.deepEqual(calls, [false, true]);
  assert.equal(repo.lastCommit?.worry.summaryText, '재요약');
  assert.equal(repo.lastCommit?.worry.summaryStatus, 'llm_generated');
});

test('summary failure stores fallback summary and debug log without blocking publish', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: '012345678901234567890123456789',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    summaryProvider: async (_content, strictRetry) => strictRetry
      ? { summaryText: '012345678901234567890' }
      : '012345678901234567890',
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.equal(repo.lastCommit?.worry.summaryText, '01234567890123456789...');
  assert.equal(repo.lastCommit?.worry.summaryStatus, 'fallback_truncated');
  assert.equal(repo.lastCommit?.worry.summaryGeneratedBy, 'none');
  assert.equal(repo.lastCommit?.summaryFailureLog?.worryId, 'worry1');
  assert.equal(repo.lastCommit?.summaryFailureLog?.attemptCount, 2);
  assert.equal(repo.lastCommit?.summaryFailureLog?.failureReason, 'summary_too_long_or_invalid');
  assert.equal(repo.lastCommit?.summaryFailureLog?.firstResponseText, '012345678901234567890');
  assert.equal(repo.lastCommit?.summaryFailureLog?.retryResponseText, '{"summaryText":"012345678901234567890"}');
});

test('published canonical shape appears in my worries and active answer feed read models', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'read model content',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.ok(repo.lastCommit);

  const worry = repo.lastCommit.worry;
  const delivery = repo.lastCommit.deliveries[0];
  const myWorries = selectMyWorries({
    userUid: 'author',
    worries: [worry],
  });
  const answerFeedItems = selectActivePrdAnswerFeedItems({
    profileUid: delivery.recipientUid,
    deliveries: [delivery],
    worriesById: new Map([[worry.id, worry]]),
  });

  assert.deepEqual(myWorries.map(item => ({
    id: item.id,
    authorUid: item.authorUid,
    content: item.content,
    summaryText: item.summaryText,
    source: item.source,
  })), [{
    id: 'worry1',
    authorUid: 'author',
    content: 'read model content',
    summaryText: 'read model content',
    source: 'prd_worries',
  }]);
  assert.deepEqual(answerFeedItems.map(item => ({
    deliveryId: item.deliveryId,
    worryId: item.worryId,
    authorUid: item.authorUid,
    recipientUid: item.recipientUid,
    originalContent: item.originalContent,
    summaryText: item.summaryText,
    status: item.status,
  })), [{
    deliveryId: delivery.id,
    worryId: 'worry1',
    authorUid: 'author',
    recipientUid: delivery.recipientUid,
    originalContent: 'read model content',
    summaryText: 'read model content',
    status: 'active',
  }]);
});

test('rejected moderation creates moderation log only with generated target id', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  let analyzerCalls = 0;
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'reject me',
    moderationProvider: async () => ({ status: 'rejected', reason: 'spam' }),
    concernAnalyzerProvider: async () => {
      analyzerCalls += 1;
      return {};
    },
    repository: repo,
  });

  assert.equal(result.status, 'rejected');
  assert.equal(analyzerCalls, 0);
  assert.equal(repo.commits, 0);
  assert.equal(repo.moderationLogs.length, 1);
  assert.equal(repo.moderationLogs[0].targetId, 'worry1');
});

test('invalid provider output after retry creates no core publication state', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e'].map(uid => candidate(uid)));
  const result = await publishWorryOnServer({
    db: createFakeDb() as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'content',
    moderationProvider: async () => ({ nope: true }),
    repository: repo,
  });

  assert.equal(result.status, 'provider_error');
  assert.equal(repo.commits, 0);
  assert.equal(repo.moderationLogs.length, 0);
});

test('0 eligible humans still publishes worry batch and no deliveries or push work', async () => {
  repo = createFakeRepository([]);
  const db = createFakeDb();
  const result = await publishWorryOnServer({
    db: db as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'content',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.deepEqual(result.status === 'published' ? result.deliveryIds : [], []);
  assert.equal(repo.commits, 1);
  assert.equal(repo.lastCommit?.worry.humanDeliveryCount, 0);
  assert.equal(repo.lastCommit?.worry.lastDeliveryCreatedAt, repo.lastCommit?.worry.createdAt);
  assert.equal(repo.lastCommit?.batch.createdCount, 0);
  assert.equal(repo.lastCommit?.batch.matchedCount, 0);
  assert.equal(repo.lastCommit?.batch.randomCount, 0);
  assert.deepEqual(repo.lastCommit?.selectedRecipientUids, []);
  assert.equal(db.pushLogs.length, 0);
});

test('1 and 4 eligible humans publish actual matched delivery counts', async () => {
  for (const count of [1, 4]) {
    repo = createFakeRepository(['a', 'b', 'c', 'd'].slice(0, count).map(uid => candidate(uid)));
    const result = await publishWorryOnServer({
      db: createFakeDb() as never,
      messaging: null,
      author: { uid: 'author', gender: 'female', interests: ['취업'] },
      content: 'content',
      moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
      concernAnalyzerProvider: defaultConcernAnalyzerProvider,
      repository: repo,
    });

    assert.equal(result.status, 'published');
    assert.equal(result.status === 'published' ? result.deliveryIds.length : 0, count);
    assert.equal(repo.lastCommit?.worry.humanDeliveryCount, count);
    assert.equal(repo.lastCommit?.batch.createdCount, count);
    assert.equal(repo.lastCommit?.batch.matchedCount, count);
    assert.equal(repo.lastCommit?.batch.randomCount, 0);
  }
});

test('push logs run only after core transaction commit', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e', 'f'].map(uid => candidate(uid)));
  const db = createFakeDb({
    onPushLog: () => {
      assert.equal(repo.commits, 1);
    },
  });

  const result = await publishWorryOnServer({
    db: db as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'content',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
    random: () => 0.1,
  });

  assert.equal(result.status, 'published');
  assert.equal(db.pushLogs.length, 5);
});

test('push logs run only for actual partial deliveries', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd'].map(uid => candidate(uid)));
  const db = createFakeDb();

  const result = await publishWorryOnServer({
    db: db as never,
    messaging: null,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'content',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
  });

  assert.equal(result.status, 'published');
  assert.equal(db.pushLogs.length, 4);
});

test('push failure does not roll back core publication result', async () => {
  repo = createFakeRepository(['a', 'b', 'c', 'd', 'e', 'f'].map(uid => candidate(uid)));
  const db = createFakeDb({
    tokenDocsByUid: {
      a: [{ id: 'token-a', token: 'token-a' }],
      b: [{ id: 'token-b', token: 'token-b' }],
      c: [{ id: 'token-c', token: 'token-c' }],
      d: [{ id: 'token-d', token: 'token-d' }],
      e: [{ id: 'token-e', token: 'token-e' }],
    },
  });

  const result = await publishWorryOnServer({
    db: db as never,
    messaging: {
      send: async () => {
        throw new Error('push down');
      },
    } as never,
    author: { uid: 'author', gender: 'female', interests: ['취업'] },
    content: 'content',
    moderationProvider: async () => ({ status: 'approved', categories: ['취업'] }),
    concernAnalyzerProvider: defaultConcernAnalyzerProvider,
    repository: repo,
    random: () => 0.1,
  });

  assert.equal(result.status, 'published');
  assert.equal(repo.commits, 1);
  assert.equal(db.pushLogs.every(log => (log as { status: string }).status === 'failed'), true);
});
