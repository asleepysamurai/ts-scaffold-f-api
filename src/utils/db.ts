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
  private readonly radixForIdConversion: number = 36;

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
    const currentTime = Date.now().toString(this.radixForIdConversion);
    const randomKey = (await promisifiedRandomBytes(numBytes)).toString('base64');
    const urlSafeRandomKey = randomKey.replace(/\//g, '-').replace(/\+/g, '_');

    return currentTime + delimiter + urlSafeRandomKey;
  }

  getCreatedAtFromId(id: string, delimiter: string = '-'): number {
    return parseInt(id.split(delimiter)[0], this.radixForIdConversion);
  }

  async insert(
    table: string,
    record: { [key: string]: any },
    {
      idField = 'id',
      recordCanUpdate = true,
      trx,
    }: { idField?: string; recordCanUpdate?: boolean; trx?: Knex.Transaction },
  ): Promise<string> {
    const now = Date.now();

    const insertRecord = Object.assign(
      {},
      record,
      {
        _created_at: now,
        [idField as string]: await this.getId(),
      },
      recordCanUpdate ? { _updated_at: now } : {},
    );

    const action: Knex.QueryBuilder<any, string[]> = this.knex(table)
      .returning(idField as string)
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
    {
      where,
      select,
      limit,
      trx,
    }: {
      where?: { [key: string]: any };
      select?: string[];
      limit?: number;
      trx?: Knex.Transaction;
    } = {},
  ): Promise<Array<{ [key: string]: any }>> {
    const query = this.knex(table);
    this.applyOptionsToQueryBuilder(query, { where, select, limit, trx });
    query.whereNull('_deleted_at');

    const records = await query;
    return records;
  }

  async getOne(
    table: string,
    {
      where,
      select,
      trx,
    }: {
      where?: { [key: string]: any };
      select?: string[];
      trx?: Knex.Transaction;
    } = {},
  ): Promise<any> {
    return (await this.get(table, { where, select, limit: 1, trx }))?.[0];
  }

  private applyOptionsToQueryBuilder(
    queryBuilder: Knex.QueryBuilder,
    {
      where,
      select,
      limit,
      trx,
    }: {
      where?: { [key: string]: any };
      select?: string[];
      limit?: number;
      trx?: Knex.Transaction;
    } = {},
  ): Knex.QueryBuilder {
    queryBuilder.whereNull('_deleted_at');

    if (where) {
      queryBuilder.andWhere(where);
    }

    if (select) {
      queryBuilder.returning(select);
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    if (trx) {
      queryBuilder.transacting(trx);
    }

    return queryBuilder;
  }

  async delete(
    table: string,
    {
      where,
      select,
      limit,
      trx,
      recordCanUpdate = true,
    }: {
      where: { [key: string]: any };
      select?: string[];
      limit?: number;
      trx?: Knex.Transaction;
      recordCanUpdate?: boolean;
    },
  ): Promise<any> {
    const query = this.applyOptionsToQueryBuilder(
      this.knex(table).update(
        Object.assign(
          { _deleted_at: Date.now() },
          recordCanUpdate ? { _updated_at: Date.now() } : {},
        ),
      ),
      { where, select, limit, trx },
    );

    const result = await query;
    return result;
  }

  async update(
    table: string,
    {
      update,
      where,
      select,
      limit,
      trx,
      recordCanUpdate = true,
    }: {
      where: { [key: string]: any };
      update: { [key: string]: any };
      select?: string[];
      limit?: number;
      trx?: Knex.Transaction;
      recordCanUpdate?: boolean;
    },
  ): Promise<any> {
    if (recordCanUpdate) {
      update._updated_at = Date.now();
    }

    const query = this.applyOptionsToQueryBuilder(this.knex(table).update(update), {
      where,
      select,
      limit,
      trx,
    });

    const result = await query;
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
