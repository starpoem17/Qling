import type express from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { requireInternalJobSecret } from './internalAuth';
import type { ExperienceProfileSummaryProvider } from '../services/matching/server/profileSummary';
import {
  runExperienceProfileSummaryJobs,
  type RunExperienceProfileSummaryJobsResult,
} from '../services/matching/server/profileSummaryJobs';
import { summarizeExperienceProfile } from './experienceProfileSummaryProvider';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseBody(body: unknown): { status: 'ok'; limit?: number } | { status: 'invalid' } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'invalid' };
  const input = body as Record<string, unknown>;
  if (!Object.keys(input).every(key => key === 'limit')) return { status: 'invalid' };
  if (!('limit' in input)) return { status: 'ok' };
  if (typeof input.limit !== 'number' || !Number.isInteger(input.limit) || input.limit <= 0 || input.limit > MAX_LIMIT) {
    return { status: 'invalid' };
  }
  return { status: 'ok', limit: input.limit };
}

function sendResult(res: express.Response, result: RunExperienceProfileSummaryJobsResult): void {
  res.status(200).json(result);
}

export function registerExperienceProfileSummaryRoutes(app: express.Express, deps: {
  db: Firestore | null;
  provider?: ExperienceProfileSummaryProvider;
  runJobs?: typeof runExperienceProfileSummaryJobs;
}): void {
  if (!deps.db) {
    app.post('/api/internal/experience-profile-summaries/run', requireInternalJobSecret, (_req, res) => {
      res.status(503).json({
        error: {
          code: 'firebase_unavailable',
          message: 'Firebase Admin is not initialized.',
        },
      });
    });
    return;
  }

  app.post('/api/internal/experience-profile-summaries/run', requireInternalJobSecret, async (req, res) => {
    const body = parseBody(req.body);
    if (body.status === 'invalid') {
      res.status(400).json({
        error: {
          code: 'invalid_body',
          message: 'Request body must be an object with optional limit.',
        },
      });
      return;
    }

    try {
      sendResult(res, await (deps.runJobs ?? runExperienceProfileSummaryJobs)({
        db: deps.db as Firestore,
        provider: deps.provider ?? summarizeExperienceProfile,
        limit: body.limit ?? DEFAULT_LIMIT,
      }));
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'profile_summary_job_failed',
          message: 'Experience profile summary job failed.',
          details: error instanceof Error ? error.message : String(error),
        },
      });
    }
  });
}
