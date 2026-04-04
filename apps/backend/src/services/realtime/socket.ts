import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "@/config/env.js";

let io: Server | null = null;

export function createSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.APP_ORIGIN,
      credentials: true
    }
  });

  return io;
}

export function emitOrderEvent(event: string, payload: unknown) {
  io?.emit(event, payload);
}
