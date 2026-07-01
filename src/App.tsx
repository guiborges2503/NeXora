import { RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppThemeProvider } from "@/components/theme/AppThemeProvider";
import { router } from "./routes";

export default function App() {
  return (
    <AppThemeProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AppThemeProvider>
  );
}
