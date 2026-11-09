/** Existing personal data is owned by this account until multi-user backfill runs. */
export const DEFAULT_DATA_OWNER_EMAIL = "hayyat.fiaz080@gmail.com";

export function dataOwnerEmail(): string {
  return process.env.DATA_OWNER_EMAIL?.trim().toLowerCase() || DEFAULT_DATA_OWNER_EMAIL;
}
