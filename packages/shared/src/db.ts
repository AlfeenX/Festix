import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'festix',
      password: process.env.POSTGRES_PASSWORD || 'festix_secret',
      database: process.env.POSTGRES_DB || 'festix',
      max: 20,
      idleTimeoutMillis: 30000,
    };
    pool = new Pool(config);
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
