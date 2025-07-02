import fs from "fs-extra";
import path from "node:path";

import { dirCache } from "./vars.js";

// ============================================================================

let cleaning = false;
const maxAge = 30 * 24 * 60 * 60_000; // 30 days

// ============================================================================

async function cleanup() {
    if (cleaning) return;

    cleaning = true;

    const files = await fs.readdir(dirCache);
    for (const filename of files) {
        const file = path.resolve(dirCache, filename);
        const stats = await fs.lstat(file);
        const time = Math.max(stats.atimeMs, stats.ctimeMs);
        if (Date.now() - time > maxAge) {
            // console.log(filename, new Date(time));
            await fs.unlink(file);
        }
    }

    cleaning = false;
}

export default cleanup;
