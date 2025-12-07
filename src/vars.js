import path from "node:path";
import fs from "fs-extra";

export const dirCacheImages = path.resolve(".cache", "sanity-images");
export const tempfileExtname = ".tmp";

if (!fs.existsSync(dirCacheImages)) {
    fs.mkdirSync(dirCacheImages, { recursive: true });
}
