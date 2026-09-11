import { Injectable } from '@nestjs/common';
import { Product } from 'src/generated/prisma/client';
import { OrderDetailDTO } from '../orders/orders-details.dto';
import type {
  EscrowOrderIncome,
  OrderCostResult,
  OrderEscrowDetail,
  OrderItemBreakdown,
  ProductCostResult,
  SummaryResult,
} from './orders-report.type';

/**
 * Calcula custos e lucro líquido cruzando pedidos vindos da API da Shopee
 * com o catálogo interno de produtos.
 *
 * Todos os valores monetários são em centavos (inteiros)
 * para evitar erros de ponto flutuante.
 * Use toCents() / fromCents() para converter.
 *
 * Não guarda estado — seguro para uso como singleton injetado.
 */
@Injectable()
export class OrdersReportCalculator {
  toCents(reais: number): number {
    return Math.round(reais * 100);
  }

  fromCents(cents: number): number {
    return cents / 100;
  }

  calculateShippingPaidBySellerCents(orderIncome: EscrowOrderIncome): number {
    return this.toCents(
      orderIncome.actual_shipping_fee -
        orderIncome.buyer_paid_shipping_fee -
        orderIncome.shopee_shipping_rebate -
        orderIncome.shipping_fee_discount_from_3pl,
    );
  }

  private buildIndex(products: Product[]): Map<string, Product> {
    return new Map(products.filter((p) => p.external_id !== null).map((p) => [p.external_id!, p]));
  }

  calculateProductCosts(orders: OrderDetailDTO[], products: Product[]): ProductCostResult[] {
    const index = this.buildIndex(products);

    const aggregated = new Map<
      number,
      {
        itemId: number;
        itemName: string;
        sku: string;
        quantitySold: number;
        revenueCents: number;
      }
    >();

    for (const order of orders) {
      for (const item of order.item_list) {
        const existing = aggregated.get(item.item_id);
        const priceCents = this.toCents(item.model_discounted_price);
        const qty = item.model_quantity_purchased;

        if (existing) {
          existing.quantitySold += qty;
          existing.revenueCents += priceCents * qty;
        } else {
          aggregated.set(item.item_id, {
            itemId: item.item_id,
            itemName: item.item_name,
            sku: item.item_sku,
            quantitySold: qty,
            revenueCents: priceCents * qty,
          });
        }
      }
    }

    return [...aggregated.values()].map((agg) => {
      const product = index.get(String(agg.itemId));
      const costCents = product?.cost_price_cents ?? null;
      const govTaxesCents = product?.government_taxes ?? null;
      const totalCostCents =
        costCents !== null ? costCents * agg.quantitySold + (govTaxesCents ?? 0) * agg.quantitySold : null;
      const netProfitCents = totalCostCents !== null ? agg.revenueCents - totalCostCents : null;
      const marginPercent =
        netProfitCents !== null && agg.revenueCents > 0 ? (netProfitCents / agg.revenueCents) * 100 : null;

      return {
        productId: product?.id ?? 'unmatched',
        productName: product?.name ?? agg.itemName,
        sku: agg.sku,
        quantitySold: agg.quantitySold,
        revenueCents: agg.revenueCents,
        totalCostCents,
        netProfitCents,
        marginPercent,
        hasCostData: costCents !== null,
      } satisfies ProductCostResult;
    });
  }

  private calculateOrderCost(order: OrderDetailDTO, index: Map<string, Product>): OrderCostResult {
    const shippingCents = this.toCents(order.estimated_shipping_fee);
    const commissionFeeCents = 0;
    let productRevenueCents = 0;
    let partialCostCents = 0;
    let itemsCostCents = 0;
    let totalGovernmentTaxesCents = 0;
    let hasAllCostData = true;
    let hasAnyCostData = false;
    const itemsBreakdown: OrderItemBreakdown[] = [];

    for (const item of order.item_list) {
      const product = index.get(String(item.item_id));
      const qty = item.model_quantity_purchased;
      const unitPriceCents = this.toCents(item.model_discounted_price);
      const revenueCents = unitPriceCents * qty;
      productRevenueCents += revenueCents;

      const unitCostCents = product?.cost_price_cents ?? null;
      const unitGovernmentTaxesCents = product?.government_taxes ?? null;

      const itemGovernmentTaxesCents = unitGovernmentTaxesCents !== null ? unitGovernmentTaxesCents * qty : null;

      if (itemGovernmentTaxesCents !== null) {
        totalGovernmentTaxesCents += itemGovernmentTaxesCents;
      }

      const itemTotalCostCents = unitCostCents !== null ? unitCostCents * qty + (itemGovernmentTaxesCents ?? 0) : null;

      const itemNetProfitCents = itemTotalCostCents !== null ? revenueCents - itemTotalCostCents : null;

      if (unitCostCents !== null) {
        hasAnyCostData = true;
        partialCostCents += itemTotalCostCents!;
        itemsCostCents += unitCostCents * qty;
      } else {
        hasAllCostData = false;
      }

      itemsBreakdown.push({
        itemId: item.item_id,
        itemName: item.item_name,
        sku: item.item_sku,
        quantity: qty,
        unitPriceCents,
        unitCostCents,
        unitGovernmentTaxesCents,
        itemGovernmentTaxesCents,
        revenueCents,
        totalCostCents: itemTotalCostCents,
        netProfitCents: itemNetProfitCents,
        isMatchedToProduct: product !== undefined,
      });
    }

    // custo total do pedido = custo dos itens (já inclui impostos) + frete
    const totalCostCents = hasAllCostData ? partialCostCents + shippingCents : null;
    const totalAmountCents = this.toCents(order.total_amount);
    const netProfitCents = totalCostCents !== null ? totalAmountCents - totalCostCents : null;
    const marginPercent =
      netProfitCents !== null && totalAmountCents > 0 ? (netProfitCents / totalAmountCents) * 100 : null;

    return {
      orderSn: order.order_sn,
      paymentMethod: order.payment_method,
      totalAmountCents,
      shippingFeeCents: shippingCents,
      commissionFeeCents,
      productRevenueCents,
      totalGovernmentTaxesCents,
      itemsCostCents: hasAllCostData ? itemsCostCents : null,
      totalCostCents,
      netProfitCents,
      marginPercent,
      hasPartialCostData: !hasAllCostData && hasAnyCostData,
      hasAnyCostData,
      itemsBreakdown,
    };
  }

  calculateAllOrders(orders: OrderDetailDTO[], products: Product[]): OrderCostResult[] {
    const index = this.buildIndex(products);
    return orders.map((o) => this.calculateOrderCost(o, index));
  }

  calculateOrdersFromEscrow(details: OrderEscrowDetail[], products: Product[]): OrderCostResult[] {
    const index = this.buildIndex(products);
    return details.map((detail) => this.calculateOrderCostFromEscrow(detail, index));
  }

  private calculateOrderCostFromEscrow(detail: OrderEscrowDetail, index: Map<string, Product>): OrderCostResult {
    const orderIncome = detail.order_income;
    const shippingCents = this.calculateShippingPaidBySellerCents(orderIncome);
    const commissionFeeCents = this.toCents(orderIncome.commission_fee);
    let productRevenueCents = 0;
    let partialCostCents = 0;
    let itemsCostCents = 0;
    let totalGovernmentTaxesCents = 0;
    let hasAllCostData = true;
    let hasAnyCostData = false;
    const itemsBreakdown: OrderItemBreakdown[] = [];

    for (const item of detail.order_income.items) {
      const product = index.get(String(item.item_id));
      const qty = item.quantity_purchased;
      const unitPriceCents = this.toCents(item.discounted_price);
      const revenueCents = unitPriceCents * qty;
      productRevenueCents += revenueCents;

      const unitCostCents = product?.cost_price_cents ?? null;
      const unitGovernmentTaxesCents = product?.government_taxes ?? null;

      const itemGovernmentTaxesCents = unitGovernmentTaxesCents !== null ? unitGovernmentTaxesCents * qty : null;

      if (itemGovernmentTaxesCents !== null) {
        totalGovernmentTaxesCents += itemGovernmentTaxesCents;
      }

      const itemTotalCostCents = unitCostCents !== null ? unitCostCents * qty + (itemGovernmentTaxesCents ?? 0) : null;

      const itemNetProfitCents = itemTotalCostCents !== null ? revenueCents - itemTotalCostCents : null;

      if (unitCostCents !== null) {
        hasAnyCostData = true;
        partialCostCents += itemTotalCostCents!;
        itemsCostCents += unitCostCents * qty;
      } else {
        hasAllCostData = false;
      }

      itemsBreakdown.push({
        itemId: item.item_id,
        itemName: item.item_name,
        sku: item.item_sku || item.model_sku || '',
        quantity: qty,
        unitPriceCents,
        unitCostCents,
        unitGovernmentTaxesCents,
        itemGovernmentTaxesCents,
        revenueCents,
        totalCostCents: itemTotalCostCents,
        netProfitCents: itemNetProfitCents,
        isMatchedToProduct: product !== undefined,
      });
    }

    const totalCostCents = hasAllCostData ? partialCostCents + shippingCents : null;
    const totalAmountCents = productRevenueCents;
    const netProfitCents = totalCostCents !== null ? totalAmountCents - totalCostCents : null;
    const marginPercent =
      netProfitCents !== null && totalAmountCents > 0 ? (netProfitCents / totalAmountCents) * 100 : null;

    return {
      orderSn: detail.order_sn,
      paymentMethod: detail.buyer_payment_info.buyer_payment_method,
      totalAmountCents,
      shippingFeeCents: shippingCents,
      commissionFeeCents,
      productRevenueCents,
      totalGovernmentTaxesCents,
      itemsCostCents: hasAllCostData ? itemsCostCents : null,
      totalCostCents,
      netProfitCents,
      marginPercent,
      hasPartialCostData: !hasAllCostData && hasAnyCostData,
      hasAnyCostData,
      itemsBreakdown,
    };
  }

  calculateSummary(orderResults: OrderCostResult[]): SummaryResult {
    let totalRevenueCents = 0;
    let totalShippingCents = 0;
    let totalCommissionCents = 0;
    let totalItemsCostCents = 0;
    let totalCostCents = 0;
    let totalGovernmentTaxesCents = 0;
    let canSumCosts = true;
    const ordersWithMissingCostData: string[] = [];
    const productsWithMissingCostData = new Set<number>();
    const unmatchedSkus = new Set<string>();

    for (const result of orderResults) {
      totalRevenueCents += result.totalAmountCents;
      totalShippingCents += result.shippingFeeCents;
      totalCommissionCents += result.commissionFeeCents;
      totalGovernmentTaxesCents += result.totalGovernmentTaxesCents;

      if (result.totalCostCents !== null && result.itemsCostCents !== null) {
        totalCostCents += result.totalCostCents;
        totalItemsCostCents += result.itemsCostCents;
      } else {
        canSumCosts = false;
        ordersWithMissingCostData.push(result.orderSn);
      }

      for (const item of result.itemsBreakdown) {
        if (!item.isMatchedToProduct) {
          unmatchedSkus.add(item.sku);
        }

        if (item.unitCostCents === null || item.unitGovernmentTaxesCents === null) {
          productsWithMissingCostData.add(item.itemId);
        }
      }
    }

    const finalCostCents = canSumCosts ? totalCostCents : null;
    const totalNetProfitCents = finalCostCents !== null ? totalRevenueCents - finalCostCents : null;
    const overallMarginPercent =
      totalNetProfitCents !== null && totalRevenueCents > 0 ? (totalNetProfitCents / totalRevenueCents) * 100 : null;

    return {
      totalOrders: orderResults.length,
      totalRevenueCents,
      totalShippingCents,
      totalCommissionCents,
      totalItemsCostCents: canSumCosts ? totalItemsCostCents : null,
      totalCostCents: finalCostCents,
      totalGovernmentTaxesCents,
      totalNetProfitCents,
      overallMarginPercent,
      ordersWithMissingCostData,
      productsWithMissingCostData: [...productsWithMissingCostData],
      unmatchedItemSkus: [...unmatchedSkus],
    };
  }
}
