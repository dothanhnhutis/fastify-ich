declare module "fastify" {
  interface FastifyInstance {
    pg: PostgeSQL;
    query: <R extends QueryResultRow = any, I = any[]>(
      queryConfig: QueryConfig<I>,
      options?: QueryOptions
    ) => Promise<QueryResult<R>>;
    transaction: <T>(
      callback: (client: PoolClient) => Promise<T>,
      options?: QueryOptions
    ) => Promise<T>;
  }
  interface FastifyRequest {
    users: UserRepo;
    roles: RoleRepo;
    warehouses: WarehouseRepo;
    packagings: PackagingRepo;
    packagingTransactions: PackagingTransactionRepo;
  }
}
export {};
