export interface ShopeeAccessTokenResponse {
  access_token: string;
  refresh_token: string;
  expire_in: number;
}

export interface SignedUrlData {
  path: string;
  accessToken?: string;
  shopId?: number;
}
