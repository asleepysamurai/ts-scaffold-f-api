import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('sessions', (table) => {
    table.string('id').primary();
    table.string('user_id');
    table.bigInteger('_created_at');
    table.bigInteger('_deleted_at');
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable('sessions');
}
