import { MarketplaceType, Product } from 'src/generated/prisma/client';
import type { OrderDetailDTO, OrderItemDTO } from '../orders/orders-details.dto';
import type { OrderEscrowDetail } from './orders-report.type';
import { OrdersReportCalculator } from './orders-report-calculator.service';

describe('OrdersReportCalculator', () => {
  let calculator: OrdersReportCalculator;

  beforeEach(() => {
    calculator = new OrdersReportCalculator();
  });

  const baseProduct = (
    externalId: string,
    cost?: number,
    taxes?: number,
    overrides: Partial<Product> = {},
  ): Product => ({
    id: `prod-${externalId}`,
    marketplace: MarketplaceType.SHOPEE,
    category_id: 0,
    name: `Produto ${externalId}`,
    sku: `${externalId}-sku`,
    image_url: null,
    stock: 0,
    sale_price_cents: 3490,
    cost_price_cents: cost ?? null,
    government_taxes: taxes ?? null,
    external_id: externalId,
    external_created_at: null,
    external_updated_at: new Date(),
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    shop_id: 'shop-1',
    ...overrides,
  });

  const escrowDetail = (overrides?: Partial<OrderEscrowDetail>): OrderEscrowDetail => ({
    order_sn: '260830NDGSTMP6',
    buyer_user_name: 'local_regress.br',
    buyer_payment_info: {
      buyer_payment_method: 'Pix',
      buyer_total_amount: 68.51,
      merchant_subtotal: 58.89,
      shipping_fee: 9.62,
    },
    order_income: {
      actual_shipping_fee: 9.62,
      buyer_paid_shipping_fee: 9.62,
      shopee_shipping_rebate: 0,
      shipping_fee_discount_from_3pl: 0,
      commission_fee: 0,
      buyer_total_amount: 68.51,
      cost_of_goods_sold: 58.89,
      escrow_amount: 55.46,
      order_selling_price: 58.89,
      items: [
        {
          item_id: 885178163,
          item_name: 'Mouse',
          item_sku: 'mouse-sku',
          model_sku: '',
          quantity_purchased: 1,
          discounted_price: 34.9,
          selling_price: 34.9,
          original_price: 34.9,
        },
        {
          item_id: 885178164,
          item_name: 'Lanterna',
          item_sku: 'lanterna-sku',
          model_sku: '',
          quantity_purchased: 1,
          discounted_price: 23.99,
          selling_price: 23.99,
          original_price: 23.99,
        },
      ],
    },
    return_order_sn_list: [],
    ...overrides,
  });

  const baseOrderDetail = (overrides: Partial<OrderDetailDTO> = {}): OrderDetailDTO =>
    ({
      order_sn: '260830NDGSTMP6',
      order_status: 'COMPLETED',
      country: 'BR',
      total_amount: 68.51,
      estimated_shipping_fee: 9.62,
      payment_method: 'Pix',
      item_list: [
        {
          item_id: 885178163,
          item_name: 'Mouse',
          item_sku: 'mouse-sku',
          model_discounted_price: 34.9,
          model_quantity_purchased: 1,
          model_original_price: 34.9,
          order_item_id: 1,
          model_id: 1,
        },
        {
          item_id: 885178164,
          item_name: 'Lanterna',
          item_sku: 'lanterna-sku',
          model_discounted_price: 23.99,
          model_quantity_purchased: 1,
          model_original_price: 23.99,
          order_item_id: 2,
          model_id: 2,
        },
      ],
      ...overrides,
    }) as unknown as OrderDetailDTO;

  describe('toCents / fromCents', () => {
    it('converte reais em centavos arredondando', () => {
      expect(calculator.toCents(10)).toBe(1000);
      expect(calculator.toCents(10.999)).toBe(1100);
    });

    it('converte centavos de volta em reais', () => {
      expect(calculator.fromCents(1000)).toBe(10);
      expect(calculator.fromCents(3812)).toBe(38.12);
    });
  });

  describe('calculateShippingPaidBySellerCents', () => {
    it('calcula frete pago pelo vendedor (frete cobrado − frete pago pelo comprador − frete subsidiado pela Shopee − desconto 3PL).', () => {
      const cents = calculator.calculateShippingPaidBySellerCents({
        actual_shipping_fee: 15,
        buyer_paid_shipping_fee: 5.5,
        shopee_shipping_rebate: 2,
        shipping_fee_discount_from_3pl: 1,
        commission_fee: 0,
        buyer_total_amount: 68.51,
        cost_of_goods_sold: 58.89,
        escrow_amount: 55.46,
        order_selling_price: 58.89,
        items: [],
      });

      expect(cents).toBe(650);
    });

    it('retorna zero quando o comprador paga integralmente o frete (9.62 - 9.62 = 0)', () => {
      const cents = calculator.calculateShippingPaidBySellerCents(escrowDetail().order_income);

      expect(cents).toBe(0);
    });
  });

  describe('calculateOrdersFromEscrow', () => {
    it('calcula relatório a partir de dados do escrow sem custos registrados', () => {
      const products: Product[] = [baseProduct('885178163'), baseProduct('885178164')];

      const results = calculator.calculateOrdersFromEscrow([escrowDetail()], products);
      const summary = calculator.calculateSummary(results);

      const result = results[0];
      expect(result.orderSn).toBe('260830NDGSTMP6');
      expect(result.paymentMethod).toBe('Pix');
      expect(result.totalAmountCents).toBe(5889);
      expect(result.shippingFeeCents).toBe(0);
      expect(result.commissionFeeCents).toBe(0);
      expect(result.totalGovernmentTaxesCents).toBe(0);
      expect(result.itemsCostCents).toBeNull();
      expect(result.totalCostCents).toBeNull();
      expect(result.netProfitCents).toBeNull();
      expect(result.marginPercent).toBeNull();
      expect(result.hasPartialCostData).toBe(false);
      expect(result.itemsBreakdown).toHaveLength(2);
      expect(result.itemsBreakdown[0].isMatchedToProduct).toBe(true);
      expect(result.itemsBreakdown[0].unitCostCents).toBeNull();
      expect(result.itemsBreakdown[1].unitCostCents).toBeNull();

      expect(summary.totalOrders).toBe(1);
      expect(summary.totalRevenueCents).toBe(5889);
      expect(summary.totalShippingCents).toBe(0);
      expect(summary.totalCostCents).toBeNull();
      expect(summary.ordersWithMissingCostData).toEqual(['260830NDGSTMP6']);
      expect(summary.productsWithMissingCostData).toEqual([885178163, 885178164]);
    });

    it('soma unit_price × quantity dos itens como total_amount', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 885178163,
              item_name: 'Mouse',
              item_sku: 'mouse-sku',
              model_sku: '',
              quantity_purchased: 2,
              discounted_price: 69.8,
              selling_price: 69.8,
              original_price: 69.8,
            },
            {
              item_id: 885178164,
              item_name: 'Lanterna',
              item_sku: 'lanterna-sku',
              model_sku: '',
              quantity_purchased: 1,
              discounted_price: 23.99,
              selling_price: 23.99,
              original_price: 23.99,
            },
          ],
        },
      });

      const result = calculator.calculateOrdersFromEscrow([detail], [])[0];

      expect(result.totalAmountCents).toBe(16359);
    });

    it('calcula custos e lucros quando produtos possuem cost_price e government_taxes', () => {
      const products: Product[] = [baseProduct('885178163', 1500, 200), baseProduct('885178164', 1000, 150)];

      const results = calculator.calculateOrdersFromEscrow([escrowDetail()], products);
      const result = results[0];

      expect(result.totalGovernmentTaxesCents).toBe(350);
      expect(result.itemsCostCents).toBe(2500);
      expect(result.totalCostCents).toBe(2850);
      expect(result.netProfitCents).toBe(3039);
      expect(result.marginPercent).toBeCloseTo((3039 / 5889) * 100, 5);
      expect(result.hasPartialCostData).toBe(false);
      expect(result.itemsBreakdown[0].isMatchedToProduct).toBe(true);
      expect(result.itemsBreakdown[1].isMatchedToProduct).toBe(true);
    });

    it('marca dados parciais quando apenas um item possui custo', () => {
      const products: Product[] = [baseProduct('885178163', 1500, 200)];

      const results = calculator.calculateOrdersFromEscrow([escrowDetail()], products);
      const result = results[0];

      expect(result.hasPartialCostData).toBe(true);
      expect(result.hasAnyCostData).toBe(true);
      expect(result.totalCostCents).toBeNull();
      expect(result.netProfitCents).toBeNull();
    });

    it('usa fallback de sku vazio quando item_sku e model_sku são vazios', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 885178163,
              item_name: 'Mouse',
              item_sku: '',
              model_sku: '',
              quantity_purchased: 1,
              discounted_price: 34.9,
              selling_price: 34.9,
              original_price: 34.9,
            },
          ],
        },
      });

      const result = calculator.calculateOrdersFromEscrow([detail], [])[0];

      expect(result.itemsBreakdown[0].sku).toBe('');
    });

    it('usa model_sku como fallback quando item_sku é vazio', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 885178163,
              item_name: 'Mouse',
              item_sku: '',
              model_sku: 'modelo-x',
              quantity_purchased: 1,
              discounted_price: 34.9,
              selling_price: 34.9,
              original_price: 34.9,
            },
          ],
        },
      });

      const result = calculator.calculateOrdersFromEscrow([detail], [])[0];

      expect(result.itemsBreakdown[0].sku).toBe('modelo-x');
    });

    it('marca item como não correspondido quando o produto não existe no catálogo', () => {
      const result = calculator.calculateOrdersFromEscrow([escrowDetail()], [])[0];

      expect(result.itemsBreakdown.every((i) => i.isMatchedToProduct)).toBe(false);
      expect(result.itemsBreakdown.every((i) => i.unitCostCents === null)).toBe(true);
      expect(result.hasAnyCostData).toBe(false);
    });

    it('retorna marginPercent null quando o total dos itens é zero', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 885178163,
              item_name: 'Mouse',
              item_sku: 'mouse-sku',
              model_sku: '',
              quantity_purchased: 2,
              discounted_price: 0,
              selling_price: 0,
              original_price: 0,
            },
          ],
        },
      });
      const products: Product[] = [baseProduct('885178163', 1000, 100)];

      const result = calculator.calculateOrdersFromEscrow([detail], products)[0];

      expect(result.totalAmountCents).toBe(0);
      expect(result.marginPercent).toBeNull();
    });

    it('calcula frete pago pelo vendedor descontando frete do comprador e rebates', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          actual_shipping_fee: 15,
          buyer_paid_shipping_fee: 5.5,
          shopee_shipping_rebate: 2,
          shipping_fee_discount_from_3pl: 1,
        },
      });

      const result = calculator.calculateOrdersFromEscrow([detail], [])[0];

      expect(result.shippingFeeCents).toBe(650);
    });

    it('calcula comissão da shopee a partir de commission_fee', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          commission_fee: 5.99,
        },
      });

      const result = calculator.calculateOrdersFromEscrow([detail], [])[0];

      expect(result.commissionFeeCents).toBe(599);
    });

    it('multiplica custos e impostos pela quantidade comprada de um item', () => {
      const detail = escrowDetail({
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 885178163,
              item_name: 'Mouse',
              item_sku: 'mouse-sku',
              model_sku: '',
              quantity_purchased: 2,
              discounted_price: 34.9,
              selling_price: 34.9,
              original_price: 34.9,
            },
          ],
        },
      });

      const products: Product[] = [baseProduct('885178163', 1500, 200)];

      const result = calculator.calculateOrdersFromEscrow([detail], products)[0];

      // imposto do governo e custo unitário são por unidade → multiplicar pela quantidade
      expect(result.itemsBreakdown[0].unitGovernmentTaxesCents).toBe(200);
      expect(result.itemsBreakdown[0].itemGovernmentTaxesCents).toBe(400);
      expect(result.itemsBreakdown[0].totalCostCents).toBe(3400);
      expect(result.itemsBreakdown[0].revenueCents).toBe(6980);
      expect(result.itemsBreakdown[0].netProfitCents).toBe(3580);

      expect(result.totalGovernmentTaxesCents).toBe(400);
      expect(result.itemsCostCents).toBe(3000);
      expect(result.totalCostCents).toBe(3400);
      expect(result.totalAmountCents).toBe(6980);
      expect(result.netProfitCents).toBe(3580);
      expect(result.marginPercent).toBeCloseTo((3580 / 6980) * 100, 5);
    });
  });

  describe('calculateSummary', () => {
    it('soma custos quando todos os pedidos possuem dados de custo completos', () => {
      const products: Product[] = [baseProduct('885178163', 1500, 200), baseProduct('885178164', 1000, 150)];
      const detail = escrowDetail();

      const results = calculator.calculateOrdersFromEscrow([detail], products);
      const summary = calculator.calculateSummary(results);

      expect(summary.totalCostCents).toBe(2850);
      expect(summary.totalItemsCostCents).toBe(2500);
      expect(summary.totalCommissionCents).toBe(0);
      expect(summary.totalNetProfitCents).toBe(5889 - 2850);
      expect(summary.overallMarginPercent).toBeCloseTo(((5889 - 2850) / 5889) * 100, 5);
      expect(summary.ordersWithMissingCostData).toEqual([]);
      expect(summary.productsWithMissingCostData).toEqual([]);
      expect(summary.unmatchedItemSkus).toEqual([]);
    });

    it('torna totalCostCents null e lista pedidos com dados faltantes quando algum pedido não tem custo', () => {
      const detail = escrowDetail();
      const detailSemCusto = escrowDetail({
        order_sn: 'OUTRO-PEDIDO',
        order_income: {
          ...escrowDetail().order_income,
          items: [
            {
              item_id: 999999,
              item_name: 'Item sem produto',
              item_sku: 'unknown-sku',
              model_sku: '',
              quantity_purchased: 1,
              discounted_price: 10,
              selling_price: 10,
              original_price: 10,
            },
          ],
        },
      });
      const products: Product[] = [baseProduct('885178163', 1500, 200), baseProduct('885178164', 1000, 150)];

      const results = calculator.calculateOrdersFromEscrow([detail, detailSemCusto], products);
      const summary = calculator.calculateSummary(results);

      expect(summary.totalCostCents).toBeNull();
      expect(summary.totalItemsCostCents).toBeNull();
      expect(summary.totalNetProfitCents).toBeNull();
      expect(summary.overallMarginPercent).toBeNull();
      expect(summary.ordersWithMissingCostData).toEqual(['OUTRO-PEDIDO']);
      expect(summary.productsWithMissingCostData).toEqual([999999]);
    });

    it('coleta skus não correspondidos no resumo', () => {
      const detailSemProduto = escrowDetail({ order_sn: 'SEM-PRODUTO' });

      const results = calculator.calculateOrdersFromEscrow([detailSemProduto], []);
      const summary = calculator.calculateSummary(results);

      expect(summary.unmatchedItemSkus).toEqual(['mouse-sku', 'lanterna-sku']);
      expect(summary.ordersWithMissingCostData).toEqual(['SEM-PRODUTO']);
      expect(summary.productsWithMissingCostData).toEqual([885178163, 885178164]);
    });
  });

  describe('calculateProductCosts', () => {
    it('não corresponde itens a produtos que possuem external_id nulo', () => {
      const orders = [
        baseOrderDetail({
          item_list: [
            {
              item_id: 999,
              item_name: 'Produto sem external',
              item_sku: 'no-ext-sku',
              model_discounted_price: 10,
              model_quantity_purchased: 1,
              order_item_id: 1,
              model_id: 1,
            },
          ] as OrderItemDTO[],
        }),
      ];
      const products: Product[] = [baseProduct('999', 1500, 200, { external_id: null })];

      const result = calculator.calculateProductCosts(orders, products);
      const noExt = result.find((p) => p.sku === 'no-ext-sku')!;

      expect(noExt.hasCostData).toBe(false);
      expect(noExt.totalCostCents).toBeNull();
      expect(noExt.productId).toBe('unmatched');
    });

    it('calcula custos agregados por produto com custo registrado', () => {
      const orders = [baseOrderDetail()];
      const products: Product[] = [baseProduct('885178163', 1500, 200), baseProduct('885178164', 1000, 150)];

      const result = calculator.calculateProductCosts(orders, products);
      const mouse = result.find((p) => p.sku === 'mouse-sku')!;

      expect(mouse.hasCostData).toBe(true);
      expect(mouse.totalCostCents).toBe(1700);
      expect(mouse.netProfitCents).toBe(3490 - 1700);
      expect(mouse.marginPercent).toBeCloseTo(((3490 - 1700) / 3490) * 100, 5);
    });

    it('marca produtos sem custo como hasCostData false e productId unmatched', () => {
      const orders = [
        baseOrderDetail({
          item_list: [
            {
              item_id: 999,
              item_name: 'Desconhecido',
              item_sku: 'unk-sku',
              model_discounted_price: 10,
              model_quantity_purchased: 1,
              order_item_id: 1,
              model_id: 1,
            },
          ] as OrderItemDTO[],
        }),
      ];
      const result = calculator.calculateProductCosts(orders, []);

      const unk = result.find((p) => p.sku === 'unk-sku')!;
      expect(unk.productId).toBe('unmatched');
      expect(unk.hasCostData).toBe(false);
      expect(unk.totalCostCents).toBeNull();
      expect(unk.netProfitCents).toBeNull();
    });
  });

  describe('calculateAllOrders', () => {
    it('calcula custos a partir de OrderDetailDTO', () => {
      const products: Product[] = [baseProduct('885178163', 1500, 200), baseProduct('885178164', 1000, 150)];

      const results = calculator.calculateAllOrders([baseOrderDetail()], products);
      const result = results[0];

      expect(result.orderSn).toBe('260830NDGSTMP6');
      expect(result.totalGovernmentTaxesCents).toBe(350);
      expect(result.itemsCostCents).toBe(2500);
      expect(result.totalCostCents).toBe(3812);
      expect(result.netProfitCents).toBe(3039);
    });
  });
});
