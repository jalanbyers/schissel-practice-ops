export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * A draft that has already been decided cannot be decided again. Distinct from
 * NotFoundError so the API can answer 409 rather than 404 — the caller is not
 * guessing at a record's existence, they are racing another decision.
 */
export class AlreadyReviewedError extends Error {
  constructor(message = 'Already reviewed') {
    super(message);
    this.name = 'AlreadyReviewedError';
  }
}
