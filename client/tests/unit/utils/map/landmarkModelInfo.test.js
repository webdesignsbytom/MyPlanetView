// @vitest-environment node
// What a landmark model's card says (src/utils/map/landmarkModelInfo.js): the landmark it's
// part of, its facts, and the links to read about it.
import { describe, expect, it } from 'vitest';
import { articleUrl, landmarkOfModel, metresWords, modelFactRows, partOfName, whereWords, wikipediaUrlFor } from '@/utils/map/landmarkModelInfo';
import { LANDMARK_MODELS } from '@/utils/map/landmarkModels';
import { LANDMARKS } from '@/dev/mock/data/landmarks';

const BIG_BEN = LANDMARK_MODELS.find((model) => model.id === 'big-ben');
const EIFFEL = LANDMARK_MODELS.find((model) => model.id === 'eiffel-tower');

describe('landmarkOfModel', () => {
  it('finds the landmark a model belongs to by its Wikidata item', () => {
    expect(landmarkOfModel(LANDMARKS, BIG_BEN).name).toBe('Westminster Palace and Abbey');
    expect(landmarkOfModel(LANDMARKS, EIFFEL).wikidataId).toBe('Q243');
  });

  it('finds none before the landmarks load, or for a model with no item', () => {
    expect(landmarkOfModel([], BIG_BEN)).toBeNull();
    expect(landmarkOfModel(null, BIG_BEN)).toBeNull();
    expect(landmarkOfModel(LANDMARKS, { name: 'Somewhere' })).toBeNull();
  });
});

describe('partOfName', () => {
  it('names the landmark when the model shows only part of it', () => {
    expect(partOfName(BIG_BEN, landmarkOfModel(LANDMARKS, BIG_BEN))).toBe('Westminster Palace and Abbey');
  });

  it('says nothing when the model is the whole landmark, or it isn’t known yet', () => {
    expect(partOfName({ name: 'Eiffel Tower' }, { name: 'Eiffel Tower' })).toBeNull();
    expect(partOfName(BIG_BEN, null)).toBeNull();
  });
});

describe('wikipediaUrlFor', () => {
  it('goes to the item’s English Wikipedia article through Wikidata', () => {
    expect(wikipediaUrlFor('Q10344038')).toBe('https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q10344038');
  });

  it('makes no link from anything that isn’t an item’s id', () => {
    expect(wikipediaUrlFor('')).toBeNull();
    expect(wikipediaUrlFor(null)).toBeNull();
    expect(wikipediaUrlFor('Q1/../../evil')).toBeNull();
    expect(wikipediaUrlFor('P31')).toBeNull();
  });
});

describe('articleUrl', () => {
  it('makes an English Wikipedia article’s address from its title', () => {
    expect(articleUrl('Big Ben')).toBe('https://en.wikipedia.org/wiki/Big_Ben');
    expect(articleUrl('Great Mosque of Djenné')).toBe('https://en.wikipedia.org/wiki/Great_Mosque_of_Djenn%C3%A9');
    expect(articleUrl('AC/DC?')).toBe('https://en.wikipedia.org/wiki/AC%2FDC%3F');
  });
});

describe('metresWords and whereWords', () => {
  it('give a length with feet, and a place with its country', () => {
    expect(metresWords(96)).toBe('96 m (315 ft)');
    expect(metresWords(5895)).toBe('5,895 m (19,341 ft)');
    expect(whereWords('Westminster', 'United Kingdom')).toBe('Westminster, United Kingdom');
    expect(whereWords(null, 'France')).toBe('France');
    expect(whereWords(null, null)).toBe('');
  });
});

describe('modelFactRows', () => {
  const landmark = { name: 'Westminster Palace and Abbey', isUnesco: true };

  it('lists where, when it dates from, height, architects and the World Heritage Site, in that order', () => {
    const facts = { built: '1859', height: 96, elevation: 20, architects: ['Augustus Pugin', 'Charles Barry'] };
    expect(modelFactRows({ facts, stateName: 'Westminster', countryName: 'United Kingdom', landmark })).toEqual([
      ['Where', 'Westminster, United Kingdom'],
      ['Dates from', '1859'],
      ['Height', '96 m (315 ft)'],
      ['Architects', 'Augustus Pugin, Charles Barry'],
      ['World Heritage', 'Westminster Palace and Abbey'],
    ]);
  });

  it('gives the elevation where there’s no height, one architect so named, and leaves out what isn’t known', () => {
    expect(modelFactRows({ facts: { elevation: 5895, architects: ['Nature'] }, countryName: 'Tanzania', landmark: null })).toEqual([
      ['Where', 'Tanzania'],
      ['Elevation', '5,895 m (19,341 ft)'],
      ['Architect', 'Nature'],
    ]);
    expect(modelFactRows({ facts: null, landmark: { name: 'Louvre', isUnesco: false } })).toEqual([]);
  });

  it('names the landmark a model is part of, unless the World Heritage row already does', () => {
    const lift = { name: 'The lift' };
    expect(modelFactRows({ model: lift, countryName: 'France', landmark: { name: 'Eiffel Tower', isUnesco: false } })).toEqual([
      ['Where', 'France'],
      ['Part of', 'Eiffel Tower'],
    ]);
    expect(modelFactRows({ model: lift, landmark: { name: 'Banks of the Seine', isUnesco: true } })).toEqual([['World Heritage', 'Banks of the Seine']]);
    expect(modelFactRows({ model: { name: 'Louvre' }, landmark: { name: 'Louvre', isUnesco: false } })).toEqual([]);
  });
});
