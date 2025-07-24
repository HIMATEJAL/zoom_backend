import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class AgentTimecard extends Model {
    declare id: CreationOptional<number>;
    declare work_session_id: string;
    declare start_time: Date;
    declare end_time: Date;
    declare user_id: string;
    declare user_name: string;
    declare user_status: string;
    declare user_sub_status: string;
    declare duration: number;
}

export const initAgentTimecardModel = (sequelize: Sequelize) => {
    AgentTimecard.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        work_session_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        user_sub_status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'AgentTimecard',
        tableName: 'agentTimecard',
        timestamps: false,
    });
};