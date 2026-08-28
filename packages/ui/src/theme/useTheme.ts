import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  type ThemeName,
} from '@lumioguard/design-tokens';
import { useCallback, useEffect, useState } from 'react';

function isTheme(value: string | null): value is ThemeName {
  return value === 'light' || value === 'dark';
}

/** What the pre-paint script in index.html already put on the document. */
function currentTheme(): ThemeName {
  const attribute = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  return isTheme(attribute) ? attribute : DEFAULT_THEME;
}

/**
 * The operating system is deliberately NOT consulted: this opens light for everyone,
 * so a dark desktop does not silently change what the product looks like on sight.
 */
export function useTheme(): {
  readonly theme: ThemeName;
  readonly toggle: () => void;
} {
  const [theme, setTheme] = useState<ThemeName>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // private mode or storage disabled: the choice holds for this visit only
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
