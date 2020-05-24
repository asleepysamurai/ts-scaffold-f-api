import * as Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('email');
    table.string('password');
    table.string('api_key');
    table.bigInteger('_created_at');
    table.bigInteger('_updated_at');
    table.bigInteger('_deleted_at');
    table.bigInteger('_verified_at');
  });

  await knex.schema.raw(
    'CREATE UNIQUE INDEX email__deleted_at ON users(email, _deleted_at) WHERE _deleted_at IS NOT NULL',
  );
  await knex.schema.raw('CREATE UNIQUE INDEX email ON users(email) WHERE _deleted_at IS NULL');
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable('users');
}
