import type { User } from "@prisma/client";
import { AuthUser } from "@order-hub/shared";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@/lib/prisma.js";
import { AppError } from "@/lib/errors.js";
import { comparePassword, sha256 } from "@/lib/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt.js";

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as AuthUser["role"]
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);

  await prisma.refreshToken.create({
    data: {
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId: user.id
    }
  });

  return {
    user: authUser,
    tokens: { accessToken, refreshToken }
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: sha256(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!stored) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
  }

  const authUser: AuthUser = {
    id: stored.user.id,
    email: stored.user.email,
    fullName: stored.user.fullName,
    role: stored.user.role as AuthUser["role"]
  };

  const accessToken = signAccessToken(authUser);
  const nextRefreshToken = signRefreshToken(authUser);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: sha256(nextRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: payload.id
      }
    })
  ]);

  return {
    user: authUser,
    tokens: { accessToken, refreshToken: nextRefreshToken }
  };
}
