import { constants } from './constants.config';

export const cache = {
  userMeTTL: 60 * 5, // 5 minutos em segundos
  userMeKey: (userId: string) => `user:me:${userId}`,

  shopeeAccessTokenTTL: constants.ONE_HOUR_IN_SECONDS * 3, // 3 horas em segundos
  shopeeAccessTokenKey: (shopId: string) => `shopee:access_token:${shopId}`,
};

export type Cache = typeof cache;
