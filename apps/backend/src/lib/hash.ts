import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "@/config/env.js";

export const hashPassword = (value: string) => bcrypt.hash(value, env.BCRYPT_ROUNDS);
export const comparePassword = (value: string, hash: string) => bcrypt.compare(value, hash);
export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
