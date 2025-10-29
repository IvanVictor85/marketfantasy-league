import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en'],
 
  // Used when no locale matches
  defaultLocale: 'pt',
  
  // Always use the default locale for root path
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};