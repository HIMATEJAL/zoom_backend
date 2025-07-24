import { col, fn, Op } from "sequelize";
import { AgentPerformance } from "../models/agent-performance.model";
import { AgentTimecard } from "../models/agent-timecard.model";
import { AuthenticatedPayload } from "../types/user.type";
import { PerformanceAttributes, TimecardAttributes, TeamReportSummary, AgentEngagementAttributes, AgentLoginReport } from "../types/zoom.type";
import { getAccessToken } from "../utils/accessToken";
import commonAPI from "../config/commonAPI";
import { Team } from "../models/team.model";
import { AgentEngagement } from "../models/agent-engagement.model";

export const listAllUsers = async (user: AuthenticatedPayload) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        const result = await commonAPI("GET", '/contact_center/users', {}, {}, token);
        return result.users?.map((user: any) => user.display_name);
    } catch (err) {
        throw err;
    }
};

export const generateGroupSummary = async (
    user: AuthenticatedPayload,
    from: string,
    to: string,
    team_name?: string,
    channel?: string
): Promise<TeamReportSummary[]> => {
    try {
        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (channel) whereClause.channel = channel;

        const existingData = await AgentPerformance.findAll({
            where: whereClause,
            attributes: ['engagement_id'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshGroupSummary(user, from, to);
        }

        let teams = await Team.findAll({
            attributes: ['team_name', 'team_members'],
        });

        if (team_name) {
            teams = teams.filter(team => team.team_name === team_name);
        }

        const summaries: TeamReportSummary[] = [];

        for (const team of teams) {
            const teamMembers = team.team_members.map((member: any) => member.name);
            const performances = await AgentPerformance.findAll({
                where: {
                    ...whereClause,
                    user_name: { [Op.in]: teamMembers },
                },
                attributes: [
                    'channel',
                    'direction',
                    'handle_duration',
                    'hold_count',
                    'wrap_up_duration',
                    'transfer_initiated_count',
                    'transfer_completed_count',
                    'queue_name',
                    'user_name',
                ],
            });

            const totalInteractions = performances.length;
            const totalHandleDuration = performances.reduce((sum, p) => sum + (p.handle_duration || 0), 0);
            const avgHandleDuration = totalInteractions > 0 ? totalHandleDuration / totalInteractions : 0;
            const totalHoldCount = performances.reduce((sum, p) => sum + (p.hold_count || 0), 0);
            const avgWrapUpDuration = totalInteractions > 0
                ? performances.reduce((sum, p) => sum + (p.wrap_up_duration || 0), 0) / totalInteractions
                : 0;
            const transferInitiated = performances.reduce((sum, p) => sum + (p.transfer_initiated_count || 0), 0);
            const transferCompleted = performances.reduce((sum, p) => sum + (p.transfer_completed_count || 0), 0);

            const channels = [...new Set(performances.map(p => p.channel).filter(Boolean))] as string[];
            const directions = [...new Set(performances.map(p => p.direction).filter(Boolean))] as string[];
            const queues = [...new Set(performances.map(p => p.queue_name).filter(Boolean))] as string[];

            summaries.push({
                team_name: team.team_name,
                total_interactions: totalInteractions,
                avg_handle_duration: Math.round(avgHandleDuration),
                total_hold_count: totalHoldCount,
                avg_wrap_up_duration: Math.round(avgWrapUpDuration),
                channels,
                directions,
                transfer_initiated: transferInitiated,
                transfer_completed: transferCompleted,
                queues,
            });
        }

        return summaries;
    } catch (err) {
        throw err;
    }
};

export const fetchAllTeams = async () => {
    try {
        const result = await Team.findAll({
            attributes: ['team_name'],
        });
        return result;
    } catch (err) {
        throw err;
    }
};

export const refreshGroupSummary = async (
    user: AuthenticatedPayload,
    from: string,
    to: string
): Promise<TeamReportSummary[]> => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        await AgentPerformance.destroy({
            where: {
                start_time: { [Op.between]: [from, to] },
            },
        });

        let apiData: any[] = [];
        let nextPageToken: string | undefined;
        const pageSize = 1000;

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

            apiData = [...apiData, ...(response.users || [])];
            nextPageToken = response.next_page_token;

        } while (nextPageToken);

        if (apiData.length > 0) {
            await AgentPerformance.bulkCreate(apiData, {
                ignoreDuplicates: true,
            });
        }

        let teams = await Team.findAll({
            attributes: ['team_name', 'team_members'],
        });

        const summaries: TeamReportSummary[] = [];

        for (const team of teams) {
            const teamMembers = team.team_members.map((member: any) => member.name);
            const performances = apiData.filter((item: any) => teamMembers.includes(item.user_name));

            const totalInteractions = performances.length;
            const totalHandleDuration = performances.reduce((sum: number, p: any) => sum + (p.handle_duration || 0), 0);
            const avgHandleDuration = totalInteractions > 0 ? totalHandleDuration / totalInteractions : 0;
            const totalHoldCount = performances.reduce((sum: number, p: any) => sum + (p.hold_count || 0), 0);
            const avgWrapUpDuration = totalInteractions > 0
                ? performances.reduce((sum: number, p: any) => sum + (p.wrap_up_duration || 0), 0) / totalInteractions
                : 0;
            const transferInitiated = performances.reduce((sum: number, p: any) => sum + (p.transfer_initiated_count || 0), 0);
            const transferCompleted = performances.reduce((sum: number, p: any) => sum + (p.transfer_completed_count || 0), 0);

            const channels = [...new Set(performances.map((p: any) => p.channel).filter(Boolean))] as string[];
            const directions = [...new Set(performances.map((p: any) => p.direction).filter(Boolean))] as string[];
            const queues = [...new Set(performances.map((p: any) => p.queue_name).filter(Boolean))] as string[];

            summaries.push({
                team_name: team.team_name,
                total_interactions: totalInteractions,
                avg_handle_duration: Math.round(avgHandleDuration),
                total_hold_count: totalHoldCount,
                avg_wrap_up_duration: Math.round(avgWrapUpDuration),
                channels,
                directions,
                transfer_initiated: transferInitiated,
                transfer_completed: transferCompleted,
                queues,
            });
        }

        return summaries.slice(0, 10);
    } catch (err) {
        throw err;
    }
};