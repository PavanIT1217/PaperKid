// Country setting: picks local picture words, currency, date style and default paper.
export type CountryCode = 'intl' | 'US' | 'GB' | 'IN' | 'CA' | 'AU' | 'EU';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  /** used for dates, e.g. "Monday, 12 October 2026" vs "Monday, October 12, 2026" */
  locale: string;
  currency: string;
  paper: 'A4' | 'Letter';
  /** picture-word set for the alphabet */
  words: 'classic' | 'IN';
}

export const COUNTRIES: Country[] = [
  { code: 'intl', name: 'International', flag: '🌍', locale: 'en-GB', currency: 'USD', paper: 'A4', words: 'classic' },
  { code: 'US', name: 'United States', flag: '🇺🇸', locale: 'en-US', currency: 'USD', paper: 'Letter', words: 'classic' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', locale: 'en-GB', currency: 'GBP', paper: 'A4', words: 'classic' },
  { code: 'IN', name: 'India', flag: '🇮🇳', locale: 'en-IN', currency: 'INR', paper: 'A4', words: 'IN' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', locale: 'en-CA', currency: 'CAD', paper: 'Letter', words: 'classic' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', locale: 'en-AU', currency: 'AUD', paper: 'A4', words: 'classic' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺', locale: 'en-IE', currency: 'EUR', paper: 'A4', words: 'classic' },
];

export function countryOf(code: string | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Best guess from the browser language (en-US → US, hi-IN → IN, de-DE → EU…). */
export function guessCountry(): CountryCode {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      const region = l.split('-')[1]?.toUpperCase();
      if (!region) continue;
      if (['US', 'GB', 'IN', 'CA', 'AU'].includes(region)) return region as CountryCode;
      if (['IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'FI', 'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'MT', 'CY', 'HR'].includes(region)) return 'EU';
    }
  } catch {
    /* ignore */
  }
  return 'intl';
}
