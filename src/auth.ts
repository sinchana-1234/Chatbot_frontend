// src/auth.ts
//
// Single source of truth for the logged-in user's Cognito ID token.
//
// The parent Glixify app stores the ID token in localStorage after the user
// logs in. Because the chatbot is embedded on the same origin, it can read the
// exact same value. We read it fresh on every request (not once at import time)
// so that when Glixify refreshes the token, the chatbot automatically uses the
// new one — no manual re-pasting, no expiry surprises.
//
// The backend (auth/auth.py) specifically requires the *ID* token
// (token_use = "id", with custom:id and custom:roleId claims). The access token
// stored alongside it will NOT work.

/** localStorage key the Glixify app writes the Cognito ID token under. */
export const ID_TOKEN_STORAGE_KEY = "revival.user.idToken";

/** URL query param the host app can pass the ID token through, e.g. ?token=... */
export const ID_TOKEN_QUERY_PARAM = "token";

/**
 * Returns the current logged-in user's Cognito ID token, or null if there
 * isn't one (e.g. the app is opened outside a logged-in Glixify session).
 *
 * Lookup order:
 *  1. localStorage (same-origin embed in the real Glixify app).
 *  2. The `?token=` URL query param, e.g. when embedded cross-origin in an
 *     iframe and the host app passes the token that way instead.
 *  3. Dev-only fallback: VITE_DEV_ID_TOKEN from a gitignored .env.local file,
 *     for running the chatbot standalone (`npm run dev`) with neither of the
 *     above available. Never runs in production.
 */
export function getAuthToken(): string | null {
  const stored = localStorage.getItem(ID_TOKEN_STORAGE_KEY);
  if (stored) return stored;

  const fromQueryParam = new URLSearchParams(window.location.search).get(ID_TOKEN_QUERY_PARAM);
  if (fromQueryParam) return fromQueryParam;

  if (import.meta.env.DEV) {
    const devToken = import.meta.env.VITE_DEV_ID_TOKEN;
    if (devToken) return devToken;
  }

  return null;
}