export const cache = {
  ROUTE_ME_TTL: 60 * 5, // 5 minutos

  ROUTE_ME_KEY: (userId: string) => `user:me:${userId}`,
};

export type Cache = typeof cache;
