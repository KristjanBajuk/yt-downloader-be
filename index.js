const express = require('express');
const readline = require('readline');
const path = require('path');
const ytdl = require('ytdl-core');
const cors = require('cors');

const fs = require('fs');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);


const port = 9999;

app.use(cors());

app.use(express.json());



io.use((socket, next) => {
    let token = socket.handshake.query.token;
    
    
    return next();
    // if (isValid(token)) {
    //     return next();
    // }
    // return next(new Error('authentication error'));
});

const downloadVideo = (videoUrl, socket) => {
    const video = ytdl(videoUrl, { filter: format => format.container === 'mp4', quality: "highest"});
        let starttime;
        const output = path.resolve(__dirname, 'video.mp4');
        console.log("DIRNAME: ", output);
        video.pipe(fs.createWriteStream(output));

        video.once('response', () => {
            starttime = Date.now();
        });
        video.on('progress', (chunkLength, downloaded, total) => {
            const percent = (downloaded / total)*100;
            const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
            const progress = percent.toFixed(0);
            socket.emit("progress", {progress: progress});
        });

        video.on('end', () => {
            socket.emit("downloaded", {done: true});
           // res.sendFile(__dirname, 'video.mp4');
        });
};


io.on('connection', (socket) => {

    console.log("Connection");

    socket.on('video_url', (data) => {
        if (ytdl.validateURL(data.url)) {
           // downloadVideo(data.url, socket);
            socket.emit("validateUrl", {valid: true, url: data.url});
        } else {
            socket.emit("validateUrl", {valid: false, url: null});
        }
    });

    socket.on('convert', (data) => {
        downloadVideo(data.url, socket);
    });
});




// app.get('/youtube-download', async (req, res) =>  {
//     console.log("REQUEST: ", req);
//     if (ytdl.validateURL(req.body.url)) {
//         // const video = ytdl(req.body.url, { filter: format => format.container === 'mp4', quality: "highest"});
//         // let starttime;
//         // const output = path.resolve(__dirname, 'video.mp4');
//         // console.log("DIRNAME: ", output);
//         // video.pipe(fs.createWriteStream(output));
//         //
//         // video.once('response', () => {
//         //     starttime = Date.now();
//         // });
//         // video.on('progress', (chunkLength, downloaded, total) => {
//         //     const percent = downloaded / total;
//         //     const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
//         //     readline.cursorTo(process.stdout, 0);
//         //     process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
//         //     process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
//         //     process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
//         //     process.stdout.write(`, estimated time left: ${(downloadedMinutes / percent - downloadedMinutes).toFixed(2)}minutes `);
//         //     readline.moveCursor(process.stdout, 0, -1);
//         // });
//         //
//         // video.on('end', () => {
//         //     process.stdout.write('\n\n');
//         //     console.log("END");
//         //     res.sendFile(__dirname, 'video.mp4');
//         // });
//         // //res.sendFile(__dirname, 'video.mp4');
//         // res.status(200).send("VALID URL");
//     } else {
//         res.status(404).send("INVALID URL");
//     }
//    
// });

server.listen(port, () => console.log(`Example app listening on port ${port}!`));