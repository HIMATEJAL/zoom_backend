import { col, fn, literal, Op } from "sequelize";
import { AuthenticatedPayload } from "../types/user.type";
import { AgentPerformanceAttributes, AgentPerformanceOutput, AgentPerformanceResponse, TeamReportSummary } from "../types/agent-performance.types";
import { AgentPerformance } from "../models/agent-performance.model";
import { getAccessToken } from "../utils/accessToken";
import commonAPI from "../config/commonAPI";
import { Team } from "../models/team.model";

export const refreshAgentPerformance = async (user: AuthenticatedPayload, from: string, to: string) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        let nextPageToken: string | undefined;
        const pageSize = 300;

        do {
            const queryParams = new URLSearchParams({
                from,
                to,
                page_size: pageSize.toString(),
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const response = await commonAPI(
                "GET",
                `/contact_center/analytics/dataset/historical/agent_performance?${queryParams.toString()}`,
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
                const validatedData = response.users.map((item: AgentPerformanceAttributes) => ({
                    engagement_id: item.engagement_id ? item.engagement_id : '',
                    start_time: item.start_time ? new Date(item.start_time) : null,
                    end_time: item.end_time ? new Date(item.end_time) : null,
                    direction: item.direction ? item.direction : '',
                    user_id: item.user_id ? item.user_id : '',
                    user_name: item.user_name ? item.user_name : '',
                    channel: item.channel ? item.channel : '',
                    channel_source: item.channel_source ? item.channel_source : '',
                    queue_id: item.queue_id ? item.queue_id : '',
                    queue_name: item.queue_name ? item.queue_name : '',
                    team_id: item.team_id ? item.team_id : '',
                    team_name: item.team_name ? item.team_name : '',
                    handled_count: item.handled_count ? item.handled_count : 0,
                    handle_duration: item.handle_duration ? item.handle_duration : 0,
                    direct_transfer_count: item.direct_transfer_count ? item.direct_transfer_count : 0,
                    warm_transfer_initiated_count: item.warm_transfer_initiated_count ? item.warm_transfer_initiated_count : 0,
                    warm_transfer_completed_count: item.warm_transfer_completed_count ? item.warm_transfer_completed_count : 0,
                    transfer_initiated_count: item.transfer_initiated_count ? item.transfer_initiated_count : 0,
                    transfer_completed_count: item.transfer_completed_count ? item.transfer_completed_count : 0,
                    warm_conference_count: item.warm_conference_count ? item.warm_conference_count : 0,
                    agent_offered_count: item.agent_offered_count ? item.agent_offered_count : 0,
                    agent_refused_count: item.agent_refused_count ? item.agent_refused_count : 0,
                    agent_missed_count: item.agent_missed_count ? item.agent_missed_count : 0,
                    ring_disconnect_count: item.ring_disconnect_count ? item.ring_disconnect_count : 0,
                    agent_declined_count: item.agent_declined_count ? item.agent_declined_count : 0,
                    agent_message_sent_count: item.agent_message_sent_count ? item.agent_message_sent_count : 0,
                    hold_count: item.hold_count ? item.hold_count : 0,
                    conversation_duration: item.conversation_duration ? item.conversation_duration : 0,
                    conference_duration: item.conference_duration ? item.conference_duration : 0,
                    conference_count: item.conference_count ? item.conference_count : 0,
                    hold_duration: item.hold_duration ? item.hold_duration : 0,
                    wrap_up_duration: item.wrap_up_duration ? item.wrap_up_duration : 0,
                    outbound_handled_count: item.outbound_handled_count ? item.outbound_handled_count : 0,
                    outbound_handle_duration: item.outbound_handle_duration ? item.outbound_handle_duration : 0,
                    warm_conference_duration: item.warm_conference_duration ? item.warm_conference_duration : 0,
                    warm_transfer_duration: item.warm_transfer_duration ? item.warm_transfer_duration : 0,
                    ring_duration: item.ring_duration ? item.ring_duration : 0,
                    agent_first_response_duration: item.agent_first_response_duration ? item.agent_first_response_duration : 0,
                    dial_duration: item.dial_duration ? item.dial_duration : 0,
                    inbound_conversation_duration: item.inbound_conversation_duration ? item.inbound_conversation_duration : 0,
                    inbound_handle_duration: item.inbound_handle_duration ? item.inbound_handle_duration : 0,
                    inbound_handled_count: item.inbound_handled_count ? item.inbound_handled_count : 0,
                    outbound_conversation_duration: item.outbound_conversation_duration ? item.outbound_conversation_duration : 0,
                }));

                try {
                    await AgentPerformance.bulkCreate(validatedData, {
                        ignoreDuplicates: true,
                        validate: true,
                    });
                } catch (bulkError) {
                    console.error('Failed to upsert data in AgentPerformance table:', bulkError);
                }

            } else {
                console.warn('No data fetched from API to upsert');
            }

        } while (nextPageToken);

    } catch (err) {
        throw err;
    }
};

export const fetchAgentPerformance = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    page: number = 1,
    count: number,
    format: string,
    agents: string[],
    channels: string[],
): Promise<AgentPerformanceResponse> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (agents && agents.length > 0) whereClause.user_name = { [Op.in]: agents };
        if (channels && channels.length > 0) whereClause.channel = { [Op.in]: channels };

        const existingData = await AgentPerformance.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshAgentPerformance(user, from, to);
        }

        const offset = (page - 1) * count;
        const data = await AgentPerformance.findAll({
            where: whereClause,
            attributes: [
                'engagement_id',
                'start_time',
                'direction',
                'user_name',
                'channel',
                'queue_name',
                'transfer_initiated_count',
                'transfer_completed_count',
                'hold_count',
                'conversation_duration',
                'wrap_up_duration',
                'ring_duration',
                'agent_first_response_duration',
            ],
            order: [['start_time', format]],
            limit: count,
            offset,
        });

        const totalRecords = await AgentPerformance.count({ where: whereClause });

        return {
            success: true,
            totalRecords,
            perfomance: data.map(record => ({
                engagement_id: record.engagement_id,
                start_time: record.start_time,
                direction: record.direction,
                user_name: record.user_name,
                channel: record.channel,
                queue_name: record.queue_name,
                transfer_initiated_count: record.transfer_initiated_count,
                transfer_completed_count: record.transfer_completed_count,
                hold_count: record.hold_count,
                conversation_duration: record.conversation_duration,
                wrap_up_duration: record.wrap_up_duration,
                ring_duration: record.ring_duration,
                agent_first_response_duration: record.agent_first_response_duration,
            })) as AgentPerformanceOutput[],
        };
    } catch (err) {
        throw err;
    }
};

export const generateGroupSummary = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    channels: string[],
    teams: string[],
    page: number = 1,
    count: number,
): Promise<AgentPerformanceResponse> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (channels && channels.length > 0) whereClause.channel = { [Op.in]: channels };

        const existingData = await AgentPerformance.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshAgentPerformance(user, from, to);
        }

        let teamWhereClause: any = {};

        if (teams && teams.length > 0) {
            teamWhereClause = {
                team_name: { [Op.in]: teams },
            };
        }

        const offset = (page - 1) * count;
        const teamData = await Team.findAll({
            where: teamWhereClause,
            attributes: ['team_name', 'team_members'],
            limit: count,
            offset,
        });

        const totalRecords = await Team.count({ where: teamWhereClause });

        const summaries: TeamReportSummary[] = [];

        for (const team of teamData) {
            const teamMembers = Array.isArray(team.team_members)
                ? team.team_members.map((member: any) => (typeof member === 'string' ? member : member.name)).filter(Boolean)
                : [];

            if (teamMembers.length === 0) {
                summaries.push({
                    team_name: team.team_name,
                    total_interactions: 0,
                    avg_handle_duration: 0,
                    total_hold_count: 0,
                    avg_wrap_up_duration: 0,
                    channels: [],
                    directions: [],
                    transfer_initiated: 0,
                    transfer_completed: 0,
                    queues: [],
                });
                continue;
            }

            const performances = await AgentPerformance.findAll({
                where: {
                    ...whereClause,
                    user_name: { [Op.in]: teamMembers },
                },
                attributes: [
                    [fn('COUNT', col('engagement_id')), 'total_interactions'],
                    [fn('AVG', col('handle_duration')), 'avg_handle_duration'],
                    [fn('SUM', col('hold_count')), 'total_hold_count'],
                    [fn('AVG', col('wrap_up_duration')), 'avg_wrap_up_duration'],
                    [literal('COALESCE(ARRAY_AGG(DISTINCT channel) FILTER (WHERE channel IS NOT NULL), ARRAY[]::varchar[])'), 'channels'],
                    [literal('COALESCE(ARRAY_AGG(DISTINCT direction) FILTER (WHERE direction IS NOT NULL), ARRAY[]::varchar[])'), 'directions'],
                    [literal('COALESCE(ARRAY_AGG(DISTINCT queue_name) FILTER (WHERE queue_name IS NOT NULL), ARRAY[]::varchar[])'), 'queues'],
                    [fn('SUM', col('transfer_initiated_count')), 'transfer_initiated'],
                    [fn('SUM', col('transfer_completed_count')), 'transfer_completed'],
                ],
                group: ['team_id'],
                raw: true,
            }) as unknown as TeamReportSummary[];

            const performance = performances[0] || {};

            summaries.push({
                team_name: team.team_name,
                total_interactions: Number(performance.total_interactions) || 0,
                avg_handle_duration: Math.round(Number(performance.avg_handle_duration)) || 0,
                total_hold_count: Number(performance.total_hold_count) || 0,
                avg_wrap_up_duration: Math.round(Number(performance.avg_wrap_up_duration)) || 0,
                channels: Array.isArray(performance.channels) ? performance.channels : [],
                directions: Array.isArray(performance.directions) ? performance.directions : [],
                transfer_initiated: Number(performance.transfer_initiated) || 0,
                transfer_completed: Number(performance.transfer_completed) || 0,
                queues: Array.isArray(performance.queues) ? performance.queues : [],
            });
        }

        return {
            success: true,
            report: summaries,
            totalRecords,
        };
    } catch (err) {
        throw err;
    }
};