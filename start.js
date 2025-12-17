import { spawn, execSync } from "node:child_process";
import dayjs from "dayjs";
import { select, Separator } from "@inquirer/prompts";
import npmRunScript from "npm-run-script";
import p from "./package.json" with { type: "json" };

async function main() {
    const answer = await select({
        message: "请选择一个任务",
        pageSize: 20,
        choices: [
            new Separator(" "),
            new Separator("── 🚧 本地开发 ──────────"),
            {
                name: "开启服务器",
                short: "\n🚧 开启服务器",
                value: "npm:start-server",
                description: "npm 命令: start-server\n",
            },
            {
                name: "更新 NPM 依赖",
                short: "\n🚧 更新 NPM 依赖 Packages",
                value: "npm:up",
                description: "更新 NPM 依赖 Packages\n",
            },
            new Separator(" "),
            new Separator("── 🚀 线上发布 ──────────"),
            {
                name: "正式",
                short: "\n🚀 线上发布：正式",
                value: "publish:release",
                description: "触发线上发布流程\n",
            },
            new Separator(" "),
        ],
    });

    console.log(" ");

    const [type, command] = answer.split(":");

    switch (type) {
        case "npm":
            npmRunScript(p.scripts[command], { stdio: "inherit" });
            break;
        case "publish":
            const status = execSync("git status --porcelain").toString().trim();
            if (status) {
                console.error("⛔ 请先提交本地的改动！");
                return;
            }
            const tag = `publish-${command}-${dayjs().format(
                `YYYYMMDD`
            )}-${dayjs().format(`HHmmss`)}`;
            spawn(`git`, ["tag", tag], { stdio: "inherit" });
            spawn(`git`, ["push", "origin", tag], { stdio: "inherit" });
            break;
    }
}

await main().catch((err) => {
    console.trace(err);
});
