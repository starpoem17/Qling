export type InternalJobFetch = typeof fetch;

export type InternalJobRunnerOptions = {
  endpoint: string;
  rawBody?: string;
  baseUrl: string | undefined;
  secret: string | undefined;
  fetchImpl?: InternalJobFetch;
  stdout?: Pick<typeof console, 'log'>;
  stderr?: Pick<typeof console, 'error'>;
};

export type InternalJobRunnerResult = {
  statusCode: number;
  endpoint: string;
  response: unknown;
};

export async function runInternalJob(options: InternalJobRunnerOptions): Promise<InternalJobRunnerResult> {
  const {
    endpoint,
    rawBody = '{}',
    baseUrl,
    secret,
    fetchImpl = fetch,
    stdout = console,
    stderr = console,
  } = options;

  if (!endpoint || !endpoint.startsWith('/api/internal/')) {
    throw new Error('Usage: tsx scripts/runInternalJob.ts /api/internal/path \'{"limit":50}\'');
  }

  if (!baseUrl) {
    throw new Error('QLING_INTERNAL_BASE_URL is required.');
  }

  if (!secret) {
    throw new Error('INTERNAL_JOB_SECRET is required.');
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new Error('Internal job body must be valid JSON.');
  }

  const url = new URL(endpoint, baseUrl).toString();
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const parsed = parseInternalJobResponse(text);
  const result = {
    statusCode: response.status,
    endpoint,
    response: parsed,
  };

  if (!response.ok) {
    stderr.error(JSON.stringify(result, null, 2));
    throw new Error(`Internal job failed with HTTP ${response.status}`);
  }

  stdout.log(JSON.stringify(result, null, 2));
  return result;
}

function parseInternalJobResponse(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}
