import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";

export function signAccessToken(
  payload: object,
  secret: string,
  expiresIn = "15m",
) {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

export function signRefreshToken(
  payload: object,
  secret: string,
  expiresIn: string,
) {
  return jwt.sign({ ...payload, jti: randomUUID() }, secret, {
    expiresIn,
  } as SignOptions);
}

export function verifyToken<T = unknown>(token: string, secret: jwt.Secret): T {
  return jwt.verify(token, secret) as T;
}
