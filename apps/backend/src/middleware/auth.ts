import { NextFunction, Request, Response } from "express";
import { Role } from "@order-hub/shared";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken } from "@/lib/jwt.js";
import { fail } from "@/lib/http.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      fullName: string;
      role: Role;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return fail(res, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication is required");
  }

  try {
    const user = verifyAccessToken(token);
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };
    next();
  } catch {
    return fail(res, StatusCodes.UNAUTHORIZED, "UNAUTHORIZED", "Authentication token is invalid");
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, StatusCodes.FORBIDDEN, "FORBIDDEN", "You do not have access to this resource");
    }

    next();
  };
}
