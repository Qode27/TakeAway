import { AuthResponse } from "@order-hub/shared";

const ACCESS = "orderhub_access_token";
const REFRESH = "orderhub_refresh_token";
const USER = "orderhub_user";
const SOUND = "orderhub_sound";

export function setSession(payload: AuthResponse) {
  localStorage.setItem(ACCESS, payload.tokens.accessToken);
  localStorage.setItem(REFRESH, payload.tokens.refreshToken);
  localStorage.setItem(USER, JSON.stringify(payload.user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(ACCESS));
}

export function getUser() {
  const user = localStorage.getItem(USER);
  return user ? JSON.parse(user) : null;
}

export function getSoundPreference() {
  return localStorage.getItem(SOUND);
}

export function setSoundPreference(value: "on" | "off") {
  localStorage.setItem(SOUND, value);
}
