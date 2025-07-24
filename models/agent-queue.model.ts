import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class AgentQueue extends Model {
    declare id: CreationOptional<number>;
    declare start_time: string;
    declare end_time: string;
    declare duration: number;
    declare engagement_id: string;
    declare direction: string;
    declare channel: string;
    declare channel_source: string;
    declare consumer_id: string;
    declare consumer_display_name: string;
    declare consumer_number: string;
    declare flow_id: string; 
    declare flow_name: string;
    declare cc_queue_id: string;
    declare queue_name: string;
    declare user_id: string;
    declare display_name: string;
    declare queue_wait_type: string;
    declare talk_duration: number;
    declare flow_duration: number;
    declare waiting_duration: number;
    declare handling_duration: number;
    declare wrap_up_duration: number;
    declare transfer_count: number;
    declare voice_mail: number;
}

export const initAgentQueueModel = (sequelize: Sequelize) => {
    AgentQueue.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        start_time: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        engagement_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        direction: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        channel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        channel_source: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        consumer_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        consumer_display_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        consumer_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        flow_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        flow_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cc_queue_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        queue_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        display_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        queue_wait_type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        talk_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        flow_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        waiting_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        handling_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        wrap_up_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        transfer_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        voice_mail: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'AgentQueue',
        tableName: 'agentQueue',
        timestamps: false,
    });
};