import axios from 'axios';
import { ZoomUser } from '../models/zoom.model';

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

export const getAccessToken = async (id: number) => {
    console.log('getAccessToken');

    const now = Date.now();
    if (accessToken && tokenExpiresAt && now < tokenExpiresAt) {
        return accessToken;
    }

    let user = await ZoomUser.findOne({ where: { userId: id, primary: true } });

    if (!user) {
        user = await ZoomUser.findOne({ where: { userId: id } });
    }

    if (!user) throw Object.assign(new Error('User not found!'), { status: 404 });

    const authString = Buffer.from(`${user.client_id}:${user.client_password}`).toString('base64');

    try {
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${user.account_id}`,
            {},
            {
                headers: {
                    Authorization: `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        accessToken = response.data.access_token;
        tokenExpiresAt = now + response.data.expires_in * 1000 - 60000;

        return accessToken;
    } catch (err) {
        throw err;
    }
};