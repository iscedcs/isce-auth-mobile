// lib/jwt.ts

export type DecodedToken = {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayPicture?: string;
  userType?: string;
  exp: number;
  iat: number;
  [key: string]: any;
};

export function decodeJwt(token: string | null): DecodedToken | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowSec;
}
