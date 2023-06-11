import yts from 'yt-search'
import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'
import axios from 'axios'

@Command('lyrics', {
    description: 'Searching Lyrics',
    category: 'media',
    usage: 'lyrics [term]'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a term to search!')
        const term = context.trim()
        await axios
            .get(`https://song-lyrics-api.azharimm.dev/search?q=${term}`)
            .then(async (response) => {
                let lyricsUrl = response.data.data[0].songLyrics
                await axios
                    .get(lyricsUrl)
                    .then(async (responses) => {
                        const { videos } = await yts(responses.data.data.songTitle + ' ' + responses.data.data.artist)
                        if (!videos || !videos.length) {
                            return void (await M.reply(
                                '*' +
                                    responses.data.data.songTitle +
                                    ' ' +
                                    responses.data.data.artist +
                                    '*\n' +
                                    responses.data.data.songLyrics,
                                'text',
                                undefined,
                                undefined,
                                undefined,
                                undefined
                            ))
                        } else {
                            return void (await M.reply(
                                '*' +
                                    responses.data.data.songTitle +
                                    ' ' +
                                    responses.data.data.artist +
                                    '*\n' +
                                    responses.data.data.songLyrics,
                                'text',
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                {
                                    title: videos[0].title,
                                    thumbnail: await this.client.utils.getBuffer(videos[0].thumbnail),
                                    mediaType: 2,
                                    body: videos[0].description,
                                    mediaUrl: videos[0].url
                                }
                            ))
                        }
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
