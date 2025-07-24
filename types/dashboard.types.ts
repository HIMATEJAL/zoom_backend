export interface zoomDataAttributes {
    total_calls: number;
    inbound_calls: number;
    outbound_calls: number;
    missed_calls: number;
    abandoned_calls: number;
    avg_call_duration: number;
    total_channel_count: number;
    voice_channel_percentage: number;
    video_channel_percentage: number;
    chat_channel_percentage: number;
    email_channel_percentage: number;
    call_success_rate: number;
    avg_speed_to_answer: number;
    max_speed_to_answer: number,
    min_speed_to_answer: number,
    inbound_call_minutes: number;
    outbound_call_minutes: number;
    total_call_minutes: number;
    avg_inbound_call_duration: number;
    avg_outbound_call_duration: number;
}

export interface dashboardResponse {
    success: boolean;
    data: zoomDataAttributes;
}