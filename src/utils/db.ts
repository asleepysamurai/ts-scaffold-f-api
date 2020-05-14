/**
 * DB util
 *
 * Instantiates a connection pool and provides a singleton interface to it
 */

import { env } from 'utils/environment';

class DB {
  constructor(
    public name: string,
    public host: string,
    public user: string,
    public password: string,
    public minConnections: number = 2,
    public maxConnections: number = 10,
  ) {}
}

export const db = new DB(
  env.get('DB_NAME'),
  env.get('DB_HOST'),
  env.get('DB_USER'),
  env.get('DB_PASSWORD'),
  env.getAsInt('DB_MIN_CONNECTIONS'),
  env.getAsInt('DB_MAX_CONNECTIONS'),
);
