import { Response } from "express";
import { ApiError, ApiSuccess } from "@order-hub/shared";

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = { success: true, data, meta };
  return res.json(body);
}

export function fail(res: Response, status: number, code: string, message: string) {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message
    }
  };
  return res.status(status).json(body);
}
