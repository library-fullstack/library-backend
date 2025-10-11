import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function rewriteImports(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      await rewriteImports(fullPath);
    } else if (entry.endsWith(".js")) {
      let code = await readFile(fullPath, "utf8");
      // đổi tất cả .ts import → .js
      code = code.replace(/from\s+["'](.*)\.ts["']/g, 'from "$1.js"');
      await writeFile(fullPath, code);
    }
  }
}

await rewriteImports(new URL("../dist", import.meta.url).pathname);
console.log("✅ Fixed imports (.ts → .js) in dist/");
