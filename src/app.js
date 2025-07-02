import fs from "fs-extra";
import path from "node:path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import md5 from "md5";
import Koa from "koa";
import helmet from "koa-helmet";
import send from "koa-send";
import cash from "koa-cash";
import convert from "koa-convert";
import { LRUCache } from "lru-cache";

import { dirCache } from "./vars.js";
import cleanup from "./cleanup.js";

// ============================================================================

/** 默认缓存有效期 (1年) */
const maxage = 1 * 365 * 24 * 60 * 60 * 1000;
/** 基于访问量的缓存 */
const cache = new LRUCache({
    max: 500,
    maxAge: maxage,
});
/** 对照表: 访问地址 -> 文件名 */
const filenameMap = {};
/** 用于 `koa-send` 的参数 */
const sendOptions = {
    maxage,
    immutable: true,
    root: dirCache,
};
const target = `https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}`;

// ============================================================================

class App {
    static parseOptions(options) {
        if (typeof options === "number")
            return App.parseOptions({ port: options });

        if (typeof options !== "object") throw new Error(`missing options`);
        if (typeof options.port === "undefined")
            throw new Error(`missing option: port`);

        return options;
    }

    /** Koa app */
    app = undefined;
    server = undefined;
    silent = false;

    constructor(options = {}) {
        Object.assign(this, App.parseOptions(options));
    }

    async create() {
        if (process.env.NODE_ENV === "development") await fs.emptyDir(dirCache);

        this.app = new Koa();
        const app = this.app;

        app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
        app.use(
            convert(
                cash({
                    get: (key) => cache.get(key),
                    set: (key, value) => cache.set(key, value),
                })
            )
        );
        app.use(async function (ctx, next) {
            const p = /^\/images(\/.+)/.exec(ctx.originalUrl);
            if (!p) return await next();

            const cashed = await ctx.cashed();
            if (cashed) return;
            if (ctx.method !== "GET") return await next();

            cleanup();

            const originalUrl = p[1];
            const filenameFromMap = filenameMap[originalUrl];
            if (filenameFromMap) {
                if (fs.existsSync(path.resolve(dirCache, filenameFromMap))) {
                    return await send(ctx, filenameFromMap, sendOptions);
                }
                // 缓存文件名对应的文件不存在，删除缓存
                delete filenameMap[originalUrl];
            }

            const fullUrl = `${target}/${originalUrl}`;
            const res = await fetch(fullUrl);
            if (res.status !== 200) return res;

            const ext =
                (res.headers.get("content-type") || "").replace(
                    /^image\//,
                    ""
                ) || "jpg";
            const filename = md5(originalUrl) + "." + ext;
            const destination = path.resolve(dirCache, filename);

            if (fs.existsSync(destination)) {
                filenameMap[originalUrl] = filename;
                return await send(ctx, filename, sendOptions);
            }

            // console.log({
            //     fullUrl,
            //     headers: res.headers.get("content-type"),
            //     ext,
            //     filename,
            //     destination,
            // });

            if (res.body) {
                const fileStream = fs.createWriteStream(destination, {
                    flags: "wx",
                });
                await finished(Readable.fromWeb(res.body).pipe(fileStream));
            }

            filenameMap[originalUrl] = filename;
            return await send(ctx, filename, sendOptions);
        });

        return this.app;
    }

    async start(port = this.port, callback) {
        if (!this.app) await this.create();

        this.server = this.app.listen(port);

        if (!this.silent)
            // eslint-disable-next-line no-console
            console.log(`FLY-DBH Assets Server listening port ${port}`);
    }
}

export default App;
