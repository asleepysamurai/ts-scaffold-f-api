/**
 * Application Entry Point
 */

import { env } from 'utils/environment';

console.log(env.get('NODE_ENV'), env.get('APP_SERVER_PORT'), env.get('APP_SERVER_HOST'));
