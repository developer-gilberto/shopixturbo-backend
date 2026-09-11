export interface OrderItemBreakdown {
  itemId: number;
  itemName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number | null;
  unitGovernmentTaxesCents: number | null;
  itemGovernmentTaxesCents: number | null;
  revenueCents: number;
  totalCostCents: number | null;
  netProfitCents: number | null;
  isMatchedToProduct: boolean;
}

export interface OrderCostResult {
  orderSn: string;
  paymentMethod: string;
  totalAmountCents: number;
  shippingFeeCents: number;
  commissionFeeCents: number;
  productRevenueCents: number;
  totalGovernmentTaxesCents: number;
  itemsCostCents: number | null;
  totalCostCents: number | null;
  netProfitCents: number | null;
  marginPercent: number | null;
  hasPartialCostData: boolean;
  hasAnyCostData: boolean;
  itemsBreakdown: OrderItemBreakdown[];
}

export interface ProductCostResult {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenueCents: number;
  totalCostCents: number | null;
  netProfitCents: number | null;
  marginPercent: number | null;
  hasCostData: boolean;
}

export interface SummaryResult {
  totalOrders: number;
  totalRevenueCents: number;
  totalShippingCents: number;
  totalCommissionCents: number;
  totalItemsCostCents: number | null;
  totalCostCents: number | null;
  totalGovernmentTaxesCents: number;
  totalNetProfitCents: number | null;
  overallMarginPercent: number | null;
  ordersWithMissingCostData: string[];
  productsWithMissingCostData: number[];
  unmatchedItemSkus: string[];
}

export interface GetOrderEscrowDetails {
  userId: string;
  shopId: string;
  order_ids: string[];
}

// ─── Resposta da API Shopee: get_escrow_detail_batch ─────

export interface EscrowDetailItem {
  item_id: number;
  item_name: string;
  item_sku: string;
  model_sku: string;
  quantity_purchased: number;
  discounted_price: number;
  selling_price: number;
  original_price: number;
}

export interface EscrowOrderIncome {
  actual_shipping_fee: number;
  buyer_paid_shipping_fee: number;
  shopee_shipping_rebate: number;
  shipping_fee_discount_from_3pl: number;
  commission_fee: number;
  buyer_total_amount: number;
  cost_of_goods_sold: number;
  escrow_amount: number;
  items: EscrowDetailItem[];
  order_selling_price: number;
}

export interface EscrowBuyerPaymentInfo {
  buyer_payment_method: string;
  buyer_total_amount: number;
  merchant_subtotal: number;
  shipping_fee: number;
}

export interface OrderEscrowDetail {
  order_sn: string;
  buyer_user_name: string;
  buyer_payment_info: EscrowBuyerPaymentInfo;
  order_income: EscrowOrderIncome;
  return_order_sn_list: string[];
}

export interface EscrowDetailBatchResponse {
  escrow_detail: OrderEscrowDetail;
}
