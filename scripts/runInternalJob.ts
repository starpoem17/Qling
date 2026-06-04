import 'dotenv/config';
import { runInternalJob } from '../src/server/internalJobRunner';

const [endpoint, rawBody = '{}'] = process.argv.slice(2);

await runInternalJob({
  endpoint,
  rawBody,
  baseUrl: process.env.QLING_INTERNAL_BASE_URL,
  secret: process.env.INTERNAL_JOB_SECRET,
});
