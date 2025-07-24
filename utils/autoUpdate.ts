import axios from 'axios';
import commonAPI from '../config/commonAPI';
import { AgentQueue } from '../models/agent-queue.model';
import { AgentPerformance } from '../models/agent-performance.model';
import { AgentEngagement } from '../models/agent-engagement.model';
import { AgentTimecard } from '../models/agent-timecard.model';

const getPreviousDayRange = (): { start: string; end: string } => {
    const now = new Date();
    const previousDay = new Date(now);
    previousDay.setDate(now.getDate() - 7);
    const start = previousDay.toISOString().split('T')[0] + 'T00:00:00Z';
    const end = now.toISOString().split('T')[0] + 'T23:59:59Z';
    return { start, end };
};

const accessToken = async () => {
    const authString = Buffer.from(`${process.env.client_id}:${process.env.client_password}`).toString('base64');

    try {
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.account_id}`,
            {},
            {
                headers: {
                    Authorization: `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.access_token;
    } catch (err) {
        throw err;
    }
}

async function fetchAndSaveAgentQueue(token: string, queryParams: any): Promise<void> {
    try {

        let nextPageToken = '';
        let allData: any[] = [];
        do {
            if (nextPageToken) queryParams.set('next_page_token', nextPageToken);
            const result = await commonAPI('GET', `/contact_center/engagements?${queryParams.toString()}`, {}, {}, token);
            allData.push(...(result.engagements || []));
            nextPageToken = result.next_page_token || '';
        } while (nextPageToken);

        const flattenedData = allData.map((item: any) => ({
            engagement_id: item.engagement_id,
            direction: item.direction,
            start_time: item.start_time,
            end_time: item.end_time,
            channel_types: item.channel_types,
            consumer_number: item.consumers?.[0]?.consumer_number,
            consumer_id: item.consumers?.[0]?.consumer_id,
            consumer_display_name: item.consumers?.[0]?.consumer_display_name,
            flow_id: item.flows?.[0]?.flow_id,
            flow_name: item.flows?.[0]?.flow_name,
            cc_queue_id: item.queues?.[0]?.cc_queue_id,
            queue_name: item.queues?.[0]?.queue_name,
            user_id: item.agents?.[0]?.user_id,
            display_name: item.agents?.[0]?.display_name,
            channel: item.channels?.[0]?.channel,
            channel_source: item.channels?.[0]?.channel_source,
            queue_wait_type: item.queue_wait_type,
            duration: item.duration,
            flow_duration: item.flow_duration,
            waiting_duration: item.waiting_duration,
            handling_duration: item.handling_duration,
            wrap_up_duration: item.wrap_up_duration,
            voice_mail: item.voice_mail,
            talk_duration: item.talk_duration,
            transferCount: item.transferCount,
        }));

        await AgentQueue.bulkCreate(flattenedData, {
            ignoreDuplicates: true,
        });
    } catch (error) {
        throw error;
    }
}

async function fetchAndSaveAgentEngagement(token: string, queryParams: any): Promise<void> {
    try {

        let nextPageToken = '';
        let allData: any[] = [];
        do {
            if (nextPageToken) queryParams.set('next_page_token', nextPageToken);
            const response = await commonAPI("GET", `/contact_center/analytics/dataset/historical/engagement?${queryParams.toString()}`, {}, {}, token);
            allData.push(...(response.engagements || []));
            nextPageToken = response.next_page_token || '';
        } while (nextPageToken);

        const flattenedData = allData.map((item: any) => ({
            engagement_id: item.engagement_id,
            direction: item.direction,
            start_time: item.start_time,
            end_time: item.end_time,
            enter_channel: item.enter_channel,
            enter_channel_source: item.enter_channel_source,
            channel: item.channels[0]?.channel || '',
            channel_source: item.channels[0]?.channel_source || '',
            consumer: item.consumer?.consumer_name || '',
            dnis: item.dnis || '',
            ani: item.ani || '',
            queue_id: item.queues[0]?.queue_id || '',
            queue_name: item.queues[0]?.queue_name || '',
            user_id: item.users[0]?.user_id || '',
            user_name: item.users[0]?.user_name || '',
            duration: item.duration,
            hold_count: item.hold_count,
            warm_transfer_initiated_count: item.warm_transfer_initiated_count,
            warm_transfer_completed_count: item.warm_transfer_completed_count,
            direct_transfer_count: item.direct_transfer_count,
            transfer_initiated_count: item.transfer_initiated_count,
            transfer_completed_count: item.transfer_completed_count,
            warm_conference_count: item.warm_conference_count,
            conference_count: item.conference_count,
            abandoned_count: item.abandoned_count,
        }));

        await AgentEngagement.bulkCreate(flattenedData, { ignoreDuplicates: true });
    } catch (error) {
        throw error;
    }
}

async function fetchAndSaveAgentTimeCard(token: string, queryParams: any): Promise<void> {
    try {
        let nextPageToken = '';
        let allData: any[] = [];
        do {
            if (nextPageToken) queryParams.set('next_page_token', nextPageToken);
            const response = await commonAPI("GET", `/contact_center/analytics/dataset/historical/agent_timecard?${queryParams.toString()}`, {}, {}, token);
            allData.push(...(response.users || []));
            nextPageToken = response.next_page_token || '';
        } while (nextPageToken);

        await AgentTimecard.bulkCreate(allData, {
            ignoreDuplicates: true,
        });
    } catch (error) {
        throw error;
    }
}

async function fetchAndSaveAgentPerformance(token: string, queryParams: any): Promise<void> {
    try {
        let nextPageToken = '';
        let allData: any[] = [];
        do {
            if (nextPageToken) queryParams.set('next_page_token', nextPageToken);
            const response = await commonAPI('GET', `/contact_center/analytics/dataset/historical/agent_performance?${queryParams.toString()}`, {}, {}, token);
            allData.push(...(response.users || []));
            nextPageToken = response.next_page_token || '';
        } while (nextPageToken);

        await AgentPerformance.bulkCreate(allData, {
            ignoreDuplicates: true,
        });
    } catch (error) {
        throw error;
    }
}

// Main function to run all updates for the previous day
export async function runAutoUpdates(): Promise<void> {
    console.log('Starting Zoom auto-update task for previous day');

    try {
        const token = await accessToken();
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        const { start, end } = getPreviousDayRange();
        const queryParams = new URLSearchParams({
            from: start,
            to: end,
            page_size: '300',
        });

        const tasks = [
            fetchAndSaveAgentQueue(token, queryParams),
            fetchAndSaveAgentEngagement(token, queryParams),
            fetchAndSaveAgentTimeCard(token, queryParams),
            fetchAndSaveAgentPerformance(token, queryParams),
        ];

        const results = await Promise.allSettled(tasks);

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Task ${index + 1} failed:`, result.reason);
            }
        });

        if (results.every(result => result.status === 'fulfilled')) {
            console.log('Zoom auto-update task completed successfully');
        } else {
            throw new Error('Some tasks failed; check logs for details');
        }
    } catch (error) {
        throw error;
    }
}