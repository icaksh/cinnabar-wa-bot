import { BaseCommand, Command, Message, Client } from '../../Structures'
import { IArgs, ICommand } from '../../Types'
import axios from 'axios'
import cron from 'node-cron'

@Command('tawiki', {
    description: 'Fakta harian dari Wikipedia',
    usage: 'tawiki',
    category: 'media'
})
export default class extends BaseCommand {
    constructor(M: Message) {
        super('tawiki', {
            description: 'Fakta harian dari Wikipedia',
            usage: 'tawiki',
            category: 'media'
        })

        cron.schedule(
            '45 7 * * *',
            async () => {
                const sendTo =
                    process.env.MODS_PRIVATE_GROUP === undefined
                        ? process.env.MODS + '@v.whatsapp.net'
                        : process.env.MODS_PRIVATE_GROUP + '@g.us'
                await axios
                    .get('https://cinnabar.icaksh.my.id/public/daily/tawiki')
                    .then(async (response) => {
                        let text = '⚠️ *TAHUKAH ANDA* ⚠️\n\n'
                        for (let data of response.data.data.info) {
                            text += `- ${data.tahukah_anda}\n`
                        }
                        await this.client.sendMessage(sendTo, { text: text })
                    })
                    .catch(async (response) => {
                        await this.client.sendMessage(sendTo, { text: 'Api not accessible' })
                    })
            },
            { scheduled: true, timezone: 'Asia/Jakarta' }
        )
    }

    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        await axios
            .get('https://cinnabar.icaksh.my.id/public/daily/tawiki')
            .then((response) => {
                let text = '⚠️ *TAHUKAH ANDA* ⚠️\n\n'
                for (let data of response.data.data.info) {
                    text += `- ${data.tahukah_anda}\n`
                }
                M.reply(text)
            })
            .catch((response) => {
                M.reply('API not accessible' + response)
            })
    }
}
