import yts from 'yt-search'
import { YT } from '../../lib'
import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'
import axios from 'axios'

@Command('music', {
    description: 'Searching Lyrics',
    category: 'media',
    usage: 'music [term]'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a term to play!')
        const term = context.trim()
        const { videos } = await yts(term)
        if (!videos || !videos.length) return void M.reply(`No matching songs found | *"${term}"*`)
        const buffer = await new YT(videos[0].url, 'audio').download()

        await axios
            .get(`https://lyrics.azharimm.site/search?q=${term}`)
            .then(async (response) => {
                let lyricsUrl = response.data.data[0].songLyrics
                await axios
                    .get(lyricsUrl)
                    .then(async (responses) => {
                        await M.reply(buffer, 'audio', undefined, undefined, undefined, undefined, {
                            title: videos[0].title,
                            thumbnail: await this.client.utils.getBuffer(videos[0].thumbnail),
                            mediaType: 2,
                            body: videos[0].description,
                            mediaUrl: videos[0].url
                        })
                        return void (await M.reply(responses.data.data.songLyrics, 'text'))
                    })
                    .catch(async () => {
                        return void (await M.reply('Cannot Fetch/Lyrics Not Found', 'text'))
                    })
            })
            .catch(async () => {
                return void (await M.reply('Cannot Fetch/Lyrics Not Found', 'text'))
            })
    }
}
