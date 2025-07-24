import { Sequelize, DataTypes, Model, CreationOptional, ForeignKey } from 'sequelize';
import { User } from './user.model';

export class ZoomUser extends Model {
    declare id: CreationOptional<number>;
    declare account_id: string;
    declare client_id: string;
    declare client_password: string;
    declare primary: boolean;
    declare userId: ForeignKey<number>;
}

export const initZoomUserModel = (sequelize: Sequelize) => {
    ZoomUser.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        account_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        client_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        client_password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        primary: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        }

    },
        {
            sequelize,
            modelName: 'ZoomUser',
            tableName: 'zoomuser',
            timestamps: false,
        })
}