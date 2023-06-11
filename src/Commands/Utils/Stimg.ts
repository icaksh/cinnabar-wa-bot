import { BaseCommand, Command, Message } from '../../Structures'

@Command('revsticker', {
    description: 'Converts sticker to image',
    category: 'utils',
    aliases: ['revs'],
    usage: 'revsticker [quote_sticker]'
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!M.quoted || (M.quoted && M.quoted.type !== 'stickerMessage')) return void M.reply('Quote the sticker!')
        const buffer = await M.downloadMediaMessage(M.quoted.message)
        const animated = M.quoted?.message?.stickerMessage?.isAnimated as boolean
        try {
            const result = animated
                ? await this.client.utils.webpToMp4(buffer)
                : await this.client.utils.webpToPng(buffer)
            return void (await M.reply(result, animated ? 'video' : 'image', animated))
        } catch (error) {
            return void (await M.reply('Conversion failed as animated stickers are not supported' + error))
        }
    }
}
