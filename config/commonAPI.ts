import axios, { AxiosRequestConfig } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const base_url = 'https://api.zoom.us/v2';

const commonAPI = async <T>(httpMethod: HttpMethod, endpoint: string, reqBody: object = {}, options: AxiosRequestConfig = {}, token?: string) => {
    try {
        const reqConfig: AxiosRequestConfig = {
            method: httpMethod,
            url: `${base_url}${endpoint}`,
            data: reqBody,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            ...options,
        }
        const result = await axios(reqConfig);
        return result.data;
    } catch (err: any) {
        Object.assign(new Error(err.message), { status: err.status || err.response.status })
    }
}

export default commonAPI