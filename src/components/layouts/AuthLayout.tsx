import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="h-dvh max-h-dvh overflow-hidden relative">
      <Outlet />
    </div>
  );
}
