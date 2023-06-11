import { prop, getModelForClass } from '@typegoose/typegoose'
import { Document } from 'mongoose'

export class GroupSchema {
    @prop({ type: String, unique: true, required: true })
    public jid!: string

    @prop({ type: () => AllowedCommands, required: true, default: [] })
    public allowedCommands!: AllowedCommands[]

    @prop({ type: () => DisabledCommands, required: true, default: [] })
    public disabledCommands!: DisabledCommands[]

    @prop({ type: Boolean, required: true, default: false })
    public restrict!: boolean

    @prop({ type: Boolean, required: true, default: false })
    public events!: boolean

    @prop({ type: Boolean, required: true, default: false })
    public mods!: boolean

    @prop({ type: Boolean, required: true, default: false })
    public nsfw!: boolean
}

class AllowedCommands {
    @prop({ type: String, required: true })
    public command!: string

    @prop({ type: String, required: true })
    public reason!: string

    @prop({ type: String, required: true })
    public allowedBy!: string

    @prop({ type: String, required: true })
    public time!: string
}

class DisabledCommands {
    @prop({ type: String, required: true })
    public command!: string

    @prop({ type: String, required: true })
    public reason!: string

    @prop({ type: String, required: true })
    public disabledBy!: string

    @prop({ type: String, required: true })
    public time!: string
}

export type TGroupModel = GroupSchema & Document

export const groupSchema = getModelForClass(GroupSchema)
