import { CreationOptional, DataTypes, Model, Sequelize } from "sequelize";

export class Team extends Model {
    declare id: CreationOptional<number>;
    declare team_name: string;
    declare team_members: string[];
}

export const initTeamModel = (sequelize: Sequelize) => {
    Team.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        team_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        team_members: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: []
        },
    },
        {
            sequelize,
            modelName: 'Team',
            tableName: 'teams',
            timestamps: false,
        })
}