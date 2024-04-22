import { hl } from "./utils.js";

import dotenv from "dotenv";

import path from "path";

import chalk from "chalk";
import { Browser, Page } from "puppeteer";

dotenv.config();

let simObj = 0;

//@ts-ignore
export default class SimulationController {
  browser: Browser;
  page: Page;
  addDeathInfos: any;
  filesList: string[];
  currentFile: string;
  simulatorId: number;

  constructor({ browser, page, addDeathInfos, filesList }) {
    this.browser = browser;
    this.page = page;
    this.addDeathInfos = addDeathInfos;
    this.filesList = filesList;

    this.exposeHooks();
    console.log("Hooks exposed");
    this.simulatorId = simObj++;

    // Get to work
    this.nextRun();
  }
  async nextRun() {
    this.currentFile = this.filesList.shift();
    if (!this.currentFile) {
      console.log(chalk.red(`[${this.simulatorId}] All files processed`));
      return;
    }
    // Go to the page
    console.log(chalk.yellow(`[${this.simulatorId}] Will parse [${this.currentFile}]`));
    await this.page.goto(`http://localhost:${process.env.PORT || 7777}/replay/v1.1/?game=${this.currentFile}`, {timeout: 0});
  }

  async onReplayEnded(cb) {
    const timeLeft = ~~((this.filesList.length * cb[1])/1000/60) + "min";
    console.log(chalk.green(`[${this.simulatorId}] [${timeLeft}] Recording Ended [${this.currentFile}] - ( ${cb[1]} ms ) - ${cb[0].length} deaths - ${chalk.yellow(this.filesList.length)} remaining`));
    // console.log(cb[0]);
    await this.addDeathInfos(cb[0]);
    this.nextRun();
  }
  async onReplayReady(cb) {
    console.log(chalk.green("Recording Ready"));
  }
  async exposeHooks() {
    try {
      await this.page.exposeFunction("onReplayEnded", (cb) => {
        this.onReplayEnded(cb);
      });
    } catch (err) {
      // @ts-ignore
      this.page._pageBindings.set("onReplayEnded", (cb) => {
        this.onReplayEnded(cb);
      });
      console.log("Override onReplayEnded");
    }
    try {
      await this.page.exposeFunction("onReplayReady", (cb) => {
        this.onReplayReady(cb);
      });
    } catch (err) {
      // @ts-ignore
      this.page._pageBindings.set("onReplayReady", (cb) => {
        this.onReplayReady(cb);
      });
      console.log("Override onReplayReady");
    }
  }
}
