import React, { useMemo, useState } from 'react';
// Constants
import { DEV_SELECT_LAB_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import Navbar from '@/components/nav/Navbar';
import { INPUT_SURFACE_CLASS } from '@/components/ui/TextInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import RichOptionSelect from '@/components/ui/RichOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
// Icons
import { FiCode, FiLayout, FiSearch, FiServer } from 'react-icons/fi';

// Dev-only tuner for the site's dropdowns. The controls set the same --select-* variables
// styles/select.css gives the real components, so every dropdown here is the real thing.
const SUPPORTED = typeof CSS !== 'undefined' && CSS.supports('appearance', 'base-select');

const COLOUR_FIELDS = [
  ['bg', '--select-bg', 'Box background'],
  ['text', '--select-text', 'Box text'],
  ['border', '--select-border', 'Border'],
  ['listBg', '--select-list-bg', 'List background'],
  ['listText', '--select-list-text', 'List text'],
  ['hoverBg', '--select-hover-bg', 'Hover background'],
  ['hoverText', '--select-hover-text', 'Hover text'],
  ['checkedBg', '--select-checked-bg', 'Selected background'],
  ['checkedText', '--select-checked-text', 'Selected text'],
  ['focus', '--select-focus', 'Focus outline'],
];

const SIZE_FIELDS = [
  ['radius', '--select-radius', 'Corner radius', 24],
  ['padding', '--select-padding', 'List padding', 16],
  ['gap', '--select-gap', 'Gap between box and list', 16],
];

const FADE = '0.18s';

const ARROWS = [
  { value: '▾', label: 'Small triangle ▾' },
  { value: '⌄', label: 'Chevron ⌄' },
  { value: '+', label: 'Plus +' },
  { value: '', label: 'None' },
];

const BASIC_OPTIONS = ['Web Design', 'Web Development', 'SEO', 'Hosting and Support', { value: 'Sold out', label: 'Sold out (disabled)', disabled: true }];

const RICH_OPTIONS = [
  { value: 'design', label: 'Web Design', description: 'Layouts, branding and page design', icon: FiLayout },
  { value: 'build', label: 'Web Development', description: 'Fast, accessible sites and web apps', icon: FiCode },
  { value: 'seo', label: 'SEO', description: 'Getting found on Google', icon: FiSearch },
  { value: 'hosting', label: 'Hosting and Support', description: 'Kept online, updated and backed up', icon: FiServer },
];

const REGION_GROUPS = [
  { label: 'UK and Ireland', options: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'] },
  { label: 'Europe', options: ['France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal'] },
  {
    label: 'Further afield',
    options: ['United States', 'Canada', 'Australia', 'New Zealand', 'Indonesia', { value: 'Antarctica', label: 'Antarctica (we don’t deliver)', disabled: true }],
  },
];

// #rgb, #rrggbb or rgb() as #rrggbb (colour inputs only take that)
const toHex = (value) => {
  const text = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(text)) return `#${[...text.slice(1)].map((c) => c + c).join('')}`.toLowerCase();
  const rgb = text.match(/\d+/g);
  return rgb ? `#${rgb.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : '#000000';
};

// The site's current defaults (in this light/dark mode), read from styles/select.css
const readDefaults = () => {
  const root = getComputedStyle(document.documentElement);
  const read = (name) => root.getPropertyValue(name).trim();
  return {
    ...Object.fromEntries(COLOUR_FIELDS.map(([key, name]) => [key, toHex(read(name))])),
    ...Object.fromEntries(SIZE_FIELDS.map(([key, name]) => [key, parseFloat(read(name)) || 0])),
    arrow: read('--select-arrow').replace(/^['"]|['"]$/g, ''),
    checkmark: read('--select-checkmark') !== 'none',
    animate: read('--select-fade') !== '0s',
  };
};

const toVars = (s) => ({
  ...Object.fromEntries(COLOUR_FIELDS.map(([key, name]) => [name, s[key]])),
  ...Object.fromEntries(SIZE_FIELDS.map(([key, name]) => [name, `${s[key]}px`])),
  '--select-arrow': `'${s.arrow}'`,
  '--select-checkmark': s.checkmark ? 'inline' : 'none',
  '--select-fade': s.animate ? FADE : '0s',
});

// WCAG contrast ratio of two #rrggbb colours
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

function ContrastBadge({ label, text, background }) {
  const ratio = contrast(text, background);
  const passes = ratio >= 4.5;
  return (
    <li className='flex items-center justify-between gap-2'>
      <span>{label}</span>
      <span className={`rounded px-2 py-0.5 font-semibold ${passes ? 'bg-status-good/20' : 'bg-status-critical/20'}`}>
        {ratio.toFixed(1)}:1 {passes ? 'pass' : 'below 4.5'}
      </span>
    </li>
  );
}

function SelectLabPage() {
  const pageHelmet = helmetData[DEV_SELECT_LAB_PAGE_URL];
  const [defaults] = useState(readDefaults);
  const [settings, setSettings] = useState(defaults);
  const [basic, setBasic] = useState('Web Design');
  const [rich, setRich] = useState(RICH_OPTIONS[0].value);
  const [region, setRegion] = useState('England');
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => {
    const { type, checked, value } = e.target;
    setSettings((prev) => ({ ...prev, [key]: type === 'checkbox' ? checked : type === 'range' ? Number(value) : value }));
    setCopied(false);
  };

  const vars = toVars(settings);
  const css = useMemo(
    () => `/* Fixed colours: they replace the light/dark-mode defaults at the top of src/styles/select.css */
:root {
${Object.entries(toVars(settings))
  .map(([name, value]) => `  ${name}: ${value};`)
  .join('\n')}
}
`,
    [settings],
  );

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        canonicalPath={DEV_SELECT_LAB_PAGE_URL}
      />

      <div className='grid min-h-screen grid-rows-reg font-main'>
        <Navbar />

        <main
          id='main-content'
          tabIndex={-1}
          role='main'
          aria-labelledby='select-lab-heading'
          className='grid content-start gap-8 px-6 py-10 md:px-12 lg:px-20'
          style={vars}
        >
          <header className='grid gap-2'>
            <h1 id='select-lab-heading' className='text-3xl font-bold'>
              Dropdown lab
            </h1>
            <p>
              Dev server only. Tunes the site&apos;s dropdowns (<code>PlainOptionSelect</code>, <code>RichOptionSelect</code>,{' '}
              <code>GroupedOptionSelect</code>), starting from today&apos;s defaults in <code>styles/select.css</code>. Phones always
              show their own picker.
            </p>
            <p
              role='status'
              className={`w-fit rounded px-3 py-2 font-semibold ${SUPPORTED ? 'bg-status-good/20' : 'bg-status-critical/20'}`}
            >
              {SUPPORTED
                ? 'This browser supports customizable select: the dropdowns below are fully styled.'
                : 'This browser doesn’t support customizable select yet: the dropdowns fall back to the normal list. Try Chrome or Edge.'}
            </p>
          </header>

          <div className='grid gap-8 lg:grid-cols-[20rem_1fr]'>
            {/* Controls */}
            <section aria-labelledby='lab-controls-heading' className='grid content-start gap-4 rounded-lg border border-colour3 p-5'>
              <h2 id='lab-controls-heading' className='text-xl font-semibold'>
                Controls
              </h2>

              <fieldset className='grid gap-2'>
                <legend className='mb-2 font-semibold'>Colours</legend>
                {COLOUR_FIELDS.map(([key, , label]) => (
                  <label key={key} className='flex items-center justify-between gap-3 text-sm'>
                    {label}
                    <input type='color' value={settings[key]} onChange={set(key)} className='h-8 w-14 cursor-pointer' />
                  </label>
                ))}
              </fieldset>

              <fieldset className='grid gap-3'>
                <legend className='mb-2 font-semibold'>Shape</legend>
                {SIZE_FIELDS.map(([key, , label, max]) => (
                  <label key={key} className='grid gap-1 text-sm'>
                    {label}: {settings[key]}px
                    <input type='range' className='accent-colour6' min='0' max={max} value={settings[key]} onChange={set(key)} />
                  </label>
                ))}
                <label htmlFor='lab-arrow' className='text-sm'>
                  Arrow
                </label>
                <PlainOptionSelect id='lab-arrow' value={settings.arrow} onChange={set('arrow')} options={ARROWS} />
                <label className='flex items-center gap-2 text-sm'>
                  <input type='checkbox' className='rounded text-colour6 focus:ring-colour6' checked={settings.checkmark} onChange={set('checkmark')} />
                  Tick next to the selected option
                </label>
                <label className='flex items-center gap-2 text-sm'>
                  <input type='checkbox' className='rounded text-colour6 focus:ring-colour6' checked={settings.animate} onChange={set('animate')} />
                  Fade in when it opens
                </label>
              </fieldset>

              <section aria-labelledby='lab-contrast-heading' className='grid gap-2 text-sm'>
                <h3 id='lab-contrast-heading' className='font-semibold'>
                  Contrast (text needs 4.5:1)
                </h3>
                <ul className='grid gap-1'>
                  <ContrastBadge label='Box' text={settings.text} background={settings.bg} />
                  <ContrastBadge label='List' text={settings.listText} background={settings.listBg} />
                  <ContrastBadge label='Hover' text={settings.hoverText} background={settings.hoverBg} />
                  <ContrastBadge label='Selected' text={settings.checkedText} background={settings.checkedBg} />
                </ul>
              </section>

              <button
                type='button'
                onClick={() => setSettings(defaults)}
                className='w-fit rounded border-2 border-colour6 px-4 py-2 font-semibold hover:bg-colour6 hover:text-colour1'
              >
                Reset to the site defaults
              </button>
            </section>

            {/* The components */}
            <section aria-labelledby='lab-trials-heading' className='grid content-start gap-6'>
              <h2 id='lab-trials-heading' className='text-xl font-semibold'>
                Components
              </h2>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='grid content-start gap-2'>
                  <label htmlFor='lab-native' className='font-semibold'>
                    Browser default (for comparison)
                  </label>
                  <select id='lab-native' className={INPUT_SURFACE_CLASS} value={basic} onChange={(e) => setBasic(e.target.value)}>
                    {BASIC_OPTIONS.filter((option) => typeof option === 'string').map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className='text-sm'>A plain select: its open list, hover colour and corners come from the operating system.</p>
                </div>

                <div className='grid content-start gap-2'>
                  <label htmlFor='lab-plain' className='font-semibold'>
                    PlainOptionSelect
                  </label>
                  <PlainOptionSelect id='lab-plain' value={basic} onChange={(e) => setBasic(e.target.value)} options={BASIC_OPTIONS} />
                  <p className='text-sm'>Chosen: {basic}</p>
                </div>

                <div className='grid content-start gap-2'>
                  <label htmlFor='lab-rich' className='font-semibold'>
                    RichOptionSelect
                  </label>
                  <RichOptionSelect id='lab-rich' value={rich} onChange={(e) => setRich(e.target.value)} options={RICH_OPTIONS} />
                  <p className='text-sm'>Chosen: {rich}. The closed box shows the icon and title only.</p>
                </div>

                <div className='grid content-start gap-2'>
                  <label htmlFor='lab-grouped' className='font-semibold'>
                    GroupedOptionSelect
                  </label>
                  <GroupedOptionSelect id='lab-grouped' value={region} onChange={(e) => setRegion(e.target.value)} groups={REGION_GROUPS} />
                  <p className='text-sm'>Chosen: {region}. The list scrolls past 20rem.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Generated CSS */}
          <section aria-labelledby='lab-css-heading' className='grid gap-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h2 id='lab-css-heading' className='text-xl font-semibold'>
                CSS for these settings
              </h2>
              <button
                type='button'
                onClick={copyCss}
                className='rounded bg-colour6 px-4 py-2 font-semibold text-colour1 hover:brightness-110'
              >
                {copied ? 'Copied' : 'Copy CSS'}
              </button>
            </div>
            <p className='text-sm'>
              Paste it over the <code>:root</code> block at the top of <code>src/styles/select.css</code> and every dropdown on the
              site uses it. Fixed colours stop following light and dark mode, so keep the defaults&apos; <code>var(...)</code> colours
              where you want that.
            </p>
            <pre className='overflow-x-auto rounded-lg bg-colour2 p-4 text-sm text-colour3'>
              <code>{css}</code>
            </pre>
          </section>
        </main>
      </div>
    </>
  );
}

export default SelectLabPage;
