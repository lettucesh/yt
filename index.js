const fs = require('fs');
const prompt = require("prompt-sync")({ sigint: true });
const ytdl = require('ytdl-core');

const ytURL = prompt('insira url do youtube: ');

const audioStream = ytdl(ytURL, { quality: 'highestaudio' });

audioStream.on('error', (err) => console.error('erro ao baixar: ', err));
audioStream.on('end', () => console.log('baixado!'));

const getYtTitle = async () => {
    try {
        const info = await ytdl.getBasicInfo(ytURL);
        return info.videoDetails.title;
        
    } catch (error) {
        console.error('erro ao obter informacoes do video:', error);
        return null;
    }
}

(async () => {
    const ytTitle = await getYtTitle();

    if (ytTitle) {
        console.log('baixando:', ytTitle);
        const fileStream = fs.createWriteStream(`C:/Users/sop/Documents/musicas/${ytTitle}.mp3`);
        audioStream.pipe(fileStream);
    }
})();