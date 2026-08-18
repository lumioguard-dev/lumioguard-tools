import { uiPreset } from '@lumioguard/ui/tailwind';
import type { Config } from 'tailwindcss';

// The shared package is in `content` too, or Tailwind never sees the classes
// its components use and every drawn surface renders unstyled.
const config: Config = {
  presets: [uiPreset],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
