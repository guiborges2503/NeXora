import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen relative">
      <Outlet />
    </div>
  );
}
