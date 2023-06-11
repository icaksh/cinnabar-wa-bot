import moment from 'moment-timezone'
import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('comen', {
    description: 'Add/del command to allowed command',
    usage: 'comen --c=[command_name] --s=[add/del] | <reason_for_disabling_the_command>',
    category: 'moderation'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { flags, context }: IArgs): Promise<void> => {
        flags.forEach((flag) => (context = context.replace(flag, '')))
        const commandFlag = flags.filter((flag) => flag.startsWith('--c='))
        const stateFlag = flags.filter((flag) => flag.startsWith('--s='))
        if (commandFlag.length < 1 || stateFlag.length < 1)
            return void M.reply(
                `Provide the command and the state (add/del) of the command that you wanna to. Example: *${this.client.config.prefix}comen --c=hi --s=add*`
            )
        const cmd = commandFlag[0].toLowerCase().split('=')
        const state = stateFlag[0].toLowerCase().split('=')
        if (state[1] === '' || cmd[1] === '')
            return void M.reply(
                `Provide the command and the state (add/del) of the command that you wanna to. Example: *${this.client.config.prefix}comen --c=hi --s=add*`
            )
        const command = this.handler.commands.get(cmd[1].trim()) || this.handler.aliases.get(cmd[1].trim())
        if (!command) return void M.reply(`No command found | *"${this.client.utils.capitalize(cmd[1])}"*`)
        const actions = ['del', 'add']
        if (!actions.includes(state[1])) return void M.reply('Invalid command state')
        const allowedGroupCommands = await (await this.client.DB.getGroup(M.from)).allowedCommands
        const index = allowedGroupCommands.findIndex((cmd) => cmd.command === command.name)
        let text = `⚙️ MOD - ENABLE COMMAND ⚙️\n\n`
        text += `*${this.client.utils.capitalize(cmd[1])}*\n`
        if (state[1] === 'add') {
            if (index >= 0) {
                text += `✅ is already allowed\n`
                text += `👷🏻‍♂️ ${allowedGroupCommands[index].allowedBy}\n`
                text += `📆 ${allowedGroupCommands[index].time} (GMT)\n`
                text += `⚠️ ${allowedGroupCommands[index].reason}`
                return void M.reply(text)
            }
            allowedGroupCommands.push({
                command: command.name,
                allowedBy: M.sender.username,
                reason: 'Allowed by Admin',
                time: moment.tz('Etc/GMT').format('MMM D, YYYY HH:mm:ss')
            })
            text += `✅ has been allowed\n`
            text += `？${context.split('|')[1].trim()}`
        } else {
            if (index < 0) {
                text += `⛔️ is already forbidden\n`
                return void M.reply(text)
            }
            allowedGroupCommands.splice(index, 1)
            text += `⛔️ has been forbidden\n`
        }
        await (await this.client.DB.getGroup(M.from)).updateOne({ $set: { allowedCommands: allowedGroupCommands } })
        return void M.reply(text)
    }
}
