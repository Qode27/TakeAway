import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors.js";
import { fail } from "@/lib/http.js";
import { logger } from "@/lib/logger.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return fail(res, StatusCodes.BAD_REQUEST, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid input");
  }

  if (error instanceof AppError) {
    return fail(res, error.statusCode, error.code, error.message);
  }

  logger.error({ error }, "Unhandled application error");
  return fail(res, StatusCodes.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Something went wrong");
}
