import puppeteer from 'puppeteer';

import express from 'express';

import fs from 'fs';

import chalk from 'chalk';

import dotenv from 'dotenv';

import exitHook from 'async-exit-hook';

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();


dotenv.config();

// Serve /fixtures as static files
const app = express();

app.listen(process.env.PORT || 7777, () => {
  console.log('Server running on http://localhost', process.env.PORT || '7777');
});

// On browsing /heatmap/:username return the html from ../fixtures/heatmap/index.html
app.get('/heatmap/:username', (req, res) => {
    // Load file contents from ../fixtures/heatmap/index.html
    // and add the username at the end of the file in a <script> tag
    fs.readFile(__dirname + '/../fixtures/heatmap/index.html', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        const html = data + `<script>window.username = "${req.params.username}";</script>`
        res.send(html);
    });
});

// On /kills/:username, return the kills for that user from prisma
app.get('/kills/:username', async (req, res) => {
    const { username } = req.params;
    // find the first playerId with that username where playerName is the username, only keep the playerId
    const playerId = await prisma.deathInfo.findFirst({
        where: {
            playerName: username
        },
        select: {
            playerId: true
        }
    });
    console.log(playerId, 'playerId');
    if (!playerId) {
        return res.json({ kills: [], deaths: [] });
    }
    // find all deathInfos where killerId is the playerId
    const kills = await prisma.deathInfo.findMany({
        where: {
            killerId: playerId?.playerId
        }
    });
    // find all deathInfos where playerId is the playerId
    const deaths = await prisma.deathInfo.findMany({
        where: {
            playerId: playerId?.playerId
        }
    });
    res.json({ kills, deaths });
});

const staticFolder = __dirname + '/../fixtures/';
console.log('staticFolder', staticFolder);
app.use(express.static(staticFolder)); // ??

let currBrowser = null;

import SimulatorController from './SimulationController';


function addDeathInfos(deathInfos) {
    return Promise.all(deathInfos.map(async(deathInfo) => {
        await prisma.deathInfo.create({
            data: deathInfo
        });
    }));
}

function loadLastGame() {
    return prisma.deathInfo.findFirst({
        orderBy: {
            gameId: 'desc'
        }
    });
}

async function loadFilesList(from = '0') {
   let list = await fs.promises.readdir(__dirname +'/../fixtures/api/replay/');
   // Ignore .DS_Store
    list = list.filter(file => !file.startsWith('.'));
    // Sort by name ascending
    list.sort((x,y) => parseInt(x) - parseInt(y));
    // Discard anything before 'from'
    const idx = list.indexOf(from);
    if (idx === -1) {
        return list;
    }
    return list.slice(idx+1);
}



async function browserStart() {

    const monitorArgs = ["--mute-audio"]; // "--window-size=1200,800", "--window-position=-1200,0",
    const longArgs = ["--window-size=588,278","--window-position=2000,0"];
    console.log('DevTools:', !!parseInt(process.env.DEVTOOLS), 'Headless:', !!parseInt(process.env.HEADLESS) || false);
    let browser = await puppeteer.launch({headless: !!parseInt(process.env.HEADLESS) || false, args: monitorArgs.concat(longArgs), devtools: !!parseInt(process.env.DEVTOOLS) });
    currBrowser = browser;

    //simulPage = await browser.newPage();
    let [page] = await browser.pages();

    let viewport = { width: 588, height: 278 };


    await page.setViewport(viewport);

    //let viewport = { width: 1280, height: 1024 };


    const lastGame = await loadLastGame();
    const filesList = await loadFilesList(lastGame?.gameId.toString());
    console.log(chalk.green(`Loaded ${filesList.length} files`));
    
    let sim = new SimulatorController({browser, page, addDeathInfos, filesList});

    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        let page = await browser.newPage();
        await page.setViewport(viewport);
        let sim = new SimulatorController({browser, page, addDeathInfos, filesList});
    }


    // TODO: Figure out how to dispatch the next game to the simulator
    // Each page ask for its next?

}

exitHook(async(cb) => {
    console.log('exiting 2');
    currBrowser?.close().finally(cb);
    await prisma.$disconnect();
});

const main = async() => {
    try {
        browserStart().catch(err =>{ throw err });
        await prisma.$disconnect();
    }
    catch(err) {
        await prisma.$disconnect();
        throw err;
    }
}

// Start the replays parse
if (process.env.REPLAYER) {
    main().catch(err => console.error(err));
}
