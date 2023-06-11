import { BaseCommand, Command, Message, Client } from '../../Structures'
import { IArgs, ICommand } from '../../Types'
import axios from 'axios'

const headers = {
    Authorization: `Bearer ${process.env.OPENAI_KEY}`,
    'Content-Type': 'application/json'
}

const axiosInstance = axios.create({
    baseURL: 'https://api.openai.com/',
    timeout: 300000,
    headers: headers
})

const getDavinciResolve = async (clientText: string) => {
    const body = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: clientText }],
        temperature: 1
    }

    try {
        const { data } = await axiosInstance.post('v1/chat/completions', body)
        const botAnswer = data.choices[0].message.content
        return `${process.env.NAME} \n\n${botAnswer}`
    } catch (e) {
        console.log(e)
        return `❌ OpenAI Response Error`
    }
}

@Command('gpt', {
    description: 'ChatGPT',
    category: 'media',
    usage: 'gpt [term]'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a term to search!')
        const term = context.trim()
        getDavinciResolve(term).then(async (response) => {
            return void (await M.reply(response, 'text'))
        })
    }
}
