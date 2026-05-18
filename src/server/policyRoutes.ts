import type express from 'express';
import { loadPolicyDocument } from '../services/policyDocuments/policyLoader';
import type { PolicyDocumentKind } from '../services/policyDocuments/types';

function isPolicyKind(value: string): value is PolicyDocumentKind {
  return value === 'privacy_policy';
}

export function registerPolicyRoutes(app: express.Express): void {
  app.get('/api/policies/:kind', (req, res) => {
    const kind = req.params.kind;
    if (!isPolicyKind(kind)) {
      res.status(404).json({ error: { code: 'policy_not_found', message: '정책을 준비 중입니다.' } });
      return;
    }

    res.status(200).json(loadPolicyDocument({ kind }));
  });
}
