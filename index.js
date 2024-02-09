const prompt = require("prompt-sync")({ sigint: true });
const ytdl = require('ytdl-core');
const fs = require('fs');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const { apiKey } = process.env;

const ask = prompt('playlist ou musica? p/m ');

const playlistURL = ask === 'p' ? prompt('insira url da playlist: ') : null;
const ytURL = ask === 'm' ? prompt('insira url do youtube: ') : null;

// para playlistURL
const getAllPlaylistVideos = async (playlistId, apiKey) => {
    let arrayVideos = [];

    const getPlaylistVideos = async (pageToken = null) => {
        let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${playlistId}&key=${apiKey}`;

        if (pageToken) apiUrl += `&pageToken=${pageToken}`;

        const resp = await axios.get(apiUrl);

        arrayVideos.push(...resp.data.items);

        if (resp.data.nextPageToken) await getPlaylistVideos(resp.data.nextPageToken);
    }

    await getPlaylistVideos();

    return arrayVideos.map(item => {
        return {
            title: item.snippet.title,
            videoId: item.snippet.resourceId.videoId
        }
    })
}
// para ytURL
const getYtTitle = async () => {
    const info = await ytdl.getBasicInfo(ytURL);
    return {
        title: info.videoDetails.title,
        videoId: info.videoDetails.videoId
    }
}

const fixFilename = (filename) => {
    if (typeof filename !== 'string') {
        return '';
    }
    return filename.replace(/[\/\?<>\\:\*\|":]/g, ''); // remove caracteres inválidos
};


const downloadAudio = (video) => {
    const videoTitle = fixFilename(video.title);
    const filePath = `C:/Users/sop/Documents/spotify/${videoTitle}.mp3`;

    if (fs.existsSync(filePath)) {
        console.log(`${videoTitle} ja esta baixado`);
        return;
    }

    const audioStream = ytdl(`https://www.youtube.com/watch?v=${video.videoId}`, { filter: 'audioonly', quality: 'highestaudio' });

    audioStream.on('error', (err) => console.error('erro ao baixar: ', err));
    audioStream.on('end', () => console.log(`${video.title} baixado!`));

    audioStream.pipe(fs.createWriteStream(filePath));
}

(async () => {
    if (playlistURL) {
        const playlistIdMatch = playlistURL.match(/list=([\w-]+)/);
        const playlistId = playlistIdMatch[1];

        const videos = await getAllPlaylistVideos(playlistId, apiKey);
        console.log('lista de videos da playlist:', videos);

        // exportar o array pro pc
        const videosJson = JSON.stringify(videos, null, 2)
        try {
            fs.writeFileSync(`./playlists/${Date.now()}.json`, videosJson);
            console.log('array exportado com sucesso');
        } catch (error) {
            console.log('erro ao exportar o array: ', error);
        }

        videos.forEach((video, index) => {
            downloadAudio(video);
        })

    } else if (ytURL) {
        const ytTitle = await getYtTitle();
        downloadAudio({ title: ytTitle.title, videoId: ytTitle.videoId });

    } else console.log('url invalida');

})();
