export const isUat = import.meta.env.MODE === "uat";
const configuredApi = import.meta.env.VITE_API_BASE_URL;
const uatApi = "https://uat-api.levantsdairy.co.uk/api";
if (isUat && configuredApi !== uatApi) {
  throw new Error("UAT must explicitly use its isolated API");
}
if (window.location.hostname === "uat.levantsdairy.co.uk" && !isUat) {
  throw new Error("This hostname requires a UAT storefront build");
}
export const apiBaseUrl = isUat
  ? import.meta.env.DEV ? "/api" : uatApi
  : configuredApi || (
  import.meta.env.DEV ? "http://localhost:5001/api" : "https://api.levantsdairy.co.uk/api"
);
