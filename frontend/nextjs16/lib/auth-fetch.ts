// Client-side fetch wrapper for authenticated calls. The access token
// expires after ~15 minutes; on a 401 this tries one silent refresh (via the
// refresh cookie) and retries the request once. If the refresh also fails,
// the session is gone, so we hard-redirect to /login.
export default async function authFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshResponse = await fetch("/api/auth/refresh", { method: "POST" });

  if (!refreshResponse.ok) {
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return fetch(input, init);
}
