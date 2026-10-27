import { describe, it, expect } from 'vitest';
import * as lucide from 'lucide-react';
import { CATEGORY_STYLES, NEUTRAL_CATEGORY_STYLE } from '../../lib/constants';
import { CATEGORY_ICONS } from './categoryIcons';

describe('CATEGORY_ICONS', () => {
  // A name CATEGORY_STYLES uses but the map lacks would quietly render the
  // fallback clipboard instead of the category's own icon.
  it.each(Object.entries({ ...CATEGORY_STYLES, Neutral: NEUTRAL_CATEGORY_STYLE }))(
    'has the icon %s is styled with',
    (_, style) => {
      expect(CATEGORY_ICONS[style.icon]).toBe(lucide[style.icon]);
    },
  );
});
