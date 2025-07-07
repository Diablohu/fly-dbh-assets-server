import fs from "fs-extra";
import path from "node:path";

import { dirCacheImages } from "./vars.js";

// ============================================================================

let cleaning = false;
const maxAge = 30 * 24 * 60 * 60_000; // 30 days
// const maxAge = 30_000; // 30 seconds

const fileTimeLastClean = path.resolve(dirCacheImages, ".lasttime");
let timeLastClean =
    fs.existsSync(fileTimeLastClean) &&
    Number(await fs.readFile(fileTimeLastClean, "utf-8"));

// ============================================================================

async function cleanup() {
    if (cleaning) return;
    if (timeLastClean && Date.now() - timeLastClean < maxAge) return;

    console.log("Cleaning...");
    cleaning = true;

    try {
        const files = await fs.readdir(dirCacheImages);
        for (const filename of files) {
            const file = path.resolve(dirCacheImages, filename);
            const stats = await fs.lstat(file);
            const time = Math.max(stats.atimeMs, stats.ctimeMs);
            if (Date.now() - time > maxAge) {
                // console.log(filename, new Date(time));
                await fs.unlink(file);
            }
        }
    } catch (err) {
        console.error(err);
    }

    timeLastClean = Date.now();
    cleaning = false;
    await fs.writeFile(fileTimeLastClean, `${timeLastClean}`, "utf-8");

    console.log("Cleaning complete!");
}

export default cleanup;
