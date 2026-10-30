export type DataSource = "remote" | "local" | "local-fallback";

export type LoadResult<T> = {
  data: T;
  source: DataSource;
};

/** Remote is authoritative; local-fallback must never be written back to Turso. */
export function canPersistToRemote(source: DataSource): boolean {
  return source === "remote" || source === "local";
}
