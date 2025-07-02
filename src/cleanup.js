import fs from "fs-extra";
import path from "node:path";

import { dirCache } from "./vars.js";

// ============================================================================

let cleaning = false;
const maxAge = 30 * 24 * 60 * 60_000; // 30 days
// const maxAge = 30_000; // 30 seconds

const fileTimeLastClean = path.resolve(dirCache, ".lasttime");
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
    } catch (err) {
        console.error(err);
    }

    timeLastClean = Date.now();
    cleaning = false;
    await fs.writeFile(fileTimeLastClean, `${timeLastClean}`, "utf-8");

    console.log("Cleaning complete!");
}

export default cleanup;
