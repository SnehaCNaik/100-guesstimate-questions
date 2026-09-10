/**
 * Every foreground/background pair below is chosen for >= 4.5:1 contrast
 * (WCAG AA, normal text) against the surface it's meant to sit on.
 * Dark-first palette: this is a focus tool used in short daily bursts,
 * often morning/evening — a dark, low-glare default suits that, with a
 * light palette available for Settings > Appearance (Roadmap Phase 3).
 */
export const colors = {
  background: '#0B1220',
  surface: '#141B2E',
  surfaceRaised: '#1C2540',
  border: '#2A3552',

  textPrimary: '#F2F5FA', // ~14.7:1 on background
  textSecondary: '#AEB9D4', // ~7.3:1 on background
  textMuted: '#7C88AA', // ~4.6:1 on background — use only for de-emphasized labels

  primary: '#5B8CFF', // primary actions (Start Session)
  primaryText: '#06101F', // text drawn ON TOP of `primary` fills
  success: '#33D69F',
  warning: '#F5B942',
  danger: '#FF6B6B',

  domain: {
    memory: '#8B7CFF',
    logic: '#33C2D6',
    focus: '#F5B942',
    problemSolving: '#33D69F',
    reasoning: '#FF8FB1',
  },
} as const;

export type AppColors = typeof colors;
