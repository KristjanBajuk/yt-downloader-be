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

const downloadVideo = (videoUrl, options, socket) => {
    const video = ytdl(videoUrl, options);
        let starttime;
        const output = path.resolve(__dirname, 'video.mp4');
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
            // fs.readFile("video.mp4", function (err, data) {
            //     if (err) {
            //         console.log(err)
            //     }
            //     console.log("ok");
            //     socket.send(data,  {binary: true});
            // });
            
            // res.sendFile(__dirname, 'video.mp4');
        });
};



const getInfo = async (url, socket) => {
    const videoInfo = await ytdl.getInfo(url);
    const formats = videoInfo.formats;

    let audioOnlyFormats = ytdl.filterFormats(formats, 'audioonly');
    let videoOnlyFormats = ytdl.filterFormats(formats, 'videoonly');
    let videoAudioFormats = ytdl.filterFormats(formats, 'audioandvideo');

    
    socket.emit("videoInfo", {videoOnlyFormats, videoAudioFormats, audioOnlyFormats});
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
        getInfo(data.url, socket);

    });

    socket.on('download', (data) => {
        downloadVideo(data.url, data.options, socket);
    });
});


server.listen(port, () => console.log(`Example app listening on port ${port}!`));