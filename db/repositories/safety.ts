/**
 * Blocks replace-all writes when the client never loaded the rows that exist in
 * the DB (stale localStorage / failed remote hydrate). That was the wipe that
 * erased courses on app load.
 */
export class StaleWriteError extends Error {
  readonly status = 409;

  constructor(
    readonly resource: string,
    readonly existingCount: number,
    readonly knownCount: number,
    readonly incomingCount: number,
  ) {
    super(
      `Refusing stale ${resource} write: db has ${existingCount}, client knew ${knownCount}, incoming ${incomingCount}`,
    );
    this.name = "StaleWriteError";
  }
}

export function assertFreshReplace(args: {
  resource: string;
  existingCount: number;
  /** How many rows the client loaded on hydrate / last successful sync. */
  knownCount: number;
  incomingCount: number;
}): void {
  const { resource, existingCount, knownCount, incomingCount } = args;
  if (existingCount <= 0) return;
  // Client never saw the full remote set — do not let it replace the DB.
  if (knownCount < existingCount) {
    throw new StaleWriteError(resource, existingCount, knownCount, incomingCount);
  }
}
