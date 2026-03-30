import { ShopCreateInput } from 'src/generated/prisma/models';

export interface ShopInfo {
  shop_name: string;
  region: string;
  status: string;
  auth_time: number;
  expire_time: number;
}

export interface ShopProfile {
  shop_logo: string;
  description: string;
  shop_name: string;
  invoice_issuer: string;
}

export interface ShopCreate extends Omit<ShopCreateInput, 'user'> {
  user_id: string;
}
