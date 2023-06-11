import { join } from 'path'
import { readdirSync } from 'fs-extra'
import chalk from 'chalk'
import { Message, Client, BaseCommand } from '../Structures'
import { getStats } from '../lib'
import { ICommand, IArgs } from '../Types'
import { startSession } from 'mongoose'

export class MessageHandler {
    constructor(private client: Client) {}

    public handleMessage = async (M: Message): Promise<void> => {
        const NS_PER_SEC = 1e9
        const MS_PER_NS = 1e-6
        const hrtime = process.hrtime()
        const { prefix } = this.client.config
        const args = M.content.split(' ')
        const title = M.chat === 'group' ? M.groupMetadata?.subject || 'Group' : 'DM'
        if (!args[0] || !args[0].startsWith(prefix)) {
            return void this.client.log(
                `${chalk.magentaBright(
                    ((process.hrtime(hrtime)[0] * NS_PER_SEC + process.hrtime(hrtime)[1]) * MS_PER_NS).toFixed(2)
                )} ${chalk.cyanBright('Message')} from ${chalk.yellowBright(M.sender.username)} in ${chalk.blueBright(
                    title
                )}`
            )
        }
        this.client.log(
            `${chalk.cyanBright(`Command ${args[0]}[${args.length - 1}]`)} from ${chalk.yellowBright(
                M.sender.username
            )} in ${chalk.blueBright(`${title}`)}`
        )
        const { banned, tag } = await this.client.DB.getUser(M.sender.jid)
        if (banned) return void M.reply('You are banned from using commands')
        if (!tag)
            await this.client.DB.updateUser(M.sender.jid, 'tag', 'set', this.client.utils.generateRandomUniqueTag())
        const cmd = args[0].toLowerCase().slice(prefix.length)
        const command = this.commands.get(cmd) || this.aliases.get(cmd)
        if (!command) return void M.reply('No such command!')
        const disabledCommands = await this.client.DB.getDisabledCommands()
        const index = disabledCommands.findIndex((CMD) => CMD.command === command.name)
        if (index >= 0)
            return void M.reply(
                `*${this.client.utils.capitalize(cmd)}* is currently disabled by *${
                    disabledCommands[index].disabledBy
                }* in *${disabledCommands[index].time} (GMT)*. ❓ *Reason:* ${disabledCommands[index].reason}`
            )
        const getGroup = await this.client.DB.getGroup(M.from)
        const disabledGroupCommands = getGroup.disabledCommands
        const iDisabledGroupCommands = disabledGroupCommands.findIndex((CMD) => CMD.command === command.name)
        if (iDisabledGroupCommands >= 0)
            return void M.reply(
                `*${this.client.utils.capitalize(cmd)}* is currently disabled by *Admin ${
                    disabledGroupCommands[iDisabledGroupCommands].disabledBy
                }* in *${disabledGroupCommands[iDisabledGroupCommands].time} (GMT)*.\n*Reason:* ${
                    disabledGroupCommands[iDisabledGroupCommands].reason
                }`
            )
        if (getGroup.restrict) {
            const allowedGroupCommands = getGroup.allowedCommands
            const iAllowedGroupCommands = allowedGroupCommands.findIndex((CMD) => CMD.command === command.name)
            const permanentAllowedCommands = ['comen', 'comdis', 'set', 'help']
            if (iAllowedGroupCommands < 0 && !permanentAllowedCommands.includes(command.name))
                return void M.reply(
                    `*${this.client.utils.capitalize(
                        cmd
                    )}* is currently not available because command not allowed by admin`
                )
        }
        if (command.config.category === 'dev' && !this.client.config.mods.includes(M.sender.jid))
            return void M.reply('This command can only be used by the Bot Owner')
        if (command.config.category === 'owner' && !this.client.config.mods.includes(M.sender.jid))
            return void M.reply('This command can only be used by the Bot Owner')
        if (M.chat === 'dm' && !command.config.dm) return void M.reply('This command can only be used in groups')
        if (command.config.category === 'moderation' && !M.sender.isAdmin)
            return void M.reply('This command can only be used by the group admins')
        const { nsfw } = await this.client.DB.getGroup(M.from)
        if (command.config.category === 'nsfw' && !nsfw)
            return void M.reply('This command can only be used in NSFW enabled groups')
        if (M.chat === 'dm' && !command.config.dm) return void M.reply('This command can only be used in groups')
        try {
            command.execute(M, this.formatArgs(args)).then(() => {
                this.client.log(
                    `${chalk.greenBright(
                        ((process.hrtime(hrtime)[0] * NS_PER_SEC + process.hrtime(hrtime)[1]) * MS_PER_NS).toFixed(2)
                    )} ${chalk.cyanBright(`Successfully Executed Command`)} from ${chalk.yellowBright(
                        M.sender.username
                    )} in ${chalk.blueBright(`${title}`)}`
                )
            })
        } catch (error) {
            this.client.log(
                `${chalk.redBright(
                    ((process.hrtime(hrtime)[0] * NS_PER_SEC + process.hrtime(hrtime)[1]) * MS_PER_NS).toFixed(2)
                )} ${chalk.cyanBright(`Fail to Executed Command`)} from ${chalk.yellowBright(
                    M.sender.username
                )} in ${chalk.blueBright(`${title}`)}`
            )
            this.client.log((error as any).message, true)
        }
    }

    private moderate = async (M: Message): Promise<void> => {
        if (M.chat !== 'group') return void null
        const { mods } = await this.client.DB.getGroup(M.from)
        const isAdmin = M.groupMetadata?.admins?.includes(this.client.correctJid(this.client.user?.id || ''))
        if (!mods || M.sender.isAdmin || !isAdmin) return void null
        const urls = this.client.utils.extractUrls(M.content)
        if (urls.length > 0) {
            const groupinvites = urls.filter((url) => url.includes('chat.whatsapp.com'))
            if (groupinvites.length > 0) {
                groupinvites.forEach(async (invite) => {
                    const code = await this.client.groupInviteCode(M.from)
                    const inviteSplit = invite.split('/')
                    if (inviteSplit[inviteSplit.length - 1] !== code) {
                        this.client.log(
                            `${chalk.blueBright('MOD')} ${chalk.green('Group Invite')} by ${chalk.yellow(
                                M.sender.username
                            )} in ${chalk.cyanBright(M.groupMetadata?.subject || 'Group')}`
                        )
                        return void (await this.client.groupParticipantsUpdate(M.from, [M.sender.jid], 'remove'))
                    }
                })
            }
        }
    }

    private formatArgs = (args: string[]): IArgs => {
        args.splice(0, 1)
        return {
            args,
            context: args.join(' ').trim(),
            flags: args.filter((arg) => arg.startsWith('--'))
        }
    }

    public loadCommands = (): void => {
        this.client.log('Loading Commands...')
        const files = readdirSync(join(...this.path)).filter((file) => !file.startsWith('_'))
        for (const file of files) {
            this.path.push(file)
            const Commands = readdirSync(join(...this.path))
            for (const Command of Commands) {
                this.path.push(Command)
                const command: BaseCommand = new (require(join(...this.path)).default)()
                command.client = this.client
                command.handler = this
                this.commands.set(command.name, command)
                if (command.config.aliases) command.config.aliases.forEach((alias) => this.aliases.set(alias, command))
                this.client.log(
                    `Loaded: ${chalk.yellowBright(command.name)} from ${chalk.cyanBright(command.config.category)}`
                )
                this.path.splice(this.path.indexOf(Command), 1)
            }
            this.path.splice(this.path.indexOf(file), 1)
        }
        return this.client.log(
            `Successfully loaded ${chalk.cyanBright(this.commands.size)} ${
                this.commands.size > 1 ? 'commands' : 'command'
            } with ${chalk.yellowBright(this.aliases.size)} ${this.aliases.size > 1 ? 'aliases' : 'alias'}`
        )
    }

    private handleUserStats = async (M: Message): Promise<void> => {
        const { experience, level } = await this.client.DB.getUser(M.sender.jid)
        const { requiredXpToLevelUp } = getStats(level)
        if (requiredXpToLevelUp > experience) return void null
        await this.client.DB.updateUser(M.sender.jid, 'level', 'inc', 1)
    }

    public commands = new Map<string, ICommand>()

    public aliases = new Map<string, ICommand>()

    private cooldowns = new Map<string, number>()

    private path = [__dirname, '..', 'Commands']
}
