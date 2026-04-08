import { MarketplaceType, ShopStatus } from 'src/generated/prisma/enums';
import { ShopCreateInput } from 'src/generated/prisma/models';

export interface ShopInfo {
  shop_name: string;
  region: string;
  status: ShopStatus;
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

export interface ShopFull {
  id: string;
  shop_name: string;
  description: string;
  shop_logo: string;
  marketplace: MarketplaceType;
  authorization_expiration: Date;
  authorized_in: Date;
  status: ShopStatus;
  invoice_issuer: string;
  region: string;
}
