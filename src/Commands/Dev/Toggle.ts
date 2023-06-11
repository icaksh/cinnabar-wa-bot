import moment from 'moment-timezone'
import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('toggle', {
    description: 'Toggles a command state',
    usage: 'toggle --command=[command_name] --state=[disable/enable] | <reason_for_disabling_the_command>',
    category: 'dev'
})
export default class extends BaseCommand {
    public override execute = async (M: Message, { flags, context }: IArgs): Promise<void> => {
        flags.forEach((flag) => (context = context.replace(flag, '')))
        const commandFlag = flags.filter((flag) => flag.startsWith('--command='))
        const stateFlag = flags.filter((flag) => flag.startsWith('--state='))
        if (commandFlag.length < 1 || stateFlag.length < 1)
            return void M.reply(
                `Provide the command and the state (disable/enable) of the command that you wanna to. Example: *${this.client.config.prefix}toggle --command=hi --state=disable | Well...*`
            )
        const cmd = commandFlag[0].toLowerCase().split('=')
        const state = stateFlag[0].toLowerCase().split('=')
        if (state[1] === '' || cmd[1] === '')
            return void M.reply(
                `Provide the command and the state (disable/enable) of the command that you wanna to. Example: *${this.client.config.prefix}toggle --command=hi --state=disable | Well...*`
            )
        const command = this.handler.commands.get(cmd[1].trim()) || this.handler.aliases.get(cmd[1].trim())
        if (!command) return void M.reply(`No command found | *"${this.client.utils.capitalize(cmd[1])}"*`)
        const actions = ['disable', 'enable']
        if (!actions.includes(state[1])) return void M.reply('Invalid command state')
        const disabledCommands = await this.client.DB.getDisabledCommands()
        const index = disabledCommands.findIndex((cmd) => cmd.command === command.name)
        let text = `⚙️ DEV - TOGGLE COMMAND ⚙️\n\n`
        text += `*${this.client.utils.capitalize(cmd[1])}*\n`
        if (state[1] === 'disable') {
            if (index >= 0) {
                text += `✅ is already disabled\n`
                text += `👷🏻‍♂️ ${disabledCommands[index].disabledBy}\n`
                text += `📆 ${disabledCommands[index].time} (GMT)\n`
                text += `⚠️ ${disabledCommands[index].reason}`
                return void M.reply(text)
            }
            if (!context || !context.split('|')[1])
                return void M.reply(
                    `Provide the reason for disabling this command. Example: *${
                        this.client.config.prefix
                    }toggle --command=${this.client.utils.capitalize(cmd[1])} --state=disable | Well...*`
                )
            disabledCommands.push({
                command: command.name,
                disabledBy: M.sender.username,
                reason: context.split('|')[1].trim(),
                time: moment.tz('Etc/GMT').format('MMM D, YYYY HH:mm:ss')
            })
            text += `✅ has been disabled\n`
            text += `？${context.split('|')[1].trim()}`
        } else {
            if (index < 0) {
                text += `✅ is already enabled\n`
                return void M.reply(text)
            }
            disabledCommands.splice(index, 1)
            text += `✅ has been enabled\n`
        }
        await this.client.DB.updateDisabledCommands(disabledCommands)
        return void M.reply(text)
    }
}
