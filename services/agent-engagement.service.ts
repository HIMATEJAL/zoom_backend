import { Op } from "sequelize";
import commonAPI from "../config/commonAPI";
import { AgentEngagement } from "../models/agent-engagement.model";
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";
import { AgentEngagementOutput, AgentEngagementResponse } from "../types/agent-engagement.types";

export const fetchAgentEngagement = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    page: number = 1,
    count: number,
    format: string,
    channels: string[],
    agents: string[],
): Promise<AgentEngagementResponse> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (channels && channels.length > 0) whereClause.enter_channel = { [Op.in]: channels };
        if (agents && agents.length > 0) whereClause.user_name = { [Op.in]: agents };

        const existingData = await AgentEngagement.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshAgentEngagement(user, from, to);
        }

        const offset = (page - 1) * count;
        const data = await AgentEngagement.findAll({
            where: whereClause,
            attributes: [
                'engagement_id',
                'direction',
                'start_time',
                'enter_channel',
                'consumer_name',
                'dnis',
                'ani',
                'queue_name',
                'user_name',
                'duration',
                'hold_count',
                'hold_duration',
                'warm_transfer_initiated_count',
                'warm_transfer_completed_count',
                'direct_transfer_count',
                'transfer_initiated_count',
                'transfer_completed_count',
                'warm_conference_count',
                'conference_count',
                'abandoned_count',
            ],
            order: [['start_time', format]],
            limit: count,
            offset,
        });

        const totalRecords = await AgentEngagement.count({ where: whereClause });

        return {
            success: true,
            totalRecords,
            records: data.map(record => ({
                engagement_id: record.engagement_id || '',
                direction: record.direction || 0,
                start_time: record.start_time || '',
                enter_channel: record.enter_channel || '',
                consumer_name: record.consumer_name || '',
                dnis: record.dnis || '',
                ani: record.ani || '',
                queue_name: record.queue_name || '',
                user_name: record.user_name || '',
                duration: record.duration || 0,
                hold_count: record.hold_count || 0,
                hold_duration: record.hold_duration || 0,
                warm_transfer_initiated_count: record.warm_transfer_initiated_count || 0,
                warm_transfer_completed_count: record.warm_transfer_completed_count || 0,
                direct_transfer_count: record.direct_transfer_count || 0,
                transfer_initiated_count: record.transfer_initiated_count || 0,
                transfer_completed_count: record.transfer_completed_count || 0,
                warm_conference_count: record.warm_conference_count || 0,
                conference_count: record.conference_count || 0,
                abandoned_count: record.abandoned_count || 0,
            })) as AgentEngagementOutput[],
        };
    } catch (err) {
        throw err;
    }
};

export const refreshAgentEngagement = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
) => {
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

            const response = await commonAPI(
                "GET",
                `/contact_center/analytics/dataset/historical/engagement?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (response.engagements.length > 0) {
                const validatedData = response.engagements.map((item: any) => ({
                    engagement_id: item.engagement_id || '',
                    direction: item.direction || '',
                    start_time: item.start_time ? new Date(item.start_time) : null,
                    end_time: item.end_time ? new Date(item.end_time) : null,
                    enter_channel: item.enter_channel || '',
                    enter_channel_source: item.enter_channel_source || '',
                    channel: item.channels?.[0]?.channel || '',
                    channel_source: item.channels?.[0]?.channel_source || '',
                    consumer_name: item.consumer_name || '',
                    consumer_email: item.consumer_email || '',
                    dnis: item.dnis || '',
                    ani: item.ani || '',
                    queue_id: item.queues?.map((q: any) => q.queue_id).filter(Boolean).join(',') || '',
                    queue_name: item.queues?.map((q: any) => q.queue_name).filter(Boolean).join(',') || '',
                    user_id: item.users?.map((u: any) => u.user_id).filter(Boolean).join(',') || '',
                    user_name: item.users?.map((u: any) => u.user_name).filter(Boolean).join(',') || '',
                    duration: item.duration || 0,
                    handle_duration: item.handle_duration || 0,
                    conversation_duration: item.conversation_duration || 0,
                    hold_count: item.hold_count || 0,
                    hold_duration: item.hold_duration || 0,
                    warm_transfer_initiated_count: item.warm_transfer_initiated_count || 0,
                    warm_transfer_completed_count: item.warm_transfer_completed_count || 0,
                    direct_transfer_count: item.direct_transfer_count || 0,
                    transfer_initiated_count: item.transfer_initiated_count || 0,
                    transfer_completed_count: item.transfer_completed_count || 0,
                    warm_conference_count: item.warm_conference_count || 0,
                    conference_count: item.conference_count || 0,
                    abandoned_count: item.abandoned_count || 0,
                }));

                try {
                    await AgentEngagement.bulkCreate(validatedData, {
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