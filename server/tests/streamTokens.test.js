import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  readUploadTicket,
  signStreamToken,
  signUploadTicket,
  streamUrls,
  verifyStreamWebhook,
  videoStateFrom,
} from '../src/utils/streamTokens.js';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pemBase64 = Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64');

describe('Stream playback tokens', () => {
  it('are RS256 JWTs for one video, checkable with the signing key', () => {
    const expiresAt = new Date('2027-01-01T02:00:00Z');
    const token = signStreamToken({ uid: 'abc123', keyId: 'key-1', pemBase64, expiresAt });
    const [header, payload, signature] = token.split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url'))).toEqual({ alg: 'RS256', kid: 'key-1' });
    expect(JSON.parse(Buffer.from(payload, 'base64url'))).toEqual({ sub: 'abc123', kid: 'key-1', exp: expiresAt.getTime() / 1000 });
    const ok = crypto.createVerify('RSA-SHA256').update(`${header}.${payload}`).verify(publicKey, Buffer.from(signature, 'base64url'));
    expect(ok).toBe(true);
    const urls = streamUrls({ customerCode: 'abc', token });
    expect(urls.hls).toBe(`https://customer-abc.cloudflarestream.com/${token}/manifest/video.m3u8`);
    expect(urls.thumbnail(400)).toBe(`https://customer-abc.cloudflarestream.com/${token}/thumbnails/thumbnail.jpg?time=1s&height=400`);
  });
});

describe('Stream webhooks', () => {
  const secret = 'shh';
  const sign = (body, time) => `time=${time},sig1=${crypto.createHmac('sha256', secret).update(`${time}.${body}`).digest('hex')}`;
  const now = 1_800_000_000_000;

  it('take a fresh notice with the right signature only', () => {
    const body = '{"uid":"a"}';
    const time = now / 1000;
    expect(verifyStreamWebhook({ header: sign(body, time), body, secret, now })).toBe(true);
    expect(verifyStreamWebhook({ header: sign(body, time), body: '{"uid":"b"}', secret, now })).toBe(false);
    expect(verifyStreamWebhook({ header: sign(body, time - 600), body, secret, now })).toBe(false);
    expect(verifyStreamWebhook({ header: 'nonsense', body, secret, now })).toBe(false);
    expect(verifyStreamWebhook({ header: sign(body, time), body, secret: '', now })).toBe(false);
  });

  it('give a video’s state', () => {
    expect(videoStateFrom({ readyToStream: true })).toBe('READY');
    expect(videoStateFrom({ status: { state: 'ready' } })).toBe('READY');
    expect(videoStateFrom({ status: { state: 'error' } })).toBe('FAILED');
    expect(videoStateFrom({ status: { state: 'inprogress' } })).toBe('PROCESSING');
  });
});

describe('upload tickets', () => {
  const secret = 'ticket-secret';
  const fields = { photoId: 'p', uid: 'u', mapId: 'm', userId: 's' };

  it('come back as written until they expire, and never when changed', () => {
    const ticket = signUploadTicket(fields, { secret, expiresAt: new Date(2_000_000_000_000) });
    expect(readUploadTicket(ticket, { secret, now: 1_900_000_000_000 })).toMatchObject(fields);
    expect(readUploadTicket(ticket, { secret, now: 2_100_000_000_000 })).toBeNull();
    expect(readUploadTicket(ticket, { secret: 'other', now: 1_900_000_000_000 })).toBeNull();
    const [payload, mac] = ticket.split('.');
    const forged = Buffer.from(JSON.stringify({ ...fields, mapId: 'other', exp: 2_000_000_000_000 })).toString('base64url');
    expect(readUploadTicket(`${forged}.${mac}`, { secret, now: 1_900_000_000_000 })).toBeNull();
    expect(readUploadTicket(`${payload}`, { secret })).toBeNull();
  });
});
