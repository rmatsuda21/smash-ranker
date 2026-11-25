// The id one of our `api/*` functions gave a request (`withLogging` sets
// `x-request-id`; Vercel's own `x-vercel-id` is the same value and is also
// there when the function never ran). Logged as `request_id` with a failed
// call, it is the tag that finds the function's log line and Sentry event.
export const requestIdOf = (response: Response): string | undefined =>
  response.headers.get("x-request-id") ??
  response.headers.get("x-vercel-id") ??
  undefined;
