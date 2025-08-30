import {
  Pool,
  PoolClient,
  PoolConfig,
  QueryConfig,
  QueryResultRow,
  QueryResult,
} from "pg";

export interface QueryOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export default class PostgeSQL {
  private pool: Pool;
  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async query<R extends QueryResultRow = any, I = any[]>(
    queryConfig: QueryConfig<I>,
    options?: QueryOptions
  ): Promise<QueryResult<R>> {
    try {
      const result = await this.pool.query<R, I>(queryConfig);
      return result;
    } catch (error: unknown) {
      let err = error;
      console.log(`Query failed:`, error);
      if (options && options.maxRetries && options.maxRetries > 0) {
        const delay: number =
          options.retryDelay && options.retryDelay > 0
            ? options.retryDelay
            : 1000;
        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
          try {
            console.log(`Query attempt ${attempt}, retrying...`);
            await this.sleep(delay);
            const result = await this.pool.query<R, I>(queryConfig);
            console.log(`Query attempt ${attempt} success`);
            return result;
          } catch (retryErr: unknown) {
            console.log(`Query attempt ${attempt} failed:`, retryErr);
            err = retryErr;
          }
        }
      }
      throw err;
    }
  }

  // public async transaction<T>(
  //   callback: (client: PoolClient) => Promise<T>,
  //   options?: QueryOptions
  // ) :Promise<T>{
  //   let client: PoolClient | null = null;
  //   try {
  //     client = await this.pool.connect();
  //     await client.query("BEGIN");
  //     await callback(client);
  //     await client.query("COMMIT");
  //   } catch (error: unknown) {
  //     if (client) await client.query("ROLLBACK");
  //     let err = error;
  //     console.log(`transaction failed:`, error);
  //     if (options && options.maxRetries && options.maxRetries > 0) {
  //       const delay: number =
  //         options.retryDelay && options.retryDelay > 0
  //           ? options.retryDelay
  //           : 1000;
  //       for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
  //         try {
  //           console.log(`transaction attempt ${attempt}, retrying...`);
  //           await this.sleep(delay);
  //           client = await this.pool.connect();
  //           const result = await callback(client);
  //           await client.query("COMMIT");
  //           console.log(`transaction attempt ${attempt} success`);
  //           return result;
  //         } catch (retryErr: unknown) {
  //           if (client) await client.query("ROLLBACK");
  //           console.log(`transaction attempt ${attempt} failed:`, retryErr);
  //           err = retryErr;
  //         }
  //       }
  //     }
  //     throw err;
  //   } finally {
  //     if (client) {
  //       client.release();
  //     }
  //   }
  // }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options?: QueryOptions
  ): Promise<T> {
    let client: PoolClient | null = null;
    try {
      client = await this.pool.connect();
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error: unknown) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackErr) {
          console.log("Rollback failed:", rollbackErr);
        }
      }

      let err = error;
      console.log(`transaction failed:`, error);

      if (options?.maxRetries && options.maxRetries > 0) {
        const delay: number =
          options.retryDelay && options.retryDelay > 0
            ? options.retryDelay
            : 1000;

        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
          try {
            console.log(`transaction attempt ${attempt}, retrying...`);
            await this.sleep(delay);

            // Release previous client if exists
            if (client) {
              client.release();
              client = null;
            }

            client = await this.pool.connect();
            await client.query("BEGIN");
            const result = await callback(client);
            await client.query("COMMIT");
            console.log(`transaction attempt ${attempt} success`);
            return result;
          } catch (retryErr: unknown) {
            if (client) {
              try {
                await client.query("ROLLBACK");
              } catch (rollbackErr) {
                console.log("Rollback failed in retry:", rollbackErr);
              }
            }
            console.log(`transaction attempt ${attempt} failed:`, retryErr);
            err = retryErr;
          }
        }
      }

      // Always throw error if we reach here
      throw err;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  public async healthCheck() {
    try {
      const start = Date.now();
      await this.pool.query("SELECT 1 as health");
      const duration = Date.now() - start;

      return {
        status: "healthy" as const,
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      };
    } catch (error: unknown) {
      return {
        status: "unhealthy" as const,
        error: (error as any).message,
        timestamp: new Date().toISOString(),
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      };
    }
  }

  async close() {
    console.log("Closing database connections...");

    if (this.pool) {
      await this.pool.end();
      console.log("Database connections closed");
    }
  }

  get poolStats() {
    return this.pool
      ? {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        }
      : null;
  }
}
