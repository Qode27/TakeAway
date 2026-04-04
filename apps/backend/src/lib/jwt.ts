import jwt from "jsonwebtoken";
import { AuthUser } from "@order-hub/shared";
import { env } from "@/config/env.js";

type TokenPayload = AuthUser & { tokenType: "access" | "refresh" };

export function signAccessToken(user: AuthUser) {
  return jwt.sign({ ...user, tokenType: "access" } satisfies TokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(user: AuthUser) {
  return jwt.sign({ ...user, tokenType: "refresh" } satisfies TokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
