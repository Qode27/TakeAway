import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { authRouter } from "@/routes/auth.routes.js";

vi.mock("@/services/auth/auth.service.js", () => ({
  login: vi.fn().mockResolvedValue({
    user: { id: "1", email: "admin@orderhub.ie", fullName: "Aisling Murphy", role: "admin" },
    tokens: { accessToken: "token", refreshToken: "refresh" }
  }),
  refresh: vi.fn().mockResolvedValue({
    user: { id: "1", email: "admin@orderhub.ie", fullName: "Aisling Murphy", role: "admin" },
    tokens: { accessToken: "token-2", refreshToken: "refresh-2" }
  })
}));

describe("auth routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);

  it("logs a user in", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "admin@orderhub.ie",
      password: "Password123!"
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("admin@orderhub.ie");
  });
});
