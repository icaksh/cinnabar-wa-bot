import yts from 'yt-search'
import { Message, Command, BaseCommand } from '../../Structures'
import { IArgs } from '../../Types'

@Command('yts', {
    description: 'Searches the video of the given query in YouTube',
    category: 'media',
    usage: 'yts [query]',
    aliases: ['ytsearch']
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a query!')
        const query = context.trim()
        const { videos } = await yts(query)
        if (!videos || !videos.length) return void M.reply(`No videos found | *"${query}"*`)
        let text = ''
        const length = videos.length >= 10 ? 10 : videos.length
        for (let i = 0; i < length; i++) {
            text += `*#${i + 1} ${videos[i].title}*\n`
            text += `📕 ${videos[i].author.name}\n`
            text += `⏱ ${videos[i].seconds}s\n`
            text += `🔗 ${videos[i].url}\n\n`
        }
        return void (await M.reply(text, 'text'))
    }
}
