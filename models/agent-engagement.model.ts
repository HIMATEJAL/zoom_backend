import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class AgentEngagement extends Model {
    declare id: CreationOptional<number>;
    declare engagement_id: string;
    declare direction: string;
    declare start_time: Date;
    declare end_time: Date;
    declare enter_channel: string;
    declare enter_channel_source: string;
    declare channel: string;
    declare channel_source: string;
    declare consumer_name: string;
    declare consumer_email: string;
    declare dnis: string;
    declare ani: string;
    declare queue_id: string;
    declare queue_name: string;
    declare user_id: string;
    declare user_name: string;
    declare duration: number;
    declare handle_duration: number;
    declare conversation_duration: number;
    declare hold_count: number;
    declare hold_duration: number;
    declare warm_transfer_initiated_count: number;
    declare warm_transfer_completed_count: number;
    declare direct_transfer_count: number;
    declare transfer_initiated_count: number;
    declare transfer_completed_count: number;
    declare warm_conference_count: number;
    declare conference_count: number;
    declare abandoned_count: number;
}

export const initAgentEngagementModel = (sequelize: Sequelize) => {
    AgentEngagement.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        engagement_id: {
            type: DataTypes.STRING,
            unique: true,
        },
        direction: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        enter_channel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        enter_channel_source: {
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
        consumer_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        consumer_email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dnis: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ani: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        queue_id: {
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
        user_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        handle_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conversation_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hold_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hold_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warm_transfer_initiated_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warm_transfer_completed_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        direct_transfer_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        transfer_initiated_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        transfer_completed_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warm_conference_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conference_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        abandoned_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'AgentEngagement',
        tableName: 'agentEngagement',
        timestamps: false,
    });
};