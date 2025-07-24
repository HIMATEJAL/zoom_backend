import { Op, fn, col, literal } from 'sequelize';
import commonAPI from "../config/commonAPI";
import { AgentQueue } from "../models/agent-queue.model";
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";
import { DetailedFlowReport } from "../types/agent-queue.types";

export const refreshVDNRecords = async (user: AuthenticatedPayload, from: string, to: string) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

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

            const response = await commonAPI("GET", `/contact_center/engagements?${queryParams.toString()}`, {}, {}, token);

            const flattenedData = response.engagements?.map((item: any) => ({
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
                duration: item.duration || 0,
                flow_duration: item.flow_duration || 0,
                waiting_duration: item.waiting_duration || 0,
                handling_duration: item.handling_duration || 0,
                wrap_up_duration: item.wrap_up_duration || 0,
                voice_mail: item.voice_mail || 0,
                talk_duration: item.talk_duration || 0,
                transfer_count: item.transferCount || 0,
            }));

            await AgentQueue.bulkCreate(flattenedData, {
                ignoreDuplicates: true,
                validate: true,
            });

        } while (nextPageToken);

    } catch (err) {
        throw err;
    }
}

export const fetchFlowData = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    count: number,
    page: number = 1,
    intervalMinutes: '15' | '30' | '60' | '1440',
    flows: string[],
) => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        }

        if (flows && flows.length > 0) whereClause.flow_name = { [Op.in]: flows };

        const existingData = await AgentQueue.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshVDNRecords(user, from, to);
        }

        let dateFormat: string;
        let groupByExpression: any;

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
        } else if (intervalMinutes === '1440') {
            dateFormat = 'YYYY-MM-DD';
            groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
        } else {
            throw new Error('Invalid interval minutes');
        }

        const offset = (page - 1) * count;
        const results = await AgentQueue.findAll({
            where: whereClause,
            attributes: [
                [groupByExpression, 'date'],
                [col('flow_id'), 'flowId'],
                [col('flow_name'), 'flowName'],
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
                [
                    fn('SUM', literal("CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END")),
                    'inboundCalls',
                ],
                [
                    fn('SUM', literal("CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END")),
                    'outboundCalls',
                ],
            ],
            group: [
                groupByExpression,
                'flow_id',
                'flow_name',
            ],
            limit: count,
            offset,
            raw: true,
        });

        const totalRecords = (
            await AgentQueue.findAll({
                where: whereClause,
                attributes: [[groupByExpression, 'date'], 'flow_id', 'flow_name'],
                group: [groupByExpression, 'flow_id', 'flow_name'],
                raw: true,
            })
        ).length;

        const formattedResults: DetailedFlowReport[] = results.map((result: any) => {
            const totalCalls = Number(result.totalOffered) || 0;
            const successPercentage = totalCalls > 0 ? ((Number(result.totalAnswered) / totalCalls) * 100).toFixed(1) : '0.0';
            const abandonPercentage = totalCalls > 0 ? ((Number(result.abandonedCalls) / totalCalls) * 100).toFixed(1) : '0.0';

            return {
                date: result.date,
                flowId: result.flowId,
                flowName: result.flowName,
                totalOffered: totalCalls,
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
                inboundCalls: Number(result.inboundCalls) || 0,
                outboundCalls: Number(result.outboundCalls) || 0,
                successPercentage,
                abandonPercentage,
            };
        });

        return {
            success: true,
            report: formattedResults,
            totalRecords,
        };
    } catch (err) {
        throw err;
    }
};


// export const getFlowIntervalReport = async (
//     user: AuthenticatedPayload,
//     from: string,
//     to: string,
//     count: number,
//     page: number = 1,
//     intervalMinutes: '15' | '30' | '60' | '1440',
//     nextPageToken?: string,
//     flowId?: string,
//     flowName?: string
// ): Promise<AgentQueueResponse> => {
//     try {
//         const whereClause: any = {
//             start_time: { [Op.between]: [from, to] },
//         };

//         if (flowId) whereClause.flow_id = flowId;
//         if (flowName) whereClause.flow_name = flowName;

//         const existingData = await AgentQueue.findAll({
//             where: whereClause,
//             attributes: ['engagement_id'],
//             limit: 1,
//         });

//         if (existingData.length === 0) {
//             await fetchFlowData(user, from, to, count, page, flowId, flowName, nextPageToken);
//         }

//         let dateFormat: string;
//         let groupByExpression: any;

//         if (intervalMinutes === '15') {
//             dateFormat = 'YYYY-MM-DD HH24:MI';
//             groupByExpression = fn(
//                 'TO_CHAR',
//                 literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '15 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 15)`),
//                 literal(`'${dateFormat}'`)
//             );
//         } else if (intervalMinutes === '30') {
//             dateFormat = 'YYYY-MM-DD HH24:MI';
//             groupByExpression = fn(
//                 'TO_CHAR',
//                 literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 30)`),
//                 literal(`'${dateFormat}'`)
//             );
//         } else if (intervalMinutes === '60') {
//             dateFormat = 'YYYY-MM-DD HH24:00';
//             groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
//         } else if (intervalMinutes === '1440') {
//             dateFormat = 'YYYY-MM-DD';
//             groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
//         } else {
//             throw new Error('Invalid interval minutes');
//         }

//         const offset = (page - 1) * count;
//         const results = await AgentQueue.findAll({
//             where: whereClause,
//             attributes: [
//                 [groupByExpression, 'date'],
//                 [col('flow_id'), 'flowId'],
//                 [col('flow_name'), 'flowName'],
//                 [fn('COUNT', col('engagement_id')), 'totalOffered'],
//                 [
//                     fn('SUM', literal('CASE WHEN handling_duration > 0 THEN 1 ELSE 0 END')),
//                     'totalAnswered',
//                 ],
//                 [
//                     fn('SUM', literal('CASE WHEN handling_duration = 0 THEN 1 ELSE 0 END')),
//                     'abandonedCalls',
//                 ],
//                 [fn('SUM', col('handling_duration')), 'acdTime'],
//                 [fn('SUM', col('wrap_up_duration')), 'acwTime'],
//                 [fn('SUM', col('waiting_duration')), 'agentRingTime'],
//                 [
//                     fn('AVG', literal('CASE WHEN handling_duration > 0 THEN handling_duration + wrap_up_duration ELSE NULL END')),
//                     'avgHandleTime',
//                 ],
//                 [
//                     fn('AVG', literal('CASE WHEN wrap_up_duration > 0 THEN wrap_up_duration ELSE NULL END')),
//                     'avgAcwTime',
//                 ],
//                 [
//                     fn('MAX', literal('handling_duration + wrap_up_duration')),
//                     'maxHandleTime',
//                 ],
//                 [fn('SUM', col('transfer_count')), 'transferCount'],
//                 [
//                     fn('SUM', literal("CASE WHEN channel = 'voice' THEN 1 ELSE 0 END")),
//                     'voiceCalls',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN channel != 'voice' THEN 1 ELSE 0 END")),
//                     'digitalInteractions',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END")),
//                     'inboundCalls',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END")),
//                     'outboundCalls',
//                 ],
//             ],
//             group: [
//                 groupByExpression,
//                 'flow_id',
//                 'flow_name',
//             ],
//             limit: count,
//             offset,
//             raw: true,
//         });

//         const totalRecords = (
//             await AgentQueue.findAll({
//                 where: whereClause,
//                 attributes: [[groupByExpression, 'date'], 'flow_id', 'flow_name'],
//                 group: [groupByExpression, 'flow_id', 'flow_name'],
//                 raw: true,
//             })
//         ).length;

//         const formattedResults: DetailedFlowReport[] = results.map((result: any) => {
//             const totalCalls = Number(result.totalOffered) || 0;
//             const successPercentage = totalCalls > 0 ? ((Number(result.totalAnswered) / totalCalls) * 100).toFixed(1) : '0.0';
//             const abandonPercentage = totalCalls > 0 ? ((Number(result.abandonedCalls) / totalCalls) * 100).toFixed(1) : '0.0';

//             return {
//                 date: result.date,
//                 flowId: result.flowId,
//                 flowName: result.flowName,
//                 totalOffered: totalCalls,
//                 totalAnswered: Number(result.totalAnswered) || 0,
//                 abandonedCalls: Number(result.abandonedCalls) || 0,
//                 acdTime: Number(result.acdTime) || 0,
//                 acwTime: Number(result.acwTime) || 0,
//                 agentRingTime: Number(result.agentRingTime) || 0,
//                 avgHandleTime: Number(result.avgHandleTime) || 0,
//                 avgAcwTime: Number(result.avgAcwTime) || 0,
//                 maxHandleTime: Number(result.maxHandleTime) || 0,
//                 transferCount: Number(result.transferCount) || 0,
//                 voiceCalls: Number(result.voiceCalls) || 0,
//                 digitalInteractions: Number(result.digitalInteractions) || 0,
//                 inboundCalls: Number(result.inboundCalls) || 0,
//                 outboundCalls: Number(result.outboundCalls) || 0,
//                 successPercentage,
//                 abandonPercentage,
//             };
//         });

//         return {
//             success: true,
//             report: formattedResults,
//             totalRecords,
//         };
//     } catch (err) {
//         throw err;
//     }
// };

// export const getDailyFlowReport = async (
//     user: AuthenticatedPayload,
//     from: string,
//     to: string,
//     count: number,
//     page: number = 1,
//     flowId?: string,
//     flowName?: string,
//     nextPageToken?: string
// ): Promise<AgentQueueResponse> => {
//     try {
//         const result = await getFlowIntervalReport(user, from, to, count, page, '60', nextPageToken, flowId, flowName);
//         return result;
//     } catch (err) {
//         throw err;
//     }
// };

// export const refreshAgentQueueData = async (
//     user: AuthenticatedPayload,
//     from: string,
//     to: string,
//     count: number,
//     page: number = 1,
//     intervalMinutes: '15' | '30' | '60' | '1440',
// ): Promise<AgentQueueResponse> => {
//     try {
//         const queryParams = new URLSearchParams({
//             from,
//             to,
//             page_size: '300',
//         });

//         const token = await getAccessToken(user.id);
//         if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

//         const result = await commonAPI("GET", `/contact_center/engagements?${queryParams.toString()}`, {}, {}, token);

//         const flattenedData = result.engagements?.map((item: any) => ({
//             engagement_id: item.engagement_id,
//             direction: item.direction,
//             start_time: item.start_time,
//             end_time: item.end_time,
//             channel_types: item.channel_types,
//             consumer_number: item.consumers?.[0]?.consumer_number,
//             consumer_id: item.consumers?.[0]?.consumer_id,
//             consumer_display_name: item.consumers?.[0]?.consumer_display_name,
//             flow_id: item.flows?.[0]?.flow_id,
//             flow_name: item.flows?.[0]?.flow_name,
//             cc_queue_id: item.queues?.[0]?.cc_queue_id,
//             queue_name: item.queues?.[0]?.queue_name,
//             user_id: item.agents?.[0]?.user_id,
//             display_name: item.agents?.[0]?.display_name,
//             channel: item.channels?.[0]?.channel,
//             channel_source: item.channels?.[0]?.channel_source,
//             queue_wait_type: item.queue_wait_type,
//             duration: item.duration,
//             flow_duration: item.flow_duration,
//             waiting_duration: item.waiting_duration,
//             handling_duration: item.handling_duration,
//             wrap_up_duration: item.wrap_up_duration,
//             voice_mail: item.voice_mail,
//             talk_duration: item.talk_duration,
//             transferCount: item.transferCount,
//         }));

//         await AgentQueue.bulkCreate(flattenedData, {
//             updateOnDuplicate: ['engagement_id'],
//         });

//         const whereClause: any = {
//             start_time: { [Op.between]: [from, to] },
//         };

//         let dateFormat: string;
//         let groupByExpression: any;

//         if (intervalMinutes === '15') {
//             dateFormat = 'YYYY-MM-DD HH24:MI';
//             groupByExpression = fn(
//                 'TO_CHAR',
//                 literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '15 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 15)`),
//                 literal(`'${dateFormat}'`)
//             );
//         } else if (intervalMinutes === '30') {
//             dateFormat = 'YYYY-MM-DD HH24:MI';
//             groupByExpression = fn(
//                 'TO_CHAR',
//                 literal(`DATE_TRUNC('hour', CAST("start_time" AS TIMESTAMP)) + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM CAST("start_time" AS TIMESTAMP)) / 30)`),
//                 literal(`'${dateFormat}'`)
//             );
//         } else if (intervalMinutes === '60') {
//             dateFormat = 'YYYY-MM-DD HH24:00';
//             groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
//         } else if (intervalMinutes === '1440') {
//             dateFormat = 'YYYY-MM-DD';
//             groupByExpression = fn('TO_CHAR', literal('CAST("start_time" AS TIMESTAMP)'), literal(`'${dateFormat}'`));
//         } else {
//             throw new Error('Invalid interval minutes');
//         }

//         const offset = (page - 1) * count;
//         const results = await AgentQueue.findAll({
//             where: whereClause,
//             attributes: [
//                 [groupByExpression, 'date'],
//                 [col('flow_id'), 'flowId'],
//                 [col('flow_name'), 'flowName'],
//                 [fn('COUNT', col('engagement_id')), 'totalOffered'],
//                 [
//                     fn('SUM', literal('CASE WHEN handling_duration > 0 THEN 1 ELSE 0 END')),
//                     'totalAnswered',
//                 ],
//                 [
//                     fn('SUM', literal('CASE WHEN handling_duration = 0 THEN 1 ELSE 0 END')),
//                     'abandonedCalls',
//                 ],
//                 [fn('SUM', col('handling_duration')), 'acdTime'],
//                 [fn('SUM', col('wrap_up_duration')), 'acwTime'],
//                 [fn('SUM', col('waiting_duration')), 'agentRingTime'],
//                 [
//                     fn('AVG', literal('CASE WHEN handling_duration > 0 THEN handling_duration + wrap_up_duration ELSE NULL END')),
//                     'avgHandleTime',
//                 ],
//                 [
//                     fn('AVG', literal('CASE WHEN wrap_up_duration > 0 THEN wrap_up_duration ELSE NULL END')),
//                     'avgAcwTime',
//                 ],
//                 [
//                     fn('MAX', literal('handling_duration + wrap_up_duration')),
//                     'maxHandleTime',
//                 ],
//                 [fn('SUM', col('transferCount')), 'transferCount'],
//                 [
//                     fn('SUM', literal("CASE WHEN channel = 'voice' THEN 1 ELSE 0 END")),
//                     'voiceCalls',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN channel != 'voice' THEN 1 ELSE 0 END")),
//                     'digitalInteractions',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END")),
//                     'inboundCalls',
//                 ],
//                 [
//                     fn('SUM', literal("CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END")),
//                     'outboundCalls',
//                 ],
//             ],
//             group: [
//                 groupByExpression,
//                 'flow_id',
//                 'flow_name',
//             ],
//             limit: count,
//             offset,
//             raw: true,
//         });

//         const totalRecords = (
//             await AgentQueue.findAll({
//                 where: whereClause,
//                 attributes: [[groupByExpression, 'date'], 'flow_id', 'flow_name'],
//                 group: [groupByExpression, 'flow_id', 'flow_name'],
//                 raw: true,
//             })
//         ).length;

//         const formattedResults: DetailedFlowReport[] = results.map((result: any) => {
//             const totalCalls = Number(result.totalOffered) || 0;
//             const successPercentage = totalCalls > 0 ? ((Number(result.totalAnswered) / totalCalls) * 100).toFixed(1) : '0.0';
//             const abandonPercentage = totalCalls > 0 ? ((Number(result.abandonedCalls) / totalCalls) * 100).toFixed(1) : '0.0';

//             return {
//                 date: result.date,
//                 flowId: result.flowId,
//                 flowName: result.flowName,
//                 totalOffered: totalCalls,
//                 totalAnswered: Number(result.totalAnswered) || 0,
//                 abandonedCalls: Number(result.abandonedCalls) || 0,
//                 acdTime: Number(result.acdTime) || 0,
//                 acwTime: Number(result.acwTime) || 0,
//                 agentRingTime: Number(result.agentRingTime) || 0,
//                 avgHandleTime: Number(result.avgHandleTime) || 0,
//                 avgAcwTime: Number(result.avgAcwTime) || 0,
//                 maxHandleTime: Number(result.maxHandleTime) || 0,
//                 transferCount: Number(result.transferCount) || 0,
//                 voiceCalls: Number(result.voiceCalls) || 0,
//                 digitalInteractions: Number(result.digitalInteractions) || 0,
//                 inboundCalls: Number(result.inboundCalls) || 0,
//                 outboundCalls: Number(result.outboundCalls) || 0,
//                 successPercentage,
//                 abandonPercentage,
//             };
//         });

//         return {
//             success: true,
//             report: formattedResults,
//             totalRecords,
//         };
//     } catch (err) {
//         throw err;
//     }
// };