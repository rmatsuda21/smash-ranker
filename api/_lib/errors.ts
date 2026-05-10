import type { VercelResponse } from "@vercel/node";

export class BadRequestError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const respondClientError = (
  res: VercelResponse,
  err: unknown,
): boolean => {
  if (err instanceof BadRequestError || err instanceof ForbiddenError) {
    res.status(err.status).json({ error: err.message });
    return true;
  }
  return false;
};
