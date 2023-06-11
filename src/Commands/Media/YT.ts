import yts from 'yt-search'
import { YT } from '../../lib'
import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('play', {
    description: 'Plays a song of the given term from YouTube',
    category: 'media',
    usage: 'play [term]'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a term to play!')
        const term = context.trim()
        const { videos } = await yts(term)
        if (!videos || !videos.length) return void M.reply(`No matching songs found | *"${term}"*`)
        const buffer = await new YT(videos[0].url, 'audio').download()
        return void (await M.reply(buffer, 'audio', undefined, undefined, undefined, undefined, undefined))
    }
}
