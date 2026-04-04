import { Navigate } from "react-router-dom";
import { PropsWithChildren } from "react";
import { isAuthenticated } from "@/lib/auth";

export function ProtectedRoute({ children }: PropsWithChildren) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
