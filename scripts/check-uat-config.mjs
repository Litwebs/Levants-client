import { loadEnv } from "vite";
import { validateUatConfig } from "./uat-policy.mjs";
validateUatConfig({ ...loadEnv("uat", process.cwd(), "VITE_"), ...process.env });
console.log("UAT build configuration verified");
