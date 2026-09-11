import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class OrderItemBreakdownDTO {
  @ApiProperty({
    example: 885178235,
    description: 'ID do item na Shopee.',
  })
  item_id: number;

  @ApiProperty({
    example: 'Livro',
    description: 'Nome do item na Shopee.',
  })
  item_name: string;

  @ApiProperty({
    example: 'livro-sku',
    description: 'SKU do item.',
  })
  sku: string;

  @ApiProperty({
    example: 3,
    description: 'Quantidade comprada deste item no pedido.',
  })
  quantity: number;

  @ApiProperty({
    example: 10.0,
    description: 'Preço unitário de venda do item. (model_discounted_price da Shopee)',
  })
  unit_price: number;

  @ApiPropertyOptional({
    example: 5.0,
    description:
      'Preço unitário de custo do item cadastrado internamente. (cost_price_cents do produto ÷ 100). Null quando não cadastrado.',
  })
  unit_cost: number | null;

  @ApiPropertyOptional({
    example: 1.0,
    description:
      'Imposto unitário deste item. (government_taxes unitário do produto). Ex: R$ 1,00 por unidade. Null quando não cadastrado.',
  })
  unit_government_taxes: number | null;

  @ApiPropertyOptional({
    example: 3.0,
    description:
      'Total de impostos deste item no pedido. (unit_government_taxes × quantity). Ex: R$ 1,00 × 3 unidades = R$ 3,00. Null quando não cadastrado.',
  })
  total_government_taxes: number | null;

  @ApiProperty({
    example: 30.0,
    description: 'Receita total gerada por este item no pedido. (unit_price × quantity). Ex: R$ 10,00 × 3 = R$ 30,00.',
  })
  revenue: number;

  @ApiPropertyOptional({
    example: 18.0,
    description:
      'Custo total deste item no pedido. (unit_cost × quantity + total_government_taxes). Ex: R$ 5,00 × 3 + R$ 3,00 = R$ 18,00. Null quando unit_cost não cadastrado.',
  })
  total_cost: number | null;

  @ApiPropertyOptional({
    example: 12.0,
    description:
      'Lucro líquido deste item no pedido. (revenue - total_cost). Ex: R$ 30,00 - R$ 18,00 = R$ 12,00. Null quando unit_cost não cadastrado.',
  })
  net_profit: number | null;

  @ApiProperty({
    example: true,
    description:
      'Indica se o item foi encontrado no catálogo interno de produtos. False quando o produto não está cadastrado.',
  })
  is_matched_to_product: boolean;
}

export class OrderReportItemDTO {
  @ApiProperty({
    example: '260507Q2MDV2JG',
    description: 'Número identificador único do pedido na Shopee.',
  })
  order_sn: string;

  @ApiProperty({
    example: 'READY_TO_SHIP',
    description: 'Status atual do pedido na Shopee.',
  })
  order_status: string;

  @ApiProperty({
    example: 'Pix',
    description: 'Método de pagamento utilizado pelo comprador.',
  })
  payment_method: string;

  @ApiProperty({
    example: 93.79,
    description:
      'Valor total do pedido sem o frete. (soma de unit_price × quantity dos itens do pedido). Não inclui o frete pago pelo comprador.',
  })
  total_amount: number;

  @ApiProperty({
    example: 0,
    description:
      'Frete pago pelo vendedor (custo de envio líquido). (actual_shipping_fee - buyer_paid_shipping_fee - shopee_shipping_rebate - shipping_fee_discount_from_3pl da Shopee).',
  })
  shipping_paid_by_seller: number;

  @ApiProperty({
    example: 0,
    description: 'Comissão cobrada pela Shopee sobre o pedido. (commission_fee da Shopee).',
  })
  shopee_commission: number;

  @ApiProperty({
    example: 1.0,
    description:
      'Total de impostos de todos os itens do pedido. (soma de total_government_taxes de cada item). Ex: R$ 1,00 + R$ 2,00 = R$ 3,00.',
  })
  total_government_taxes: number;

  @ApiPropertyOptional({
    example: 82.79,
    description:
      'Custo de aquisição dos itens do pedido. (soma de unit_cost × quantity de cada item). Não inclui impostos nem frete. Null quando algum item não possui cost_price cadastrado.',
  })
  items_cost: number | null;

  @ApiPropertyOptional({
    example: 83.79,
    description:
      'Custo total do pedido para o vendedor. (soma dos custos de aquisição dos itens + impostos dos itens + frete pago pelo vendedor). Ex: R$ 82,79 (custo dos itens) + R$ 1,00 (frete) = R$ 83,79. Null quando algum item não possui cost_price cadastrado.',
  })
  total_cost: number | null;

  @ApiPropertyOptional({
    example: 10.66,
    description:
      'Margem de lucro do pedido em percentual. (net_profit_margin / total_amount × 100). Ex: R$ 10,00 / R$ 93,79 × 100 = 10,66%. Null quando net_profit_margin for null.',
  })
  margin_percent: number | null;

  @ApiPropertyOptional({
    example: 10.0,
    description:
      'Lucro líquido (margem) do pedido em dinheiro. (total_amount - total_cost). Ex: R$ 93,79 - R$ 83,79 = R$ 10,00. Null quando total_cost for null.',
  })
  net_profit_margin: number | null;

  @ApiProperty({
    example: false,
    description:
      'Indica se o pedido possui dados de custo parciais, ou seja, ao menos um item sem cost_price cadastrado e ao menos um com. Quando true, total_cost e net_profit_margin serão null.',
  })
  has_partial_cost_data: boolean;

  @ApiProperty({
    type: () => [OrderItemBreakdownDTO],
    description: 'Detalhamento de cada item do pedido com seus custos e lucros individuais.',
  })
  items_breakdown: OrderItemBreakdownDTO[];
}

export class OrdersReportSummaryDTO {
  @ApiProperty({
    example: 4,
    description: 'Total de pedidos incluídos no relatório.',
  })
  total_orders: number;

  @ApiProperty({
    example: 228.8,
    description: 'Receita total de todos os pedidos. (soma dos total_amount de cada pedido). Não inclui o frete.',
  })
  total_revenue: number;

  @ApiProperty({
    example: 58.8,
    description:
      'Total de frete pago pelo vendedor em todos os pedidos. (soma dos shipping_paid_by_seller de cada pedido).',
  })
  total_shipping: number;

  @ApiProperty({
    example: 21.2,
    description: 'Total de comissão da Shopee em todos os pedidos. (soma dos shopee_commission de cada pedido).',
  })
  total_shopee_commission: number;

  @ApiPropertyOptional({
    example: 124.0,
    description:
      'Custo de aquisição dos itens em todos os pedidos. (soma dos items_cost de cada pedido). Não inclui impostos nem frete. Null quando algum pedido tiver items_cost null.',
  })
  total_items_cost: number | null;

  @ApiPropertyOptional({
    example: 143.8,
    description:
      'Custo total de todos os pedidos. (soma dos total_cost de cada pedido). Inclui custo de aquisição, impostos e frete. Null quando algum pedido tiver total_cost null.',
  })
  total_cost: number | null;

  @ApiProperty({
    example: 0.17,
    description: 'Total de impostos de todos os pedidos. (soma dos total_government_taxes de cada pedido).',
  })
  total_government_taxes: number;

  @ApiPropertyOptional({
    example: 85.0,
    description:
      'Lucro líquido total de todos os pedidos. (total_revenue - total_cost). Null quando total_cost for null.',
  })
  total_net_profit: number | null;

  @ApiPropertyOptional({
    example: 37.15,
    description:
      'Margem de lucro geral em percentual. (total_net_profit / total_revenue × 100). Null quando total_net_profit for null.',
  })
  overall_margin_percent: number | null;

  @ApiProperty({
    example: ['260507Q2MDV2JG'],
    description:
      'Lista de order_sn dos pedidos que possuem ao menos um item sem cost_price cadastrado, impossibilitando o cálculo de total_cost e net_profit_margin para esses pedidos.',
  })
  orders_with_missing_cost_data: string[];

  @ApiProperty({
    type: () => [Number],
    example: [885178163, 885178164],
    description:
      'Lista de item_id dos produtos que não possuem cost_price ou government_taxes cadastrados, impossibilitando o cálculo de custo e lucro desses itens.',
  })
  products_with_missing_cost_data: number[];

  @ApiProperty({
    example: ['luminaria-sku'],
    description:
      'Lista de SKUs de itens que não foram encontrados no catálogo interno de produtos. Esses itens não possuem cost_price nem government_taxes.',
  })
  unmatched_item_skus: string[];
}

export class OrdersReportResponseDTO {
  @ApiProperty({
    type: () => [OrderReportItemDTO],
    description: 'Lista de pedidos com seus respectivos custos e lucros.',
  })
  orders: OrderReportItemDTO[];

  @ApiProperty({
    type: () => OrdersReportSummaryDTO,
    description: 'Totalizadores gerais de todos os pedidos do relatório.',
  })
  summary: OrdersReportSummaryDTO;
}

// ─── Resposta da API Shopee: get_escrow_detail_batch ─────
// Passthrough dos dados do escrow da Shopee (snake_case original).

export class EscrowDetailItemDTO {
  @ApiProperty({ example: 885178163, description: 'ID do item na Shopee.' })
  item_id: number;

  @ApiProperty({ example: 'Mouse', description: 'Nome do item.' })
  item_name: string;

  @ApiProperty({ example: 'mouse-sku', description: 'SKU do item.' })
  item_sku: string;

  @ApiProperty({ example: '', description: 'SKU da variação (model).' })
  model_sku: string;

  @ApiProperty({ example: 1, description: 'Quantidade comprada do item.' })
  quantity_purchased: number;

  @ApiProperty({ example: 69.8, description: 'Preço com desconto aplicado ao comprador.' })
  discounted_price: number;

  @ApiProperty({ example: 69.8, description: 'Preço de venda do item.' })
  selling_price: number;

  @ApiProperty({ example: 69.8, description: 'Preço original do item.' })
  original_price: number;
}

export class EscrowOrderIncomeDTO {
  @ApiProperty({ example: 9.62, description: 'Frete cobrado do comprador (repasse ao vendedor).' })
  actual_shipping_fee: number;

  @ApiProperty({ example: 9.62, description: 'Frete pago pelo comprador.' })
  buyer_paid_shipping_fee: number;

  @ApiProperty({ example: 103.41, description: 'Valor total pago pelo comprador.' })
  buyer_total_amount: number;

  @ApiProperty({ example: 93.79, description: 'Valor de custo dos produtos vendidos.' })
  cost_of_goods_sold: number;

  @ApiProperty({ example: 93.79, description: 'Valor em escrow (retido pela Shopee).' })
  escrow_amount: number;

  @ApiProperty({
    type: () => [EscrowDetailItemDTO],
    description: 'Itens do pedido com seus preços e quantidades.',
  })
  items: EscrowDetailItemDTO[];

  @ApiProperty({ example: 93.79, description: 'Preço de venda do pedido (produtos).' })
  order_selling_price: number;
}

export class EscrowBuyerPaymentInfoDTO {
  @ApiProperty({ example: 'Pix', description: 'Método de pagamento utilizado pelo comprador.' })
  buyer_payment_method: string;

  @ApiProperty({ example: 103.41, description: 'Valor total pago pelo comprador.' })
  buyer_total_amount: number;

  @ApiProperty({ example: 93.79, description: 'Subtotal dos produtos (sem frete).' })
  merchant_subtotal: number;

  @ApiProperty({ example: 9.62, description: 'Frete cobrado do comprador.' })
  shipping_fee: number;
}

export class EscrowDetailResponseDTO {
  @ApiProperty({ example: '2609032AWUS466', description: 'Número identificador único do pedido na Shopee.' })
  order_sn: string;

  @ApiProperty({ example: 'local_regress.br', description: 'Nome de usuário do comprador.' })
  buyer_user_name: string;

  @ApiProperty({
    type: () => EscrowBuyerPaymentInfoDTO,
    description: 'Informações de pagamento sob a ótica do comprador.',
  })
  buyer_payment_info: EscrowBuyerPaymentInfoDTO;

  @ApiProperty({
    type: () => EscrowOrderIncomeDTO,
    description: 'Resumo financeiro do pedido (receita, frete e itens).',
  })
  order_income: EscrowOrderIncomeDTO;

  @ApiProperty({ example: [], description: 'Lista de order_sn de devoluções associadas.' })
  return_order_sn_list: string[];
}

export class OrderEscrowDetailsDTO {
  @ApiProperty({
    example: '260507Q2MDV2JG',
    description: 'Número identificador único do pedido na Shopee.',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return [];
      return trimmed.includes(',')
        ? trimmed
            .split(',')
            .map((v: string) => v.trim())
            .filter((v: string) => v !== '')
        : [trimmed];
    }
    if (Array.isArray(value)) {
      return value.map((v: unknown) => (typeof v === 'string' ? v.trim() : v)).filter((v: unknown) => v !== '');
    }
    return value;
  })
  @IsArray({ message: 'order_sn deve ser um array de strings.' })
  @ArrayNotEmpty({ message: 'Você deve enviar pelo menos um order_sn.' })
  @IsString({ each: true, message: 'Todos os order_sn devem ser strings.' })
  order_sn: string[];
}
