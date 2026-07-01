const TOKEN_KEY = "nexora_token";
const USER_KEY = "nexora_user";
const SAVED_LOGIN_KEY = "nexora_saved_login";

export type SavedLoginCredentials = {
  email: string;
  password: string;
};

export function getAuthToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  return token && token.trim() !== "" ? token : null;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSavedLogin(): SavedLoginCredentials | null {
  try {
    const raw = localStorage.getItem(SAVED_LOGIN_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedLoginCredentials>;
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    const password = typeof parsed.password === "string" ? parsed.password : "";

    if (!email) return null;
    return { email, password };
  } catch {
    return null;
  }
}

export function setSavedLogin(credentials: SavedLoginCredentials): void {
  localStorage.setItem(
    SAVED_LOGIN_KEY,
    JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })
  );
}

export function clearSavedLogin(): void {
  localStorage.removeItem(SAVED_LOGIN_KEY);
}

export function hasAuthSession(): boolean {
  return getAuthToken() !== null;
}
