function normalizeBase64Url(value) {
  const normalized = String(value ?? "").replace(/-/g, "+").replace(/_/g, "/");
  const paddedLength = Math.ceil(normalized.length / 4) * 4;
  return normalized.padEnd(paddedLength, "=");
}

export function decodeJwtPayload(token) {
  const payloadPart = String(token ?? "").split(".")[1];
  if (!payloadPart) return null;

  try {
    const json = atob(normalizeBase64Url(payloadPart));
    const payload = JSON.parse(json);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

export function getTokenExpirationMs(token) {
  const exp = Number(decodeJwtPayload(token)?.exp);
  return Number.isFinite(exp) && exp > 0 ? exp * 1000 : 0;
}

export function isTokenExpiringSoon(token, withinMs = 0, now = Date.now()) {
  const expiresAtMs = getTokenExpirationMs(token);
  if (!expiresAtMs) return false;
  return expiresAtMs - now <= Math.max(0, withinMs);
}
