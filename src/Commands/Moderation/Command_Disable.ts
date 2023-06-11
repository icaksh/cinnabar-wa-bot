import moment from 'moment-timezone'
import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('comdis', {
    description: 'Add/del command to disabled command',
    usage: 'comdis --c=[command_name] --s=[add/del] | <reason_for_disabling_the_command>',
    category: 'moderation'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { flags, context }: IArgs): Promise<void> => {
        flags.forEach((flag) => (context = context.replace(flag, '')))
        const commandFlag = flags.filter((flag) => flag.startsWith('--c='))
        const stateFlag = flags.filter((flag) => flag.startsWith('--s='))
        if (commandFlag.length < 1 || stateFlag.length < 1)
            return void M.reply(
                `Provide the command and the state (add/del) of the command that you wanna to. Example: *${this.client.config.prefix}comdis --c=hi --s=add | Well...*`
            )
        const cmd = commandFlag[0].toLowerCase().split('=')
        const state = stateFlag[0].toLowerCase().split('=')
        if (state[1] === '' || cmd[1] === '')
            return void M.reply(
                `Provide the command and the state (add/del) of the command that you wanna to. Example: *${this.client.config.prefix}comdis --c=hi --s=add | Well...*`
            )
        const command = this.handler.commands.get(cmd[1].trim()) || this.handler.aliases.get(cmd[1].trim())
        if (!command) return void M.reply(`No command found | *"${this.client.utils.capitalize(cmd[1])}"*`)
        const actions = ['add', 'del']
        if (!actions.includes(state[1])) return void M.reply('Invalid command state')
        const disabledGroupCommands = await (await this.client.DB.getGroup(M.from)).disabledCommands
        const index = disabledGroupCommands.findIndex((cmd) => cmd.command === command.name)
        let text = `⚙️ MOD - DISABLE COMMAND ⚙️\n\n`
        text += `*${this.client.utils.capitalize(cmd[1])}*\n`
        if (state[1] === 'add') {
            if (index >= 0) {
                text += `⛔️ is already forbidden\n`
                text += `👷🏻‍♂️ ${disabledGroupCommands[index].disabledBy}\n`
                text += `📆 ${disabledGroupCommands[index].time} (GMT)\n`
                text += `？${disabledGroupCommands[index].reason}`
                return void M.reply(text)
            }
            if (!context || !context.split('|')[1])
                return void M.reply(
                    `Provide the reason for disabling this command. Example: *${
                        this.client.config.prefix
                    }comdis --command=${this.client.utils.capitalize(cmd[1])} --s=add | Well...*`
                )
            disabledGroupCommands.push({
                command: command.name,
                disabledBy: M.sender.username,
                reason: context.split('|')[1].trim(),
                time: moment.tz('Etc/GMT').format('MMM D, YYYY HH:mm:ss')
            })
            text += `⛔️ has been forbiddened\n`
            text += `⚠️ ${context.split('|')[1].trim()}`
        } else {
            if (index < 0) {
                text += `✅ is already allowed\n`
                return void M.reply(text)
            }
            disabledGroupCommands.splice(index, 1)
            text += `✅ has been allowed\n`
        }
        await (await this.client.DB.getGroup(M.from)).updateOne({ $set: { disabledCommands: disabledGroupCommands } })
        return void M.reply(text)
    }
}
