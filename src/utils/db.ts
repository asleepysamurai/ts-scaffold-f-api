/**
 * DB util
 *
 * Instantiates a connection pool and provides a singleton interface to it
 */

import { env } from 'utils/environment';
import Knex from 'knex';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

const promisifiedRandomBytes = promisify(randomBytes);

class DB {
  private knex: Knex;

  constructor(
    public name: string,
    public host: string,
    public user: string,
    public password: string,
    public minConnections: number = 2,
    public maxConnections: number = 10,
  ) {
    this.knex = Knex({
      client: 'pg',
      connection: {
        database: this.name,
        host: this.host,
        user: this.user,
        password: this.password,
      },
      pool: {
        min: this.minConnections,
        max: this.maxConnections,
      },
    });
  }

  async getId(numBytes: number = 6, delimiter: string = '-'): Promise<string> {
    const currentTime = Date.now().toString(36);
    const randomKey = (await promisifiedRandomBytes(numBytes)).toString('base64');
    const urlSafeRandomKey = randomKey.replace(/\//g, '-').replace(/\+/g, '_');

    return currentTime + delimiter + urlSafeRandomKey;
  }

  async insert(
    table: string,
    record: { [key: string]: any },
    options: { idField?: string; recordCanUpdate?: boolean } = {},
    trx?: Knex.Transaction,
  ): Promise<string> {
    const defaultOptions = { idField: 'id', recordCanUpdate: true };
    options = Object.assign({}, defaultOptions, options);

    const now = Date.now();

    const insertRecord = Object.assign(
      {},
      record,
      {
        _created_at: now,
        [options.idField as string]: await this.getId(),
      },
      options.recordCanUpdate ? { _updated_at: now } : {},
    );

    const action: Knex.QueryBuilder<any, string[]> = this.knex(table)
      .returning(options.idField as string)
      .insert(insertRecord);

    if (action && trx) {
      action.transacting(trx as Knex.Transaction);
    }

    const [id] = await action;
    return id;
  }

  async transact(action: (trx: Knex.Transaction) => any) {
    return this.knex.transaction(async (trx) => {
      await Promise.resolve(action(trx));
    });
  }

  async get(
    table: string,
    where?: { [key: string]: any },
    select?: string[],
    limit?: number,
  ): Promise<Array<{ [key: string]: any }>> {
    const action = this.knex(table);

    if (where) {
      action.where(where);
    }

    if (select) {
      action.select(select);
    }

    if (limit) {
      action.limit(limit);
    }

    action.whereNull('_deleted_at');

    const records = await action;
    return records;
  }

  async getOne(table: string, where?: { [key: string]: any }, select?: string[]): Promise<any> {
    return (await this.get(table, where, select, 1))?.[0];
  }

  async delete(
    table: string,
    where: { [key: string]: any },
    select?: string[],
    limit?: number,
    trx?: Knex.Transaction,
    recordCanUpdate: boolean = true,
  ): Promise<any> {
    const action = this.knex(table)
      .update(
        Object.assign(
          { _deleted_at: Date.now() },
          recordCanUpdate ? { _updated_at: Date.now() } : {},
        ),
      )
      .where(where);

    if (select) {
      action.returning(select);
    }

    if (limit) {
      action.limit(limit);
    }

    if (trx) {
      action.transacting(trx);
    }

    const result = await action;
    return result;
  }

  async update(
    table: string,
    where: { [key: string]: any },
    update: { [key: string]: any },
    select?: string[],
    limit?: number,
    trx?: Knex.Transaction,
    recordCanUpdate: boolean = true,
  ): Promise<any> {
    if (recordCanUpdate) {
      update._updated_at = Date.now();
    }

    const action = this.knex(table).update(update).where(where);

    if (select) {
      action.returning(select);
    }

    if (limit) {
      action.limit(limit);
    }

    if (trx) {
      action.transacting(trx);
    }

    const result = await action;
    return result;
  }
}

export const db = new DB(
  env.get('DB_NAME'),
  env.get('DB_HOST'),
  env.get('DB_USER'),
  env.get('DB_PASSWORD'),
  env.getAsInt('DB_MIN_CONNECTIONS'),
  env.getAsInt('DB_MAX_CONNECTIONS'),
);
