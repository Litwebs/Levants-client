export function validateUatConfig(env) {
  if (env.VITE_API_BASE_URL !== "https://uat-api.levantsdairy.co.uk/api") {
    throw new Error("UAT requires its exact isolated API URL");
  }
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith("VITE_") && /sk_(live|test)_|whsec_|re_[A-Za-z0-9]{10}|BEGIN.*PRIVATE KEY/.test(value || "")) {
      throw new Error("Browser build must not contain provider secrets");
    }
  }
}
