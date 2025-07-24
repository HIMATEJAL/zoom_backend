import { Sequelize, DataTypes, Model, CreationOptional } from 'sequelize';

export class CallLogs extends Model {
    declare id: CreationOptional<number>;
    declare direction: string;
    declare international: boolean;
    declare call_path_id: string;
    declare call_id: string;
    declare caller_did_number: string;
    declare connect_type: string;
    declare call_type: string;
    declare hide_caller_id: boolean;
    declare caller_name: string;
    declare callee_did_number: string;
    declare caller_number_type: string;
    declare caller_country_iso_code: string;
    declare caller_country_code: string;
    declare callee_ext_id: string;
    declare callee_name: string;
    declare callee_email: string;
    declare callee_ext_number: string;
    declare callee_ext_type: string;
    declare callee_number_type: string;
    declare callee_country_iso_code: string;
    declare callee_country_code: string;
    declare end_to_end: boolean;
    declare site_id: string;
    declare site_name: string;
    declare duration: number;
    declare call_result: string;
    declare start_time: string;
    declare end_time: string;
    declare recording_status: string;
}

export const initCallLogModel = (sequelize: Sequelize) => {
    CallLogs.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        direction: { type: DataTypes.STRING },
        international: { type: DataTypes.BOOLEAN },
        call_path_id: { type: DataTypes.STRING },
        call_id: { type: DataTypes.STRING },
        connect_type: { type: DataTypes.STRING },
        call_type: { type: DataTypes.STRING },
        hide_caller_id: { type: DataTypes.BOOLEAN },
        caller_did_number: { type: DataTypes.STRING },
        caller_name: { type: DataTypes.STRING },
        caller_number_type: { type: DataTypes.STRING },
        caller_country_iso_code: { type: DataTypes.STRING },
        caller_country_code: { type: DataTypes.STRING },
        callee_ext_id: { type: DataTypes.STRING },
        callee_did_number: { type: DataTypes.STRING },
        callee_name: { type: DataTypes.STRING },
        callee_email: { type: DataTypes.STRING },
        callee_ext_number: { type: DataTypes.STRING },
        callee_ext_type: { type: DataTypes.STRING },
        callee_number_type: { type: DataTypes.STRING },
        callee_country_iso_code: { type: DataTypes.STRING },
        callee_country_code: { type: DataTypes.STRING },
        end_to_end: { type: DataTypes.BOOLEAN },
        site_id: { type: DataTypes.STRING },
        site_name: { type: DataTypes.STRING },
        duration: { type: DataTypes.INTEGER },
        call_result: { type: DataTypes.STRING },
        start_time: { type: DataTypes.STRING },
        end_time: { type: DataTypes.STRING },
        recording_status: { type: DataTypes.STRING },
    },
        {
            sequelize,
            modelName: 'CallLogs',
            tableName: 'callLog',
            timestamps: false,
        })
}