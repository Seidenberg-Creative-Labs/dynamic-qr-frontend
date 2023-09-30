import { FIREBASE_SERVER_CONFIG } from '$env/static/private';
import { FlarebaseAuth } from '@marplex/flarebase-auth';

export const app = new FlarebaseAuth(JSON.parse(FIREBASE_SERVER_CONFIG));
