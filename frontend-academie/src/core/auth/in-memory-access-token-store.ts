let currentAccessToken: string | null = null;

export function getInMemoryAccessToken() {
  return currentAccessToken;
}

export function setInMemoryAccessToken(accessToken: string | null) {
  currentAccessToken = accessToken?.trim() ? accessToken : null;
}

export function clearInMemoryAccessToken() {
  currentAccessToken = null;
}
