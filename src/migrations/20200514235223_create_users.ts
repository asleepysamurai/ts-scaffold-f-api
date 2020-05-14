import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  return Promise.all([
    knex.schema.createTable('users', (table) => {
      table.string('id').primary();
      table.string('email');
      table.string('password');
      table.string('api_key');
      table.bigInteger('_created_at');
      table.bigInteger('_updated_at');
      table.bigInteger('_deleted_at');
      table.bigInteger('_verified_at');
    }),
  ]);
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('users');
}
