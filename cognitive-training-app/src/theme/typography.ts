/** Minimum body text is 16 — never go smaller for anything the user must read. */
export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** Guarantees a >=44pt tap target even on a visually smaller control. */
export const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };
