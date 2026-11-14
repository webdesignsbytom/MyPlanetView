import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Server constants
import { BusinessName, BusinessUrl } from '../src/utils/constants/siteConstants.js';

const clientConstants = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../client/src/utils/constants/constants.js'
);

const clientConstant = (name) =>
  fs.readFileSync(clientConstants, 'utf8').match(new RegExp(`${name} = '([^']+)'`))?.[1];

describe('site identity', () => {
  it.skipIf(!fs.existsSync(clientConstants))('URL matches the client FULL_BUSINESS_URL', () => {
    expect(`https://${BusinessUrl}`).toBe(clientConstant('FULL_BUSINESS_URL'));
  });

  it.skipIf(!fs.existsSync(clientConstants))('name matches the client CompanyName', () => {
    expect(BusinessName).toBe(clientConstant('CompanyName'));
  });
});
