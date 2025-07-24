import { AgentResponse } from "../services/agent.service";

export interface AgentQueueAttributes {
    id?: number;
    start_time: string;
    end_time: string;
    duration: number;
    engagement_id: string;
    direction: string;
    channel: string;
    channel_source: string;
    consumer_id: string;
    consumer_display_name: string;
    consumer_number: string;
    flow_id: string;
    flow_name: string;
    cc_queue_id: string;
    queue_name: string;
    user_id: string;
    display_name: string;
    talk_duration: number;
    flow_duration: number;
    waiting_duration: number;
    handling_duration: number;
    wrap_up_duration: number;
    transfer_count: number;
}

export interface DetailedQueueReport {
    date: string;
    queueId: string;
    queueName: string;
    totalOffered: number;
    totalAnswered: number;
    abandonedCalls: number;
    acdTime: number;
    acwTime: number;
    agentRingTime: number;
    avgHandleTime: number;
    avgAcwTime: number;
    maxHandleTime: number;
    transferCount: number;
    voiceCalls: number;
    digitalInteractions: number;
}

export interface AbandonedCall {
    startTime: string;
    engagementId: string;
    direction: string | null;
    consumerNumber: string | null;
    consumerId: string | null;
    consumerDisplayName: string | null;
    queueName: string | null;
    channel: string | null;
    queueWaitType: string | null;
    waitingDuration: number;
}

export interface AgentAbandonedReport {
    startTime: string;
    engagementId: string;
    direction: string;
    consumerNumber: string;
    consumerId: string;
    consumerDisplayName: string;
    queueId: string;
    queueName: string;
    agentId: string;
    agentName: string;
    channel: string;
    queueWaitType: string;
    waitingDuration: number;
    voiceMail: number;
    transferCount: number;
}

export interface DetailedFlowReport {
    date: string;
    flowId: string;
    flowName: string;
    totalOffered: number;
    totalAnswered: number;
    abandonedCalls: number;
    acdTime: number;
    acwTime: number;
    agentRingTime: number;
    avgHandleTime: number;
    avgAcwTime: number;
    maxHandleTime: number;
    transferCount: number;
    voiceCalls: number;
    digitalInteractions: number;
    inboundCalls: number;
    outboundCalls: number;
    successPercentage: string;
    abandonPercentage: string;
}

export interface AgentQueueResponse<T = AgentQueueAttributes | DetailedQueueReport | AbandonedCall | AgentAbandonedReport | DetailedFlowReport> {
    report: T[];
    totalRecords: number;
    agents?: AgentResponse[];
    success: boolean;
}

export interface QueueRequestBody {
    from: string;
    to: string;
    page?: number;
    count: number;
    queues?: string[];
    agents?: string[];
    queueId?: string[];
}

export interface IntervalQueueRequestBody extends QueueRequestBody {
    interval: '15' | '30' | '60';
}

export interface AbandonedCallsRequestBody extends QueueRequestBody {
    direction?: string;
}

export interface AgentAbandonedReportRequestBody extends QueueRequestBody {
    directions?: string[];
}