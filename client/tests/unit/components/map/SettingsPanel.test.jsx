import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettingsPanel from '@/components/map/SettingsPanel';
import { saveMapSetup } from '@/utils/map/saveMapSetup';
import { DEFAULT_MAP_SETTINGS } from '@/utils/map/mapSettings';

vi.mock('@/utils/map/saveMapSetup', () => ({ saveMapSetup: vi.fn() }));
// "This map"'s sections have tests of their own: stand-ins that say they're there
const { section } = vi.hoisted(() => ({
  section: (name) => ({ default: (props) => <div data-section={name} data-locked={String(Boolean(props.locked))} /> }),
}));
vi.mock('@/components/map/MapHomeSection', () => section('home'));
vi.mock('@/components/map/MapDownloadSection', () => section('download'));
vi.mock('@/components/map/MapImportSection', () => section('import'));
vi.mock('@/components/map/MapUpgradeSection', () => section('upgrade'));
vi.mock('@/components/map/MainMapSection', () => section('main'));
vi.mock('@/components/map/DeleteMapSection', () => section('delete'));
vi.mock('@/components/travelCopies/TravelCopySection', () => section('copies'));
vi.mock('@/components/map/design/MapDesignSection', () => ({ default: ({ styleId }) => <div data-section='design' data-style={styleId} /> }));
vi.mock('@/components/onboarding/MapSetupForm', () => ({
  default: ({ onSubmit, canRename, submitLabel }) => (
    <button type='button' data-section='setup' data-can-rename={String(canRename)} onClick={() => onSubmit({ name: 'New name' })}>
      {submitLabel}
    </button>
  ),
}));

const MAP = { id: 'map-1', name: 'Our trips', groupType: 'COUPLE', isDefault: false, travellers: [{ id: 't1', name: 'Charlie' }] };
const open = (props = {}) => {
  const onChangeSetting = vi.fn();
  const result = render(
    <SettingsPanel settings={DEFAULT_MAP_SETTINGS} onChangeSetting={onChangeSetting} map={MAP} canEdit isOwner onMapSaved={vi.fn()} onClose={() => {}} {...props} />,
  );
  const sections = () => [...result.container.querySelectorAll('[data-section]')].filter((el) => !el.closest('[hidden]')).map((el) => el.getAttribute('data-section'));
  return { ...result, onChangeSetting, sections };
};

describe('SettingsPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is the roomy panel, with the looks first', () => {
    const { sections } = open();
    expect(document.querySelector('[data-map-panel]').getAttribute('class')).toContain('nophone:w-[37.5rem]');
    expect(screen.getByText('Map style')).toBeTruthy();
    expect(screen.getByText('Map type')).toBeTruthy();
    expect(screen.getByText('Landmark pins')).toBeTruthy();
    expect(sections()).toEqual([]);
  });

  it('has no tabs for a viewer, or without a map', () => {
    const { container } = open({ canEdit: false });
    expect(container.querySelector('[role="tablist"]')).toBeNull();
    const { container: noMap } = open({ map: null, canEdit: true });
    expect(noMap.querySelector('[role="tablist"]')).toBeNull();
  });

  it('gives an editor two tabs, following the ARIA tabs pattern', () => {
    const { container } = open();
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.textContent)).toEqual(['How it looks', 'This map']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    const panel = document.getElementById(tabs[0].getAttribute('aria-controls'));
    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabs[1]);
    expect(panel.hidden).toBe(true);
    fireEvent.keyDown(tabs[1], { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[0], { key: 'End' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('shows the owner every section of "This map"', () => {
    const { sections } = open();
    fireEvent.click(screen.getByText('This map'));
    expect(sections()).toEqual(['setup', 'home', 'download', 'import', 'copies', 'upgrade', 'main', 'delete']);
  });

  it('gives an editor the travellers, downloads and imports only', () => {
    const { sections, container } = open({ isOwner: false, canManage: false });
    fireEvent.click(screen.getByText('This map'));
    expect(sections()).toEqual(['setup', 'download', 'import']);
    expect(container.querySelector('[data-section="setup"]').getAttribute('data-can-rename')).toBe('false');
  });

  it('gives a co-owner the map’s home and copies, never its plan or deletion', () => {
    const { sections } = open({ isOwner: false, canManage: true });
    fireEvent.click(screen.getByText('This map'));
    expect(sections()).toEqual(['setup', 'home', 'download', 'import', 'copies']);
  });

  it('keeps the main map out of upgrading, making main and deleting', () => {
    const { sections } = open({ map: { ...MAP, isDefault: true } });
    fireEvent.click(screen.getByText('This map'));
    expect(sections()).not.toContain('delete');
    expect(sections()).not.toContain('main');
    expect(sections()).not.toContain('upgrade');
  });

  it('saves the map’s set-up, then refreshes it', async () => {
    saveMapSetup.mockResolvedValue();
    const onMapSaved = vi.fn();
    open({ onMapSaved });
    fireEvent.click(screen.getByText('This map'));
    fireEvent.click(screen.getByText('Save map'));
    await waitFor(() => expect(onMapSaved).toHaveBeenCalled());
    expect(saveMapSetup).toHaveBeenCalledWith('map-1', expect.objectContaining({ id: 'map-1' }), { name: 'New name' }, { canRename: true });
  });

  it('passes the lock for an unverified address to the owner’s sections', () => {
    const { container } = open({ locked: true });
    fireEvent.click(screen.getByText('This map'));
    expect(container.querySelector('[data-section="delete"]').getAttribute('data-locked')).toBe('true');
  });

  it('puts the design of the map’s style under the style for the owner and co-owners', () => {
    const { container } = open({ onDesignChange: vi.fn(), mapStyle: 'starry' });
    const design = container.querySelector('[data-section="design"]');
    expect(design.getAttribute('data-style')).toBe('starry');
    // After the map style, before the map type (23 Nov 2026, the user's wish)
    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(screen.getByText('Map style'), design)).toBe(true);
    expect(follows(design, screen.getByText('Map type'))).toBe(true);
    const { container: editor } = open({ onDesignChange: vi.fn(), canManage: false, isOwner: false });
    expect(editor.querySelector('[data-section="design"]')).toBeNull();
  });

  it('sets the map’s style for everyone when the viewer can, saying so', () => {
    const onMapStyleChange = vi.fn();
    open({ mapStyle: 'old-map', onMapStyleChange });
    expect(screen.getByText('Everyone who opens this map sees it in this style, people you share it with too.')).toBeTruthy();
    expect(screen.getByLabelText('Old map').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('Starry night'));
    expect(onMapStyleChange).toHaveBeenCalledWith('starry');
  });

  it('keeps someone else’s choice of style for their own maps, saying so', () => {
    const { onChangeSetting } = open({ mapStyle: 'old-map', canEdit: false });
    expect(screen.getByText(/shown in the style its owner chose/)).toBeTruthy();
    // Their own style is the one ticked
    expect(screen.getByLabelText('World map').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('Starry night'));
    expect(onChangeSetting).toHaveBeenCalledWith('style', 'starry');
  });

  it('changes the viewer’s own settings', () => {
    const { onChangeSetting, container } = open();
    fireEvent.click(screen.getByLabelText(/Detailed/));
    fireEvent.click(screen.getByLabelText('Always, at every zoom'));
    fireEvent.click(container.querySelector('#setting-showMoments'));
    expect(onChangeSetting.mock.calls).toEqual([
      ['mapType', 'detailed'],
      ['landmarkPins', 'always'],
      ['showMoments', false],
    ]);
  });

  // 24 Nov 2026, the user's wish: "Americans in miles always", and a choice
  it('chooses how distances are written, automatic to start with', () => {
    const { onChangeSetting } = open();
    expect(screen.getByText('Distances')).toBeTruthy();
    expect(screen.getByLabelText('Miles for a map whose home is in the United States, else kilometres').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('Always miles'));
    expect(onChangeSetting).toHaveBeenCalledWith('distanceUnit', 'miles');
    const { container } = open({ settings: { ...DEFAULT_MAP_SETTINGS, distanceUnit: 'km' } });
    expect(container.querySelector('#distance-unit-km').checked).toBe(true);
  });

  // The supporter badge (24 Nov 2026, the user's wish): a paying owner's, on unless turned off
  describe('the supporter badge', () => {
    const PAID = { ...MAP, supporter: { plan: 'PREMIUM', name: 'First Class', shown: true } };

    it('shows a paying owner their badge, on, with its switch', () => {
      const { container, onChangeSetting } = open({ map: PAID });
      const section = container.querySelector('[data-supporter-settings]');
      expect(section.querySelector('legend').textContent).toBe('Your supporter badge');
      // The badge as it looks, not a link here
      const badge = section.querySelector('[data-supporter-badge]');
      expect(badge.getAttribute('data-supporter-badge')).toBe('PREMIUM');
      expect(badge.tagName).toBe('SPAN');
      expect(badge.textContent).toContain('First Class member');
      const box = screen.getByLabelText('Show my First Class badge');
      expect(box.checked).toBe(true);
      expect(document.getElementById(box.getAttribute('aria-describedby')).textContent).toMatch(/every map you own/);
      fireEvent.click(box);
      expect(onChangeSetting).toHaveBeenCalledWith('showSupporterBadge', false);
    });

    it('shows the switch off once it’s turned off', () => {
      open({ map: PAID, settings: { ...DEFAULT_MAP_SETTINGS, showSupporterBadge: false } });
      expect(screen.getByLabelText('Show my First Class badge').checked).toBe(false);
    });

    it('isn’t there for an owner on Economy, or for anyone but the owner', () => {
      const { container } = open();
      expect(container.querySelector('[data-supporter-settings]')).toBeNull();
      const { container: coOwner } = open({ map: PAID, isOwner: false, canManage: true });
      expect(coOwner.querySelector('[data-supporter-settings]')).toBeNull();
    });
  });
});
