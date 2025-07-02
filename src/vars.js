import path from "node:path";
import fs from "fs-extra";

export const dirCache = path.resolve(".cache");

if (!fs.existsSync(dirCache)) {
    fs.mkdirSync(dirCache, { recursive: true });
}
