const KEY = "accessToken";

export const storage = {
  getAccessToken() {
    return localStorage.getItem(KEY);
  },
  setAccessToken(token) {
    localStorage.setItem(KEY, token);
  },
  clear() {
    localStorage.removeItem(KEY);
  }
};
