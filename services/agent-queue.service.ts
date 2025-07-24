import { Op, fn, col, literal } from 'sequelize';
import commonAPI from "../config/commonAPI";
import { AbandonedCall, AgentAbandonedReport, AgentQueueAttributes, DetailedQueueReport, AgentQueueResponse } from "../types/agent-queue.types";
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";
import { AgentQueue } from "../models/agent-queue.model";
import { fetchAgents } from './agent.service';

// Centralized data fetch with configurable page size
export const fetchAgentQueueData = async (user: AuthenticatedPayload, from: string, to: string, pageSize: number = 300) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        let nextPageToken: string | undefined;

        do {
            const queryParams = new URLSearchParams({
                from,
                to,
                page_size: pageSize.toString(),
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const result = await commonAPI(
                "GET",
                `/contact_center/engagements?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!result.engagements || !Array.isArray(result.engagements)) {
                break;
            }

            nextPageToken = result.next_page_token;

            if (result.engagements.length > 0) {
                const flattenedData = result.engagements.map((item: any) => ({
                    engagement_id: item.engagement_id || '',
                    direction: item.direction || '',
                    start_time: item.start_time || '',
                    end_time: item.end_time || '',
                    channel_types: Array.isArray(item.channel_types) ? item.channel_types.join(',') : item.channel_types || '',
                    consumer_number: item.consumers?.[0]?.consumer_number || '',
                    consumer_id: item.consumers?.[0]?.consumer_id || '',
                    consumer_display_name: item.consumers?.[0]?.consumer_display_name || '',
                    flow_id: item.flows?.[0]?.flow_id || '',
                    flow_name: item.flows?.[0]?.flow_name || '',
                    cc_queue_id: item.queues?.[0]?.cc_queue_id || '',
                    queue_name: item.queues?.[0]?.queue_name || '',
                    user_id: item.agents?.[0]?.user_id || '',
                    display_name: item.agents?.[0]?.display_name || '',
                    channel: item.channels?.[0]?.channel || '',
                    channel_source: item.channels?.[0]?.channel_source || '',
                    queue_wait_type: item.queue_wait_type || '',
                    duration: (item.duration || 0) * 1000,
                    flow_duration: (item.flow_duration || 0) * 1000,
                    waiting_duration: (item.waiting_duration || 0) * 1000,
                    handling_duration: (item.handling_duration || 0) * 1000,
                    wrap_up_duration: (item.wrap_up_duration || 0) * 1000,
                    voice_mail: item.voice_mail || 0,
                    talk_duration: (item.talk_duration || 0) * 1000,
                    transfer_count: item.transferCount || 0,
                }));

                await AgentQueue.bulkCreate(flattenedData, {
                    ignoreDuplicates: true,
                    validate: true,
                });
            }
        } while (nextPageToken);
    } catch (err) {
        throw err;
    }
};

// Check if data exists, fetch if needed
const ensureDataExists = async (user: AuthenticatedPayload, from: string, to: string, whereClause: any) => {
    const existingData = await AgentQueue.findAll({
        where: whereClause,
        attributes: ['engagement_id'],
        limit: 1,
    });

    if (existingData.length === 0) {
        await fetchAgentQueueData(user, from, to);
    }
};

export const generateAgentQueue = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    page: number = 1,
    count: number,
    queues?: string[],
    agents?: string[]
): Promise<AgentQueueResponse<AgentQueueAttributes>> => {
    try {
        const offset = (page - 1) * count;
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (queues?.length) whereClause.queue_name = { [Op.in]: queues };
        if (agents?.length) whereClause.display_name = { [Op.in]: agents };

        await ensureDataExists(user, from, to, whereClause);

        const data = await AgentQueue.findAll({
            where: whereClause,
            attributes: [
                'engagement_id',
                'direction',
                'start_time',
                'consumer_number',
                'consumer_display_name',
                'flow_name',
                'queue_name',
                'channel',
                'queue_wait_type',
                'duration',
                'flow_duration',
                'waiting_duration',
                'handling_duration',
                'wrap_up_duration',
                'voice_mail',
                'talk_duration',
                'transfer_count',
            ],
            limit: count,
            offset,
        });

        const totalRecords = await AgentQueue.count({ where: whereClause });
        const users = await fetchAgents(user);

        return {
            success: true,
            report: data,
            totalRecords,
            agents: users,
        };
    } catch (err) {
        throw err;
    }
};

export const generateAgentQueueReport = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    count: number,
    page: number = 1,
    grouping: 'daily' | 'interval',
    intervalMinutes?: '15' | '30' | '60',
    queueId?: string[]
): Promise<AgentQueueResponse<DetailedQueueReport>> => {
    try {
        let dateFormat: string;
        let groupByExpression: any;

        if (grouping === 'daily') {
            dateFormat = 'YYYY-MM-DD';
            groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
        } else if (grouping === 'interval' && intervalMinutes) {
            if (intervalMinutes === '15') {
                dateFormat = 'YYYY-MM-DD HH24:MI';
                groupByExpression = fn(
                    'TO_CHAR',
                    literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '15 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 15)`),
                    literal(`'${dateFormat}'`)
                );
            } else if (intervalMinutes === '30') {
                dateFormat = 'YYYY-MM-DD HH24:MI';
                groupByExpression = fn(
                    'TO_CHAR',
                    literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 30)`),
                    literal(`'${dateFormat}'`)
                );
            } else if (intervalMinutes === '60') {
                dateFormat = 'YYYY-MM-DD HH24:00';
                groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
            } else {
                throw new Error('Invalid interval minutes');
            }
        } else {
            throw new Error('Invalid grouping or interval');
        }

        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (queueId?.length) whereClause.queue_name = { [Op.in]: queueId };

        await ensureDataExists(user, from, to, whereClause);

        const offset = (page - 1) * count;
        const results = await AgentQueue.findAll({
            where: whereClause,
            attributes: [
                [groupByExpression, 'date'],
                [col('cc_queue_id'), 'queueId'],
                [col('queue_name'), 'queueName'],
                [fn('COUNT', col('engagement_id')), 'totalOffered'],
                [
                    fn('SUM', literal('CASE WHEN handling_duration > 0 THEN 1 ELSE 0 END')),
                    'totalAnswered',
                ],
                [
                    fn('SUM', literal('CASE WHEN handling_duration = 0 THEN 1 ELSE 0 END')),
                    'abandonedCalls',
                ],
                [fn('SUM', col('handling_duration')), 'acdTime'],
                [fn('SUM', col('wrap_up_duration')), 'acwTime'],
                [fn('SUM', col('waiting_duration')), 'agentRingTime'],
                [
                    fn('AVG', literal('CASE WHEN handling_duration > 0 THEN handling_duration + wrap_up_duration ELSE NULL END')),
                    'avgHandleTime',
                ],
                [
                    fn('AVG', literal('CASE WHEN wrap_up_duration > 0 THEN wrap_up_duration ELSE NULL END')),
                    'avgAcwTime',
                ],
                [
                    fn('MAX', literal('handling_duration + wrap_up_duration')),
                    'maxHandleTime',
                ],
                [fn('SUM', col('transfer_count')), 'transferCount'],
                [
                    fn('SUM', literal("CASE WHEN channel = 'voice' THEN 1 ELSE 0 END")),
                    'voiceCalls',
                ],
                [
                    fn('SUM', literal("CASE WHEN channel != 'voice' THEN 1 ELSE 0 END")),
                    'digitalInteractions',
                ],
            ],
            group: [
                groupByExpression,
                'cc_queue_id',
                'queue_name',
            ],
            limit: count,
            offset,
            raw: true,
        });

        const totalRecords = await AgentQueue.count({
            where: whereClause,
            attributes: [
                [groupByExpression, 'date'],
                [col('cc_queue_id'), 'queueId'],
                [col('queue_name'), 'queueName'],
            ],
            group: [
                groupByExpression,
                'cc_queue_id',
                'queue_name',
            ],
            distinct: true,
        });

        const totalRecordsCount = Array.isArray(totalRecords) ? totalRecords.length : totalRecords;

        const formattedResults: DetailedQueueReport[] = results.map((result: any) => ({
            date: result.date,
            queueId: result.queueId,
            queueName: result.queueName,
            totalOffered: Number(result.totalOffered) || 0,
            totalAnswered: Number(result.totalAnswered) || 0,
            abandonedCalls: Number(result.abandonedCalls) || 0,
            acdTime: Number(result.acdTime) || 0,
            acwTime: Number(result.acwTime) || 0,
            agentRingTime: Number(result.agentRingTime) || 0,
            avgHandleTime: Number(result.avgHandleTime) || 0,
            avgAcwTime: Number(result.avgAcwTime) || 0,
            maxHandleTime: Number(result.maxHandleTime) || 0,
            transferCount: Number(result.transferCount) || 0,
            voiceCalls: Number(result.voiceCalls) || 0,
            digitalInteractions: Number(result.digitalInteractions) || 0,
        }));

        return {
            success: true,
            report: formattedResults,
            totalRecords: totalRecordsCount,
        };
    } catch (err) {
        throw err;
    }
};

export const generateAbandonedCalls = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    count: number,
    page: number = 1,
    queues?: string[],
    agents?: string[]
): Promise<AgentQueueResponse<AbandonedCall>> => {
    try {
        const offset = (page - 1) * count;
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
            handling_duration: 0,
        };

        if (queues?.length) whereClause.queue_name = { [Op.in]: queues };
        if (agents?.length) whereClause.display_name = { [Op.in]: agents };

        await ensureDataExists(user, from, to, whereClause);

        const results = await AgentQueue.findAll({
            where: whereClause,
            attributes: [
                [fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal("'YYYY-MM-DD HH24:MI:SS'")), 'startTime'],
                'engagement_id',
                'direction',
                'consumer_number',
                'consumer_id',
                'consumer_display_name',
                'cc_queue_id',
                'queue_name',
                'user_id',
                'display_name',
                'channel',
                'queue_wait_type',
                'waiting_duration',
                'voice_mail',
                'transfer_count',
            ],
            limit: count,
            offset,
            raw: true,
        });

        const totalRecords = await AgentQueue.count({ where: whereClause });

        const formattedResults: AbandonedCall[] = results.map((result: any) => ({
            startTime: result.startTime || 'N/A',
            engagementId: result.engagement_id || 'N/A',
            direction: result.direction || 'N/A',
            consumerNumber: result.consumer_number || 'N/A',
            consumerId: result.consumer_id || 'N/A',
            consumerDisplayName: result.consumer_display_name || 'N/A',
            queueId: result.cc_queue_id || 'N/A',
            queueName: result.queue_name || 'N/A',
            agentId: result.user_id || 'N/A',
            agentName: result.display_name || 'N/A',
            channel: result.channel || 'N/A',
            queueWaitType: result.queue_wait_type || 'N/A',
            waitingDuration: Number(result.waiting_duration) || 0,
            voiceMail: Number(result.voice_mail) || 0,
            transferCount: Number(result.transfer_count) || 0,
        }));

                const users = await fetchAgents(user);

        return {
            success: true,
            report: formattedResults,
            agents: users,
            totalRecords,
        };
    } catch (err) {
        throw err;
    }
};

export const generateAgentAbandonedReport = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    count: number,
    page: number = 1,
    queues?: string[],
    directions?: string[]
): Promise<AgentQueueResponse<AgentAbandonedReport>> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
            handling_duration: 0,
            waiting_duration: { [Op.gt]: 0 },
        };

        if (queues?.length) whereClause.queue_name = { [Op.in]: queues };
        if (directions?.length) whereClause.direction = { [Op.in]: directions };

        await ensureDataExists(user, from, to, whereClause);

        const offset = (page - 1) * count;
        const results = await AgentQueue.findAll({
            where: whereClause,
            attributes: [
                [fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal("'YYYY-MM-DD HH24:MI:SS'")), 'startTime'],
                'engagement_id',
                'direction',
                'consumer_number',
                'consumer_id',
                'consumer_display_name',
                'cc_queue_id',
                'queue_name',
                'user_id',
                'display_name',
                'channel',
                'queue_wait_type',
                'waiting_duration',
                'voice_mail',
                'transfer_count',
            ],
            limit: count,
            offset,
            raw: true,
        });

        const totalRecords = await AgentQueue.count({ where: whereClause });

        const formattedResults: AgentAbandonedReport[] = results.map((result: any) => ({
            startTime: result.startTime || 'N/A',
            engagementId: result.engagement_id || 'N/A',
            direction: result.direction || 'N/A',
            consumerNumber: result.consumer_number || 'N/A',
            consumerId: result.consumer_id || 'N/A',
            consumerDisplayName: result.consumer_display_name || 'N/A',
            queueId: result.cc_queue_id || 'N/A',
            queueName: result.queue_name || 'N/A',
            agentId: result.user_id || 'N/A',
            agentName: result.display_name || 'N/A',
            channel: result.channel || 'N/A',
            queueWaitType: result.queue_wait_type || 'N/A',
            waitingDuration: Number(result.waiting_duration) || 0,
            voiceMail: Number(result.voice_mail) || 0,
            transferCount: Number(result.transfer_count) || 0,
        }));

        const users = await fetchAgents(user);

        return {
            success: true,
            report: formattedResults,
            totalRecords,
            agents: users,
        };
    } catch (err) {
        throw err;
    }
};