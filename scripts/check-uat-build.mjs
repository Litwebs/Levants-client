import { readFileSync, readdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]);
}
for (const path of files("dist")) {
  if (!/\.(js|html|json|txt)$/.test(path)) continue;
  const content = readFileSync(path, "utf8");
  if (/https:\/\/api\.levantsdairy\.co\.uk|https:\/\/admin\.litwebs\.co\.uk\/api\/websites\/status|sk_(live|test)_|whsec_/.test(content)) {
    throw new Error("UAT artifact contains a production integration or secret");
  }
}
if (existsSync("dist/CNAME")) unlinkSync("dist/CNAME");
writeFileSync("dist/robots.txt", "User-agent: *\nDisallow: /\n");
let html = readFileSync("dist/index.html", "utf8");
html = html.replace("<title>Levants Dairy</title>", '<title>[UAT] Levants Dairy</title>\n<meta name="robots" content="noindex, nofollow, noarchive" />');
writeFileSync("dist/index.html", html);
writeFileSync("dist/404.html", html);
console.log("UAT artifact verified: isolated API, no production CNAME, no indexing");
