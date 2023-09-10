import { FIREBASE_SERVER_CONFIG } from '$env/static/private';
import { FlarebaseAuth } from '@marplex/flarebase-auth';

console.log('server', JSON.parse(FIREBASE_SERVER_CONFIG));
export const app = new FlarebaseAuth(JSON.parse(FIREBASE_SERVER_CONFIG));
console.log(app);
