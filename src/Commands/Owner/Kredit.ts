import { BaseCommand, Command, Message, Client } from '../../Structures'
import { IArgs, ICommand } from '../../Types'
import axios from 'axios'

@Command('rabb', {
    description: 'Menambahkan kredit ke laporan keuangan',
    usage: `rabb`,
    category: 'owner'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { flags, context }: IArgs): Promise<void> => {
        flags.forEach((flag) => (context = context.replace(flag, '')))
        const actionFlag = flags.filter((flag) => flag.startsWith('--a='))
        if (actionFlag.length < 1)
            return void M.reply(
                `Provide action. Example: *${this.client.config.prefix}kas --a=kred --k=kiriman teman | 6000*`
            )
        const action = actionFlag[0].toLowerCase().split('=')
        let text = ''
        if (action[1] === 'kred') {
            if (!context || !context.split(',')[0] || !context.split(',')[1])
                return void M.reply(
                    `Provide nominal. Example: *${this.client.config.prefix}kas --a=debt , 6000 , jajan, eating at mcdonalds* *${context}`
                )
            await axios
                .post(process.env.GOOGLE_SPREADSHEET_API + '?action=addKredit', {
                    nominal: parseInt(context.split(',')[0].trim()),
                    keterangan: context.split(',')[1].trim()
                })
                .then((response) => {
                    text += response.data.data
                })
                .catch((error) => {
                    text += error
                })
        } else if (action[1] === 'debt') {
            if (!context || !context.split(',')[0] || !context.split(',')[1] || !context.split(',')[2])
                return void M.reply(
                    `Provide nominal. Example: *${this.client.config.prefix}kas --a=debt , 6000 , jajan, makan soto bu ndari*`
                )
            await axios
                .post(process.env.GOOGLE_SPREADSHEET_API + '?action=addDebit', {
                    nominal: parseInt(context.split(',')[0].trim()),
                    kategori: context.split(',')[1].trim(),
                    item: context.split(',')[2].trim()
                })
                .then((response) => {
                    text += response.data.data
                })
                .catch((error) => {
                    text += error
                })
        } else {
            text += `Provide -a please.`
        }
        return void M.reply(text)
    }
}
