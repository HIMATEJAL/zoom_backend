import { Sequelize, DataTypes, Model, CreationOptional, ForeignKey } from 'sequelize';
import { Role } from './role.model';

export class User extends Model {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare roleId: ForeignKey<Role['id']>;
  declare createdAt: CreationOptional<Date>;
  declare role?: Role;
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: Role,
          key: 'id',
        },
      },
      createdAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['updatedAt'] },
      },
    }
  );
};
