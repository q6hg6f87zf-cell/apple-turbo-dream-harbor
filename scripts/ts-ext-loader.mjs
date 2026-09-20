import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EXTS = [".ts", ".tsx", ".js", ".mjs"];

function tryFile(base) {
  for (const ext of EXTS) {
    const file = base + ext;
    if (existsSync(file)) return file;
  }
  for (const ext of EXTS) {
    const file = join(base, "index" + ext);
    if (existsSync(file)) return file;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const bare = specifier.startsWith(".") && !extname(new URL(specifier, "file:///").pathname);
  if (bare && context.parentURL) {
    const dir = dirname(fileURLToPath(context.parentURL));
    const hit = tryFile(join(dir, specifier));
    if (hit) return nextResolve(pathToFileURL(hit).href, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err && err.code === "ERR_UNSUPPORTED_DIR_IMPORT" && context.parentURL) {
      const dir = dirname(fileURLToPath(context.parentURL));
      const hit = tryFile(join(dir, specifier));
      if (hit) return nextResolve(pathToFileURL(hit).href, context);
    }
    throw err;
  }
}
