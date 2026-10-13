import { defineConfig } from "@playwright/test";
import basketConfig from "./playwright.baskets.config";

export default defineConfig({
  ...basketConfig,
  testMatch: "**/*.spec.ts",
});
