import { Op, fn, col, literal } from "sequelize";
import commonAPI from "../config/commonAPI";
import { AgentPerformance } from "../models/agent-performance.model";
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";
import { zoomDataAttributes } from "../types/dashboard.types";

const fetchPerfomanceData = async (user: AuthenticatedPayload, from: string, to: string) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        console.log(`Starting refreshAgentPerformance for period ${from} to ${to}`);

        let apiData: any[] = [];
        let nextPageToken: string | undefined;

        // Fetch all pages from the API
        do {
            const queryParams = new URLSearchParams({
                from,
                to,
                page_size: '300',
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            console.log(`Fetching API data with params: ${queryParams.toString()}`);
            const response = await commonAPI(
                "GET",
                `/contact_center/analytics/dataset/historical/agent_performance?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!response.users || !Array.isArray(response.users)) {
                console.warn(`API returned no users or invalid data: ${JSON.stringify(response)}`);
                break;
            }

            console.log(`Received ${response.users.length} records from API`);
            apiData = [...apiData, ...response.users];
            nextPageToken = response.next_page_token;

        } while (nextPageToken);

        const totalRecords = apiData.length;
        console.log(`Total records fetched from API: ${totalRecords}`);

        if (apiData.length > 0) {
            // Validate and transform data to match model schema
            const validatedData = apiData.map((item: any) => ({
                engagement_id: item.engagement_id || '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                direction: item.direction || '',
                user_id: item.user_id || '',
                user_name: item.user_name || '',
                channel: item.channel || '',
                channel_source: item.channel_source || '',
                queue_id: item.queue_id || '',
                queue_name: item.queue_name || '',
                team_id: item.team_id || '',
                team_name: item.team_name || '',
                handled_count: item.handled_count || 0,
                handle_duration: item.handle_duration || 0,
                direct_transfer_count: item.direct_transfer_count || 0,
                warm_transfer_initiated_count: item.warm_transfer_initiated_count || 0,
                warm_transfer_completed_count: item.warm_transfer_completed_count || 0,
                transfer_initiated_count: item.transfer_initiated_count || 0,
                transfer_completed_count: item.transfer_completed_count || 0,
                warm_conference_count: item.warm_conference_count || 0,
                agent_offered_count: item.agent_offered_count || 0,
                agent_refused_count: item.agent_refused_count || 0,
                agent_missed_count: item.agent_missed_count || 0,
                ring_disconnect_count: item.ring_disconnect_count || 0,
                agent_declined_count: item.agent_declined_count || 0,
                agent_message_sent_count: item.agent_message_sent_count || 0,
                hold_count: item.hold_count || 0,
                conference_count: item.conference_count || 0,
                wrap_up_duration: item.wrap_up_duration || 0,
                outbound_handled_count: item.outbound_handled_count || 0,
                outbound_handle_duration: item.outbound_handle_duration || 0,
                dial_duration: item.dial_duration || 0,
                conversation_duration: item.conversation_duration || null,
                outbound_conversation_duration: item.outbound_conversation_duration || null,
            }));

            try {
                await AgentPerformance.bulkCreate(validatedData, {
                    ignoreDuplicates: true,
                    validate: true,
                });
                console.log(`Successfully upserted ${validatedData.length} records to AgentPerformance`);
            } catch (bulkError) {
                console.error('Failed to upsert data in AgentPerformance table:', bulkError);
            }

        } else {
            console.warn('No data fetched from API to upsert');
        }

    } catch (err) {
        throw err;
    }
}

export const agentPerformanceData = async (user: AuthenticatedPayload, from: string, to: string): Promise<zoomDataAttributes> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        const existingData = await AgentPerformance.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await fetchPerfomanceData(user, from, to);
        }

        const data = await AgentPerformance.findAll({
            where: whereClause,
            attributes: [
                [fn('COUNT', col('engagement_id')), 'total_calls'],
                [fn('SUM', literal(`CASE WHEN "direction" = 'inbound' THEN 1 ELSE 0 END`)), 'inbound_calls'],
                [fn('SUM', literal(`CASE WHEN "direction" = 'outbound' THEN 1 ELSE 0 END`)), 'outbound_calls'],
                [fn('SUM', col('agent_missed_count')), 'missed_calls'],
                [fn('SUM', col('ring_disconnect_count')), 'abandoned_calls'],
                [fn('ROUND', fn('AVG', literal(`"conversation_duration" / 60000.0`)), 2), 'avg_call_duration'],
                [fn('COUNT', fn('DISTINCT', col('channel'))), 'total_channel_count'],
                [literal(`ROUND(SUM(CASE WHEN "channel" = 'voice' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT("engagement_id"), 0), 0)`), 'voice_channel_percentage'],
                [literal(`ROUND(SUM(CASE WHEN "channel" = 'video' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT("engagement_id"), 0), 0)`), 'video_channel_percentage'],
                [literal(`ROUND(SUM(CASE WHEN "channel" = 'messaging' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT("engagement_id"), 0), 0)`), 'chat_channel_percentage'],
                [literal(`ROUND(SUM(CASE WHEN "channel" = 'email' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT("engagement_id"), 0), 0)`), 'email_channel_percentage'],
                [literal(`ROUND(SUM("handled_count") * 100.0 / NULLIF(SUM("agent_offered_count"), 0), 0)`), 'call_success_rate'],
                [fn('ROUND', fn('AVG', literal(`"dial_duration" / 1000.0`)), 2), 'avg_speed_to_answer'],
                [fn('ROUND', fn('MAX', literal(`"dial_duration" / 1000.0`)), 2), 'max_speed_to_answer'],
                [fn('ROUND', fn('MIN', literal(`"dial_duration" / 1000.0`)), 2), 'min_speed_to_answer'],
                [literal(`ROUND(SUM(CASE WHEN "direction" = 'inbound' THEN "conversation_duration" / 60000.0 ELSE 0 END), 2)`), 'inbound_call_minutes'],
                [literal(`ROUND(SUM(CASE WHEN "direction" = 'outbound' THEN "conversation_duration" / 60000.0 ELSE 0 END), 2)`), 'outbound_call_minutes'],
                [literal(`ROUND(SUM("conversation_duration" / 60000.0), 2)`), 'total_call_minutes'],
                [literal(`ROUND(SUM(CASE WHEN "direction" = 'inbound' THEN "conversation_duration" / 60000.0 ELSE 0 END) / NULLIF(SUM(CASE WHEN "direction" = 'inbound' THEN 1 ELSE 0 END), 0), 2)`), 'avg_inbound_call_duration'],
                [literal(`ROUND(SUM(CASE WHEN "direction" = 'outbound' THEN "conversation_duration" / 60000.0 ELSE 0 END) / NULLIF(SUM(CASE WHEN "direction" = 'outbound' THEN 1 ELSE 0 END), 0), 2)`), 'avg_outbound_call_duration'],
            ],
            raw: true,
        }) as unknown as zoomDataAttributes[];;

        if (!data || data.length === 0) {
            return {
                total_calls: 0,
                inbound_calls: 0,
                outbound_calls: 0,
                missed_calls: 0,
                abandoned_calls: 0,
                avg_call_duration: 0,
                total_channel_count: 0,
                voice_channel_percentage: 0,
                video_channel_percentage: 0,
                chat_channel_percentage: 0,
                email_channel_percentage: 0,
                call_success_rate: 0,
                avg_speed_to_answer: 0,
                max_speed_to_answer: 0,
                min_speed_to_answer: 0,
                inbound_call_minutes: 0,
                outbound_call_minutes: 0,
                total_call_minutes: 0,
                avg_inbound_call_duration: 0,
                avg_outbound_call_duration: 0,
            };
        }

        return data[0];
    } catch (err) {
        throw err;
    }
}