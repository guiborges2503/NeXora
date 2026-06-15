const TOKEN_KEY = "nexora_token";
const USER_KEY = "nexora_user";

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

export function hasAuthSession(): boolean {
  return getAuthToken() !== null;
}
