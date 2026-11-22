// @vitest-environment node
// A country's note (src/utils/map/visitNotes.js): cleaned and cut as the server keeps it.
import { describe, expect, it } from 'vitest';
import { NOTES_MAX, cleanNote } from '@/utils/map/visitNotes';
import { NOTES_MAX as SERVER_NOTES_MAX } from '../../../../../server/src/utils/travelValidation.js';

describe('cleanNote', () => {
  it('keeps the server’s limit', () => {
    expect(NOTES_MAX).toBe(1000);
    expect(NOTES_MAX).toBe(SERVER_NOTES_MAX);
  });

  it('keeps a plain note as it is, trimmed', () => {
    expect(cleanNote('  Cherry blossom is in early April ')).toBe('Cherry blossom is in early April');
  });

  it('keeps line breaks and tabs inside the note', () => {
    expect(cleanNote('Kyoto\nNara\tOsaka')).toBe('Kyoto\nNara\tOsaka');
  });

  it('takes out tags and control characters', () => {
    expect(cleanNote('<b>Go</b> in May<script>x</script>')).toBe('Go in Mayx');
    expect(cleanNote('Snow\u0000 in\u0007 winter')).toBe('Snow in winter');
  });

  it('cuts a long note to 1,000 characters', () => {
    expect(cleanNote('a'.repeat(1200))).toHaveLength(1000);
  });

  it('is null when nothing is left', () => {
    expect(cleanNote('')).toBeNull();
    expect(cleanNote('   ')).toBeNull();
    expect(cleanNote('<br>')).toBeNull();
    expect(cleanNote(null)).toBeNull();
    expect(cleanNote(undefined)).toBeNull();
  });
});
