import { isThemeId, THEME_IDS, THEMES } from './theme-registry';

describe('theme registry', () => {
  it('exposes the complete eight-theme collection in picker order', () => {
    expect(THEME_IDS).toEqual([
      'bare',
      'mushroom',
      'occult',
      'star-wars',
      'warhammer',
      'pinkie',
      'emo',
      'spooky-gay',
    ]);
    expect(THEMES.map((theme) => theme.id)).toEqual(THEME_IDS);
  });

  it('has unique IDs and complete preview metadata', () => {
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length);

    for (const theme of THEMES) {
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(theme.icon.length).toBeGreaterThan(0);
      expect(theme.swatches).toHaveLength(3);
    }
  });

  it('rejects themes removed from the previous collection', () => {
    expect(isThemeId('bare')).toBe(true);
    expect(isThemeId('mushroom')).toBe(true);
    expect(isThemeId('celestial')).toBe(false);
    expect(isThemeId('aurora')).toBe(false);
    expect(isThemeId('')).toBe(false);
  });
});
