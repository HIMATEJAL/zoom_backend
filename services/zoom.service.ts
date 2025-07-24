import { Op } from "sequelize";
import commonAPI from "../config/commonAPI";
import { CallLogs } from "../models/call-logs.model";
import { User } from "../models/user.model"
import { ZoomUser } from "../models/zoom.model";
import { AuthenticatedPayload } from "../types/user.type";
import { CallLogEntry, CallLogResponse } from "../types/zoom.type"
import { getAccessToken } from "../utils/accessToken";

export const saveUserCredentials = async (id: number, account_id: string, client_id: string, client_password: string): Promise<CallLogResponse> => {
    try {

        const existingUser = await User.findByPk(id);
        if (!existingUser) {
            throw Object.assign(new Error('User not found!'), { status: 404 });
        }
        
        const user = await ZoomUser.create({ account_id, client_id, client_password, userId: id });

        return { success: true, data: user };
    } catch (err) {
        throw err;
    }
}

export const getUserAccounts = async (id: number): Promise<ZoomUser[]> => {
  try {
    const accounts = await ZoomUser.findAll({ 
      where: { userId: id },
      attributes: ['id', 'account_id', 'client_id', 'primary']
    });
    return accounts;
  } catch (err) {
    throw Object.assign(new Error('Failed to fetch user accounts'), { status: 500 });
  }
};

export const setPrimaryAccount = async (userId: number, accountId: number): Promise<CallLogResponse> => {
  try {
    const account = await ZoomUser.findOne({ where: { id: accountId, userId } });
    if (!account) {
      throw Object.assign(new Error('Account not found'), { status: 404 });
    }

    await ZoomUser.update(
      { primary: false },
      { where: { userId, primary: true } }
    );

    await account.update({ primary: true });

    return { success: true, data: account };
  } catch (err) {
    throw err;
  }
};

const mapLogsToResponse = (logs: CallLogs[], raw: boolean = false): CallLogEntry[] => {
    return logs.map((log) => {
        const baseLog = {
            id: log.id.toString(),
            direction: log.direction,
            caller_did_number: log.caller_did_number,
            caller_name: log.caller_name,
            callee_did_number: log.callee_did_number,
            callee_name: log.callee_name,
            duration: log.duration,
            call_result: log.call_result,
            start_time: log.start_time,
            end_time: log.end_time,
        };

        if (raw) {
            return {
                ...baseLog,
                international: log.international,
                call_path_id: log.call_path_id,
                call_id: log.call_id,
                connect_type: log.connect_type,
                call_type: log.call_type,
                hide_caller_id: log.hide_caller_id,
                caller_number_type: log.caller_number_type,
                caller_country_iso_code: log.caller_country_iso_code,
                caller_country_code: log.caller_country_code,
                callee_ext_id: log.callee_ext_id,
                callee_email: log.callee_email,
                callee_ext_number: log.callee_ext_number,
                callee_ext_type: log.callee_ext_type,
                callee_number_type: log.callee_number_type,
                callee_country_iso_code: log.callee_country_iso_code,
                callee_country_code: log.callee_country_code,
                end_to_end: log.end_to_end,
                site_id: log.site_id,
                site_name: log.site_name,
                recording_status: log.recording_status,
            };
        }

        return baseLog;
    });
};

const createCallLogEntry = (log: CallLogEntry, userId: string): CallLogEntry => ({
    id: log.id ?? "N/A",
    userId: userId ?? "N/A",
    direction: log.direction ?? "N/A",
    international: log.international ?? false,
    call_path_id: log.call_path_id ?? "unknown",
    call_id: log.call_id ?? "unknown",
    connect_type: log.connect_type ?? "unknown",
    call_type: log.call_type ?? "unknown",
    hide_caller_id: log.hide_caller_id ?? false,
    caller_did_number: log.caller_did_number ?? "Unknown",
    caller_name: log.caller_name ?? "Unknown",
    callee_did_number: log.callee_did_number ?? "Unknown",
    callee_name: log.callee_name ?? "Unknown",
    duration: log.duration ?? 0,
    call_result: log.call_result ?? "Unknown",
    start_time: log.start_time ?? "N/A",
    end_time: log.end_time ?? "N/A",
    caller_number_type: log.caller_number_type ?? "unknown",
    caller_country_iso_code: log.caller_country_iso_code ?? "unknown",
    caller_country_code: log.caller_country_code ?? "unknown",
    callee_ext_id: log.callee_ext_id ?? "unknown",
    callee_email: log.callee_email ?? "unknown",
    callee_ext_number: log.callee_ext_number ?? "unknown",
    callee_ext_type: log.callee_ext_type ?? "unknown",
    callee_number_type: log.callee_number_type ?? "unknown",
    callee_country_iso_code: log.callee_country_iso_code ?? "unknown",
    callee_country_code: log.callee_country_code ?? "unknown",
    end_to_end: log.end_to_end ?? false,
    site_id: log.site_id ?? "unknown",
    site_name: log.site_name ?? "unknown",
    recording_status: log.recording_status ?? "unknown",
});

const saveCallLogToDatabase = async (log: CallLogEntry, userId: string): Promise<void> => {
    await CallLogs.create({
        userId,
        direction: log.direction,
        international: log.international,
        call_path_id: log.call_path_id,
        call_id: log.call_id,
        connect_type: log.connect_type,
        call_type: log.call_type,
        hide_caller_id: log.hide_caller_id,
        caller_did_number: log.caller_did_number,
        caller_name: log.caller_name,
        callee_did_number: log.callee_did_number,
        callee_name: log.callee_name,
        duration: log.duration,
        call_result: log.call_result,
        start_time: log.start_time,
        end_time: log.end_time,
        caller_number_type: log.caller_number_type,
        caller_country_iso_code: log.caller_country_iso_code,
        caller_country_code: log.caller_country_code,
        callee_ext_id: log.callee_ext_id,
        callee_email: log.callee_email,
        callee_ext_number: log.callee_ext_number,
        callee_ext_type: log.callee_ext_type,
        callee_number_type: log.callee_number_type,
        callee_country_iso_code: log.callee_country_iso_code,
        callee_country_code: log.callee_country_code,
        end_to_end: log.end_to_end,
        site_id: log.site_id,
        site_name: log.site_name,
        recording_status: log.recording_status,
    });
};

export const getCallDetails = async (user: AuthenticatedPayload, direction: string, from: string, to: string): Promise<CallLogEntry[]> => {
    try {
        const existingLogs = await CallLogs.findAll({
            where: {
                userId: user.id,
                start_time: {
                    [Op.between]: [from, to],
                },
                direction: direction,
            },
        });

        if (existingLogs.length > 0) {
            return mapLogsToResponse(existingLogs);
        }

        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        const response = await commonAPI("GET", `/phone/call_history?directions=${direction}&from=${from}&to=${to}`, {}, {}, token);

        const callDetails = (response.call_logs || []).map(async (log: CallLogEntry) => {
            const callLogEntry = createCallLogEntry(log, user.id.toString());
            await saveCallLogToDatabase(callLogEntry, user.id.toString());
            return {
                id: callLogEntry.id,
                userId: callLogEntry.userId,
                direction: callLogEntry.direction,
                caller_did_number: callLogEntry.caller_did_number,
                caller_name: callLogEntry.caller_name,
                callee_did_number: callLogEntry.callee_did_number,
                callee_name: callLogEntry.callee_name,
                duration: callLogEntry.duration,
                call_result: callLogEntry.call_result,
                start_time: callLogEntry.start_time,
                end_time: callLogEntry.end_time,
            };
        });

        return Promise.all(callDetails);
    } catch (err) {
        throw err;
    }
};

export const refreshCallLogs = async (user: AuthenticatedPayload, direction: string, from: string, to: string): Promise<CallLogEntry[]> => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        await CallLogs.destroy({
            where: {
                userId: user.id,
                start_time: {
                    [Op.between]: [from, to],
                },
                direction: direction,
            },
        });

        const response = await commonAPI("GET", `/phone/call_history?directions=${direction}&from=${from}&to=${to}`, {}, {}, token);

        const callDetails = (response.call_logs || []).map(async (log: CallLogEntry) => {
            const callLogEntry = createCallLogEntry(log, user.id.toString());
            await saveCallLogToDatabase(callLogEntry, user.id.toString());
            return {
                id: callLogEntry.id,
                userId: callLogEntry.userId,
                direction: callLogEntry.direction,
                caller_did_number: callLogEntry.caller_did_number,
                caller_name: callLogEntry.caller_name,
                callee_did_number: callLogEntry.callee_did_number,
                callee_name: callLogEntry.callee_name,
                duration: callLogEntry.duration,
                call_result: callLogEntry.call_result,
                start_time: callLogEntry.start_time,
                end_time: callLogEntry.end_time,
            };
        });

        return Promise.all(callDetails);
    } catch (err) {
        throw err;
    }
};

export const getRawCallLogs = async (user: AuthenticatedPayload, from: string, to: string): Promise<CallLogEntry[]> => {
    try {
        const existingLogs = await CallLogs.findAll({
            where: {
                userId: user.id,
                start_time: {
                    [Op.between]: [from, to],
                },
            },
        });

        if (existingLogs.length > 0) {
            return mapLogsToResponse(existingLogs, true);
        }

        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        const response = await commonAPI("GET", `/phone/call_history?from=${from}&to=${to}`, {}, {}, token);

        const callDetails = (response.call_logs || []).map(async (log: CallLogEntry) => {
            const callLogEntry = createCallLogEntry(log, user.id.toString());
            await saveCallLogToDatabase(callLogEntry, user.id.toString());
            return callLogEntry;
        });

        return Promise.all(callDetails);
    } catch (err) {
        throw err;
    }
};