import { createClient, type ResultSet, type InStatement, type InArgs } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}

const client = createClient({ url, authToken });

export const db = {
  execute(sql: string, args?: InArgs): Promise<ResultSet> {
    if (args !== undefined) {
      return client.execute({ sql, args });
    }
    return client.execute(sql);
  },
  batch(statements: InStatement[]): Promise<ResultSet[]> {
    return client.batch(statements);
  },
};

export function rowsToObjects<T = Record<string, unknown>>(result: ResultSet): T[] {
  return result.rows as T[];
}
