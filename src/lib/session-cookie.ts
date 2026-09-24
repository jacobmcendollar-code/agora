const AUTH_SESSION_COOKIE =
  /^(?:__Secure-|__Host-)?(?:authjs|next-auth)\.session-token(?:\.\d+)?$/;

export function isAuthSessionCookieName(name: string): boolean {
  return AUTH_SESSION_COOKIE.test(name);
}

/** True when the request carries an Auth.js session cookie. Does not validate it. */
export function hasAuthSessionCookie(request: {
  cookies: { getAll(): { name: string }[] };
}): boolean {
  return request.cookies.getAll().some((cookie) => isAuthSessionCookieName(cookie.name));
}
