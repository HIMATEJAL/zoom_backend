import commonAPI from "../config/commonAPI";
import { Agent } from "../models/agent.model";
import { AuthenticatedPayload } from "../types/user.type";
import { getAccessToken } from "../utils/accessToken";

export interface AgentResponse {
    user_name: string,
    user_id: string
}

export const fetchAgents = async (user: AuthenticatedPayload): Promise<AgentResponse[]> => {
    try {

        const existingData = await Agent.findAll({
            attributes: ['user_name'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshAgents(user);
        }

        const agents = await Agent.findAll();

        return agents.map((agent: Agent) => ({
            user_name: agent.user_name,
            user_id: agent.user_id,
        }));
    } catch (err) {
        throw err;
    }
};

export const refreshAgents = async (user: AuthenticatedPayload) => {
    try {
        const token = await getAccessToken(user.id);
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        let nextPageToken: string | undefined;

        do {
            const queryParams = new URLSearchParams({
                page_size: '300',
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const response = await commonAPI(
                "GET",
                `/contact_center/users?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!response.users || !Array.isArray(response.users)) {
                console.warn(`API returned no users or invalid data: ${JSON.stringify(response)}`);
                break;
            }

            nextPageToken = response.next_page_token;

            if (response.users?.length > 0) {
                const validatedData = response.users?.map((item: any) => ({
                    user_name: item.display_name ? item.display_name : '',
                    user_id: item.user_id ? item.user_id : ''
                }));

                try {
                    await Agent.bulkCreate(validatedData, {
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