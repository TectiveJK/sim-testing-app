const AUTH_USERNAME = "jk-simlab";
const AUTH_PASSWORD_SHA256 =
  "a8b3d023e2238028cda74dfefda9e0ab62a90e64710688e701713c484a2ab029";
const AUTH_SESSION_TOKEN =
  "e1907e91649c4bb8463bb803a2399e69f98af7de4dd17d9db4eb058ac8ed4bff";

const SESSION_KEY = "sim-flight-testing-auth-v1";

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyCredentials(username: string, password: string) {
  const user = username.trim();
  if (!user || !password) return false;
  const passwordHash = await sha256Hex(password);
  if (user !== AUTH_USERNAME || passwordHash !== AUTH_PASSWORD_SHA256) {
    return false;
  }
  return true;
}

export function readSession() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_KEY) === AUTH_SESSION_TOKEN;
  } catch {
    return false;
  }
}

export function writeSession() {
  window.localStorage.setItem(SESSION_KEY, AUTH_SESSION_TOKEN);
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}
