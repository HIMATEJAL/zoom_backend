import { CreationOptional, DataTypes, Model, Sequelize } from "sequelize";

export class Agent extends Model {
    declare id: CreationOptional<number>;
    declare user_name: string;
    declare user_id: string;
}

export const initAgentModel = (sequelize: Sequelize) => {
    Agent.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: 'Agent',
            tableName: 'agents',
            timestamps: false,
        }
    )
}