/**
 * Split a single picker value into app DB user UUID vs Nimble UserID string (non-UUID).
 * Mirrors stock receipt `received_by` / `nimble_received_by_user_id` behavior.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLikeString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return UUID_REGEX.test(value.trim());
}

export function normalizeAppUserUuidOrNimbleUserId(rawValue: unknown): {
  appUserUuid: string | null;
  nimbleUserId: string | null;
} {
  if (rawValue === null || rawValue === undefined) {
    return { appUserUuid: null, nimbleUserId: null };
  }
  const value = String(rawValue).trim();
  if (!value) {
    return { appUserUuid: null, nimbleUserId: null };
  }
  if (isUuidLikeString(value)) {
    return { appUserUuid: value, nimbleUserId: null };
  }
  return { appUserUuid: null, nimbleUserId: value };
}
