import { col, fn, Op } from "sequelize";
import { AuthenticatedPayload } from "../types/user.type";
import { AgentTimecard } from "../models/agent-timecard.model";
import { AgentLoginLogoutOutput, AgentTimecardAttributes, AgentTimecardOutput, AgentTimecardResponse, CountResult } from "../types/agent-timecard.types";
import { getAccessToken } from "../utils/accessToken";
import commonAPI from "../config/commonAPI";

export const refreshTimeCard = async (user: AuthenticatedPayload, from: string, to: string) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        await AgentTimecard.destroy({
            where: {
                start_time: { [Op.between]: [from, to] },
            },
        });

        let nextPageToken: string | undefined;

        do {
            const queryParams = new URLSearchParams({
                from,
                to,
                page_size: '300',
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const response = await commonAPI(
                "GET",
                `/contact_center/analytics/dataset/historical/agent_timecard?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!response.users || !Array.isArray(response.users)) {
                console.log(`API returned no users or invalid data: ${JSON.stringify(response)}`);
                break;
            }

            nextPageToken = response.next_page_token;

            if (response?.users?.length > 0) {
                const validatedData = response.users.map((item: AgentTimecardAttributes) => ({
                    work_session_id: item.work_session_id || "",
                    start_time: item.start_time ? new Date(item.start_time) : null,
                    end_time: item.end_time ? new Date(item.end_time) : null,
                    user_id: item.user_id || "",
                    user_name: item.user_name || "",
                    user_status: item.user_status || "",
                    user_sub_status: item.user_sub_status || "",
                    duration: item.ready_duration || item.occupied_duration || item.not_ready_duration || item.work_session_duration || 0,
                }));

                try {
                    await AgentTimecard.bulkCreate(validatedData, {
                        ignoreDuplicates: true,
                        validate: true,
                    });
                } catch (bulkError) {
                    console.error('Failed to upsert data in AgentTimecard table:', bulkError);
                }
            } else {
                console.log('No data fetched from API to upsert');
            }

        } while (nextPageToken);

    } catch (err) {
        throw err;
    }
};

export const fetchTimeCard = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    page: number = 1,
    count: number,
    format: string,
    status: string[],
    agents: string[],
): Promise<AgentTimecardResponse> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (status && status.length > 0) whereClause.user_status = { [Op.in]: status };
        if (agents && agents.length > 0) whereClause.user_name = { [Op.in]: agents };

        const existingData = await AgentTimecard.findAll({
            where: whereClause,
            attributes: ['work_session_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshTimeCard(user, from, to);
        }

        const offset = (page - 1) * count;
        const data = await AgentTimecard.findAll({
            where: whereClause,
            attributes: [
                'work_session_id',
                'start_time',
                'user_name',
                'user_status',
                'user_sub_status',
                'duration',
            ],
            order: [['start_time', format]],
            limit: count,
            offset,
        });

        const totalRecords = await AgentTimecard.count({ where: whereClause });

        return {
            success: true,
            totalRecords,
            records: data.map(record => ({
                work_session_id: record.work_session_id,
                start_time: record.start_time,
                user_name: record.user_name,
                user_status: record.user_status,
                user_sub_status: record.user_sub_status,
                duration: record.duration,
            })) as AgentTimecardOutput[],
        };
    } catch (err) {
        throw err;
    }
};

export const fetchAgentLoginReport = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    page: number = 1,
    count: number,
    format: string,
    agents: string[],
): Promise<AgentTimecardResponse> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (agents && agents.length > 0) whereClause.user_name = { [Op.in]: agents };

        const existingData = await AgentTimecard.findAll({
            where: whereClause,
            attributes: ['work_session_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshTimeCard(user, from, to);
        }

        const offset = (page - 1) * count;
        const data = await AgentTimecard.findAll({
            where: whereClause,
            attributes: [
                'user_name',
                'work_session_id',
                [fn('MIN', col('start_time')), 'start_time'],
                [fn('MAX', col('end_time')), 'end_time'],
                [fn('SUM', col('duration')), 'duration'],
            ],
            group: ['user_name', 'work_session_id'],
            order: [[col('start_time'), format]],
            limit: count,
            offset,
        });

        const totalRecordsResult = await AgentTimecard.findAll({
            where: whereClause,
            attributes: [
                [fn('COUNT', fn('DISTINCT', fn('CONCAT', col('user_name'), col('work_session_id')))), 'total'],
            ],
            raw: true,
        })as unknown as CountResult[];

        const totalRecords = parseInt(totalRecordsResult[0].total, 10);

        return {
            success: true,
            totalRecords,
            records: data.map(record => ({
                work_session_id: record.work_session_id,
                start_time: record.start_time,
                end_time: record.end_time,
                user_name: record.user_name,
                duration: record.duration,
            })) as AgentLoginLogoutOutput[],
        };
    } catch (err) {
        throw err;
    }
}