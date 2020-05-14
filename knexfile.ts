// Update with your config settings.

require('tsconfig-paths/register');

import { db } from 'utils/db';

module.exports = {
  client: 'pg',
  connection: {
    database: db.name,
    host: db.host,
    user: db.user,
    password: db.password,
  },
  pool: {
    min: db.minConnections,
    max: db.maxConnections,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: 'src/migrations',
  },
};
