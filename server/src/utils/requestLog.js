// The request log (morgan, 'dev' format). Its `url` token is replaced, so every line,
// in any format, shows the redacted address: no share codes, invite or reset tokens,
// or query values (redactUrl.js).
import morgan from 'morgan';
import { redactUrl } from './redactUrl.js';

morgan.token('url', (req) => redactUrl(req.originalUrl || req.url));

export const requestLogger = morgan('dev');
