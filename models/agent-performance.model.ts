import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class AgentPerformance extends Model {
    declare id: CreationOptional<number>;
    declare engagement_id: string;
    declare start_time: Date;
    declare end_time: Date;
    declare direction: string;
    declare user_id: string;
    declare user_name: string;
    declare channel: string;
    declare channel_source: string;
    declare queue_id: string;
    declare queue_name: string;
    declare team_id: string;
    declare team_name: string;
    declare handled_count: number;
    declare handle_duration: number;
    declare direct_transfer_count: number;
    declare warm_transfer_initiated_count: number;
    declare warm_transfer_completed_count: number;
    declare transfer_initiated_count: number;
    declare transfer_completed_count: number;
    declare warm_conference_count: number;
    declare agent_offered_count: number;
    declare agent_refused_count: number;
    declare agent_missed_count: number;
    declare ring_disconnect_count: number;
    declare agent_declined_count: number;
    declare agent_message_sent_count: number;
    declare hold_count: number;
    declare conversation_duration: number;
    declare conference_duration: number;
    declare conference_count: number;
    declare hold_duration: number;
    declare wrap_up_duration: number;
    declare outbound_handled_count: number;
    declare outbound_handle_duration: number;
    declare warm_conference_duraton: number;
    declare warm_transfer_duration: number;
    declare ring_duration: number;
    declare agent_first_response_duration: number;
    declare dial_duration: number;
    declare inbound_conversation_duration: number;
    declare inbound_handle_duration: number;
    declare inbound_handled_count: number;
    declare outbound_conversation_duration: number;
}

export const initAgentPerformanceModel = (sequelize: Sequelize) => {
    AgentPerformance.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        engagement_id: {
            type: DataTypes.STRING,
            unique: true,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        direction: {
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
        channel: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        channel_source: {
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
        team_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        team_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        handled_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        handle_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        direct_transfer_count: {
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
        agent_offered_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_refused_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_missed_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        ring_disconnect_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_declined_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_message_sent_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hold_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conversation_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conference_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conference_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hold_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        wrap_up_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        outbound_handled_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        outbound_handle_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warm_conference_duraton: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        warm_transfer_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        ring_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_first_response_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        dial_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        inbound_conversation_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        inbound_handle_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        inbound_handled_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        outbound_conversation_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'AgentPerformance',
        tableName: 'agentPerformance',
        timestamps: false,
    });
};