import { createExampleWorriesFirestoreRepository } from './firestoreRepository';
import type { CreateDueExampleFeedbacksParams, CreateDueExampleFeedbacksResult, ExampleFeedbackJobResult } from './types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function createDueExampleFeedbacks(
  params: CreateDueExampleFeedbacksParams = {}
): Promise<CreateDueExampleFeedbacksResult> {
  if (!params.repository && !params.db) {
    return {
      status: 'server_error',
      code: 'firebase_unavailable',
      message: 'Firebase Admin is not initialized.',
    };
  }

  const now = params.now ?? new Date();
  const limit = Math.max(1, Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const repository = params.repository ?? createExampleWorriesFirestoreRepository({ db: params.db! });

  try {
    const jobs = await repository.listDueFeedbackJobs({ now, limit });
    const results: ExampleFeedbackJobResult[] = [];
    for (const job of jobs) {
      results.push(await repository.processFeedbackJob({ jobId: job.id, now }));
    }

    if (params.includeExisting === true) {
      const processedJobIds = new Set(jobs.map(job => job.id));
      let remainingLimit = Math.max(0, limit - jobs.length);
      if (remainingLimit > 0) {
        const scheduledJobs = await repository.listScheduledFeedbackJobs({ limit: remainingLimit });
        for (const job of scheduledJobs) {
          if (processedJobIds.has(job.id)) continue;
          const scheduled = await repository.scheduleImmediateFeedbackJobForReply({ replyId: job.replyId, now });
          if (scheduled.status === 'completed') {
            results.push(await repository.processFeedbackJob({ jobId: scheduled.jobId, now }));
          } else {
            results.push(scheduled);
          }
          processedJobIds.add(job.id);
          remainingLimit -= 1;
          if (remainingLimit <= 0) break;
        }
      }

      if (remainingLimit > 0) {
        const replies = await repository.listAnsweredExampleRepliesWithoutFeedback({ limit: remainingLimit });
        for (const reply of replies) {
          const scheduled = await repository.scheduleImmediateFeedbackJobForReply({ replyId: reply.id, now });
          if (scheduled.status === 'completed') {
            results.push(await repository.processFeedbackJob({ jobId: scheduled.jobId, now }));
          } else {
            results.push(scheduled);
          }
        }
      }
    }

    if (params.notifyReplyLiked) {
      for (const result of results) {
        if (result.status !== 'completed' || !result.feedbackId || !result.replierUid) continue;
        await params.notifyReplyLiked({
          feedbackId: result.feedbackId,
          replyId: result.replyId,
          replierUid: result.replierUid,
        });
      }
    }

    return {
      status: 'completed',
      checkedCount: results.length,
      completedCount: results.filter(result => result.status === 'completed' || result.status === 'idempotent').length,
      skippedCount: results.filter(result => result.status === 'skipped').length,
      failedCount: results.filter(result => result.status === 'failed').length,
      results,
    };
  } catch (error) {
    return {
      status: 'server_error',
      code: 'transaction_aborted',
      message: 'Example feedback job failed.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
