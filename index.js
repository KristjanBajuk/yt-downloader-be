const express = require('express');
const readline = require('readline');
const path = require('path');
const ytdl = require('ytdl-core');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 9999;

app.use(cors());

app.use(express.json());

app.post('/youtube-download', async (req, res) =>  {
    if (ytdl.validateURL(req.body.url)) {
        const video = ytdl(req.body.url, { filter: format => format.container === 'mp4', quality: "highest"});
        let starttime;
        const output = path.resolve(__dirname, 'video.mp4');
        console.log("DIRNAME: ", __dirname);
        video.pipe(fs.createWriteStream(output));
        
        video.once('response', () => {
            starttime = Date.now();
        });
        video.on('progress', (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
            process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
            process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
            process.stdout.write(`, estimated time left: ${(downloadedMinutes / percent - downloadedMinutes).toFixed(2)}minutes `);
            readline.moveCursor(process.stdout, 0, -1);
        });

        video.on('end', () => {
            process.stdout.write('\n\n');
        });
        res.status(200).send("VALID URL");
    } else {
        res.status(404).send("INVALID URL");
    }
    
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));