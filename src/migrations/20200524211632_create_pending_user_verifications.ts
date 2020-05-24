import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('pending_user_verifications', (table) => {
    table.string('code').primary();
    table.string('user_id');
    table.bigInteger('_created_at');
    table.bigInteger('_deleted_at');
  });

  await knex.schema.raw(
    'CREATE UNIQUE INDEX user_id__deleted_at ON pending_user_verifications(user_id, _deleted_at) WHERE _deleted_at IS NOT NULL',
  );
  await knex.schema.raw(
    'CREATE UNIQUE INDEX user_id ON pending_user_verifications(user_id) WHERE _deleted_at IS NULL',
  );
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable('pending_user_verifications');
}
