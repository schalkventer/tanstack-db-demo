import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter, type Config } from "@tanstack/router-plugin/vite";

const TANSTACK_ROUTER_CONFIG: Partial<Config> = {
  target: "react",
  autoCodeSplitting: true,
};

export default defineConfig({
  plugins: [tanstackRouter(TANSTACK_ROUTER_CONFIG), react()],
});
