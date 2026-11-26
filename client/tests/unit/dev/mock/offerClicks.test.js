import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installOfferClickInterceptor } from '@/dev/mock/offerClicks';
import { exampleOfferId } from '@/dev/mock/seed';
import { db, freshStore } from './mockApi';

beforeAll(() => installOfferClickInterceptor());
let open;
beforeEach(() => {
  freshStore();
  open = vi.fn();
  vi.stubGlobal('open', open);
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

function link(href, rel = 'sponsored noopener') {
  const a = document.createElement('a');
  a.href = href;
  a.rel = rel;
  a.innerHTML = '<span>Ad</span>';
  document.body.appendChild(a);
  return a;
}
const clicks = (placement) => db().offerClicks.filter((r) => r.offerId === exampleOfferId(0) && r.placement === placement).reduce((n, r) => n + r.count, 0);

describe('offer link clicks in mock mode', () => {
  it('counts a sponsored /go/ link’s click and opens the filled-in partner link in a new tab', () => {
    const before = clicks('TRAVEL_DESK');
    const a = link(`https://api.example.test/go/${exampleOfferId(0)}?p=TRAVEL_DESK&country=ES`);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.querySelector('span').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledWith(expect.stringContaining('country=ES'), '_blank', 'noopener,noreferrer');
    expect(clicks('TRAVEL_DESK')).toBe(before + 1);
    expect(JSON.parse(localStorage.getItem('mpvMockStore.v7')).offerClicks).toEqual(db().offerClicks);
  });

  it('takes a middle-button click, but not another button’s', () => {
    const a = link(`/go/${exampleOfferId(0)}?p=GALLERY`);
    a.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 2 }));
    expect(open).not.toHaveBeenCalled();
    a.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('leaves links that aren’t sponsored, or don’t go to /go/:id, alone', () => {
    const plain = link(`/go/${exampleOfferId(0)}`, 'noopener');
    const other = link('/countries/spain');
    // jsdom can't navigate: stop the link once the interceptor has had its look
    const stop = (event) => event.preventDefault();
    for (const a of [plain, other]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      a.addEventListener('click', (e) => expect(e.defaultPrevented).toBe(false));
      a.addEventListener('click', stop);
      a.dispatchEvent(event);
    }
    expect(open).not.toHaveBeenCalled();
  });

  it('opens nothing for an offer that doesn’t exist, and says why', () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link('/go/no-such-offer').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(open).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('404'));
  });
});
