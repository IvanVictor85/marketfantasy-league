import createIntlMiddleware from 'next-intl/middleware';

export default createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en'],
 
  // Used when no locale matches
  defaultLocale: 'pt'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};