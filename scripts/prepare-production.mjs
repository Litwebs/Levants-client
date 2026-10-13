import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const expectedHost = "levantsdairy.co.uk";
const api = "https://api.levantsdairy.co.uk/api";
const sha = process.env.RELEASE_SHA;
if (!/^[0-9a-f]{40}$/.test(sha || "")) throw Error("Exact release SHA required");
if (fs.readFileSync("dist/CNAME", "utf8").trim() !== expectedHost) throw Error("Wrong production CNAME");
if (!fs.existsSync("dist/index.html") || !fs.existsSync("dist/404.html")) throw Error("SPA build incomplete");
const files = {};
let foundApi = false;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error("Unexpected symlink");
    if (entry.isDirectory()) { walk(p); continue; }
    const data = fs.readFileSync(p);
    files[p.slice(5)] = crypto.createHash("sha256").update(data).digest("hex");
    if (p.endsWith(".js")) {
      const source = data.toString("utf8");
      foundApi ||= source.includes(api);
      if (source.includes("https://uat-api.levantsdairy.co.uk/api") ||
          /sk_(?:live|test)_|whsec_/.test(source)) throw Error("Wrong environment or secret in production bundle");
    }
  }
}
walk("dist");
if (!foundApi) throw Error("Production API missing from bundle");
const response = await fetch(`https://api.github.com/repos/${process.env.GH_REPOSITORY}/pages`, {
  headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw Error("Cannot verify existing Pages source: HTTP " + response.status);
const pages = await response.json();
if (pages.cname !== expectedHost || pages.source?.branch !== "gh-pages" || pages.source?.path !== "/") {
  throw Error("Existing Pages publishing source differs from expected gh-pages root");
}
const manifest = { sha, environment: "production", host: expectedHost, api, files };
fs.writeFileSync("dist/release.json", JSON.stringify(manifest, null, 2) + "\n");
const report = { readOnly: true, published: false, passed: true, sha, api, pages: {
  cname: pages.cname, source: pages.source, buildType: pages.build_type, httpsEnforced: pages.https_enforced,
}, fileCount: Object.keys(files).length };
fs.writeFileSync("production-preparation.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
