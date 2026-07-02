import 'server-only';

import { cookies } from 'next/headers';
import { LANG_COOKIE, getDict, type Dict, type Lang } from '@/lib/i18n';

/** Reads the visitor's language preference from the cookie (default: en). */
export function getLang(): Lang {
  const value = cookies().get(LANG_COOKIE)?.value;
  return value === 'tl' ? 'tl' : 'en';
}

export function getServerDict(): { lang: Lang; d: Dict } {
  const lang = getLang();
  return { lang, d: getDict(lang) };
}
