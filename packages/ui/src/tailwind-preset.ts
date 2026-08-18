import { designTokensPlugin } from '@lumioguard/design-tokens/tailwind';
import type { Config } from 'tailwindcss';

/**
 * Content globs stay with each app — they know their own files, and must also
 * point at this package or Tailwind never sees the classes its components use.
 */
export const uiPreset: Omit<Config, 'content'> = {
  plugins: [designTokensPlugin],
};
