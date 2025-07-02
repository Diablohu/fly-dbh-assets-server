import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import App from "./src/app.js";

const argv = yargs(hideBin(process.argv)).parse();

const start = async () => {
    const app = new App({
        port: process.env.FLY_DBH_ASSETS_SERVER_PORT || argv.port || 8081,
    });
    await app.start();
};

start().catch((err) => {
    console.error(err);
});
