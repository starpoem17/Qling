import type express from 'express';

export type QlingReleaseInfo = {
  service: 'Qling';
  gitSha: string;
  buildTime: string;
  nodeEnv: string;
};

export function getQlingReleaseInfo(env: NodeJS.ProcessEnv = process.env): QlingReleaseInfo {
  return {
    service: 'Qling',
    gitSha: firstPresent([
      env.QLING_RELEASE_SHA,
      env.RENDER_GIT_COMMIT,
      env.COMMIT_SHA,
      env.GIT_SHA,
    ]),
    buildTime: firstPresent([
      env.QLING_BUILD_TIME,
      env.QLING_RELEASE_TIME,
      env.BUILD_TIME,
      env.RENDER_DEPLOY_CREATED_AT,
    ]),
    nodeEnv: env.NODE_ENV ?? 'development',
  };
}

export function applyQlingReleaseHeaders(
  res: Pick<express.Response, 'setHeader'>,
  releaseInfo: QlingReleaseInfo
) {
  res.setHeader('X-Qling-Release-Sha', releaseInfo.gitSha);
  res.setHeader('X-Qling-Build-Time', releaseInfo.buildTime);
}

export function registerVersionRoutes(app: express.Express, releaseInfo = getQlingReleaseInfo()): void {
  app.use('/api', (_req, res, next) => {
    applyQlingReleaseHeaders(res, releaseInfo);
    next();
  });

  app.get('/api/version', (_req, res) => {
    res.status(200).json(releaseInfo);
  });
}

function firstPresent(values: Array<string | undefined>) {
  const value = values.find(candidate => typeof candidate === 'string' && candidate.trim() !== '');
  return value?.trim() ?? 'unknown';
}
