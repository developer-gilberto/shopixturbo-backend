import { ApiProperty } from '@nestjs/swagger';

export class AttributeValueDTO {
  @ApiProperty({ example: 0 })
  value_id: number;

  @ApiProperty({ example: 'Branco' })
  original_value_name: string;

  @ApiProperty({ example: '' })
  value_unit: string;
}

export class PriceInfoDTO {
  @ApiProperty({ example: 'BRL' })
  currency: string;

  @ApiProperty({ example: 99.9 })
  original_price: number;

  @ApiProperty({ example: 79.9 })
  current_price: number;
}

export class DimensionDTO {
  @ApiProperty({ example: 20 })
  package_length: number;

  @ApiProperty({ example: 15 })
  package_width: number;

  @ApiProperty({ example: 10 })
  package_height: number;
}

export class LogisticDTO {
  @ApiProperty({ example: 6 })
  logistic_id: number;

  @ApiProperty({ example: 'Sandbox Shopee Xpress' })
  logistic_name: string;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: 0 })
  size_id: number;

  @ApiProperty({ example: false })
  is_free: boolean;

  @ApiProperty({ example: 9.62 })
  estimated_shipping_fee: number;
}

export class PreOrderDTO {
  @ApiProperty({ example: false })
  is_pre_order: boolean;

  @ApiProperty({ example: 2 })
  days_to_ship: number;
}

export class BrandDTO {
  @ApiProperty({ example: 0 })
  brand_id: number;

  @ApiProperty({ example: '' })
  original_brand_name: string;
}

export class FieldDTO {
  @ApiProperty({ example: 'text' })
  field_type: string;

  @ApiProperty({ example: 'Descrição do produto...' })
  text: string;
}

export class SummaryInfoDTO {
  @ApiProperty({ example: 46 })
  total_reserved_stock: number;

  @ApiProperty({ example: 46 })
  total_available_stock: number;
}

export class SellerStockDTO {
  @ApiProperty({ example: 'BRZ' })
  location_id: string;

  @ApiProperty({ example: 46 })
  stock: number;

  @ApiProperty({ example: true })
  if_saleable: boolean;
}

export class ShopeeStockDTO {
  @ApiProperty({ example: 'BRZ' })
  location_id: string;

  @ApiProperty({ example: 46 })
  stock: number;
}

export class AdvanceStockDTO {
  @ApiProperty({ example: 0 })
  sellable_advance_stock: number;

  @ApiProperty({ example: 0 })
  in_transit_advance_stock: number;
}

export class TagDTO {
  @ApiProperty({ example: false })
  kit: boolean;
}

export class PurchaseLimitDTO {
  @ApiProperty({ example: 0 })
  min_purchase_limit: number;
}

export class AttributeDTO {
  @ApiProperty({ example: 53380 })
  attribute_id: number;

  @ApiProperty({ example: 'Colour' })
  original_attribute_name: string;

  @ApiProperty({ type: [AttributeValueDTO] })
  attribute_value_list: AttributeValueDTO[];

  @ApiProperty({ example: true })
  is_mandatory: boolean;
}

export class ImageDTO {
  @ApiProperty({ example: ['5fdae8d81b91e3f05d1e4e49'], type: [String] })
  image_id_list: string[];

  @ApiProperty({ example: ['https://cf.shopee.com.br/file/br-11134207-81z1k-mngb6gk43r40jj'], type: [String] })
  image_url_list: string[];

  @ApiProperty({ example: '1:1' })
  image_ratio: string;
}

export class PromotionImageDTO {
  @ApiProperty({ example: [], type: [String] })
  image_id_list: string[];

  @ApiProperty({ example: [], type: [String] })
  image_url_list: string[];
}

export class TaxInfoDTO {
  @ApiProperty({ example: '6109.10.00' }) ncm: string;
  @ApiProperty({ example: '5102' }) same_state_cfop: string;
  @ApiProperty({ example: '6102' }) diff_state_cfop: string;
  @ApiProperty({ example: '101' }) csosn: string;
  @ApiProperty({ example: '0' }) origin: string;
  @ApiProperty({ example: '9999999' }) cest: string;
  @ApiProperty({ example: 'UN' }) measure_unit: string;
  @ApiProperty({ example: '01' }) pis_cofins_cst: string;
  @ApiProperty({ example: '0' }) federal_state_taxes: string;
  @ApiProperty({ example: '1' }) operation_type: string;
  @ApiProperty({ example: '0' }) ex_tipi: string;
  @ApiProperty({ example: '' }) fci_num: string;
  @ApiProperty({ example: '' }) recopi_num: string;
  @ApiProperty({ example: '' }) additional_info: string;
}

export class ComplaintPolicyDTO {
  @ApiProperty({ example: '7 dias' })
  warranty_time: string;

  @ApiProperty({ example: false })
  exclude_entrepreneur_warranty: boolean;

  @ApiProperty({ example: 0 })
  complaint_address_id: number;

  @ApiProperty({ example: '' })
  additional_information: string;
}

export class ExtendedDescriptionDTO {
  @ApiProperty({ type: [FieldDTO] })
  field_list: FieldDTO[];
}

export class DescriptionInfoDTO {
  @ApiProperty({ type: ExtendedDescriptionDTO })
  extended_description: ExtendedDescriptionDTO;
}

export class StockInfoDTO {
  @ApiProperty({ type: SummaryInfoDTO })
  summary_info: SummaryInfoDTO;

  @ApiProperty({ type: [SellerStockDTO] })
  seller_stock: SellerStockDTO[];

  @ApiProperty({ type: [ShopeeStockDTO] })
  shopee_stock: ShopeeStockDTO[];

  @ApiProperty({ type: AdvanceStockDTO })
  advance_stock: AdvanceStockDTO;
}

export class ItemDTO {
  @ApiProperty({ example: 885177996 })
  item_id: number;

  @ApiProperty({ example: 100022 })
  category_id: number;

  @ApiProperty({ example: 'Mesa 4 cadeiras' })
  item_name: string;

  @ApiProperty({ example: 'mesa-sku' })
  item_sku: string;

  @ApiProperty({ example: 1776198667 })
  create_time: number;

  @ApiProperty({ example: 1776198667 })
  update_time: number;

  @ApiProperty({ type: [AttributeDTO] })
  attribute_list: AttributeDTO[];

  @ApiProperty({ type: [PriceInfoDTO] })
  price_info: PriceInfoDTO[];

  @ApiProperty({ type: ImageDTO })
  image: ImageDTO;

  @ApiProperty({ example: '2000' })
  weight: string;

  @ApiProperty({ type: DimensionDTO })
  dimension: DimensionDTO;

  @ApiProperty({ type: [LogisticDTO] })
  logistic_info: LogisticDTO[];

  @ApiProperty({ type: PreOrderDTO })
  pre_order: PreOrderDTO;

  @ApiProperty({ example: 'new' })
  condition: string;

  @ApiProperty({ example: '' })
  size_chart: string;

  @ApiProperty({ example: 'NORMAL' })
  item_status: string;

  @ApiProperty({ example: true })
  has_model: boolean;

  @ApiProperty({ example: 0 })
  promotion_id: number;

  @ApiProperty({ example: false })
  has_promotion: boolean;

  @ApiProperty({ type: BrandDTO })
  brand: BrandDTO;

  @ApiProperty({ example: 0 })
  item_dangerous: number;

  @ApiProperty({ type: TaxInfoDTO })
  tax_info: TaxInfoDTO;

  @ApiProperty({ type: ComplaintPolicyDTO })
  complaint_policy: ComplaintPolicyDTO;

  @ApiProperty({ type: DescriptionInfoDTO })
  description_info: DescriptionInfoDTO;

  @ApiProperty({ example: 'extended' })
  description_type: string;

  @ApiProperty({ type: StockInfoDTO })
  stock_info_v2: StockInfoDTO;

  @ApiProperty({ example: '' })
  gtin_code: string;

  @ApiProperty({ example: 0 })
  size_chart_id: number;

  @ApiProperty({ type: PromotionImageDTO })
  promotion_image: PromotionImageDTO;

  @ApiProperty({ example: '' })
  deboost: string;

  @ApiProperty({ type: Object })
  compatibility_info: Record<string, unknown>;

  @ApiProperty({ example: 0 })
  authorised_brand_id: number;

  @ApiProperty({ example: false })
  is_fulfillment_by_shopee: boolean;

  @ApiProperty({ type: TagDTO })
  tag: TagDTO;

  @ApiProperty({ type: PurchaseLimitDTO })
  purchase_limit_info: PurchaseLimitDTO;
}

export class GetProductInfoResponseDTO {
  @ApiProperty({ type: [ItemDTO] })
  item_list: ItemDTO[];
}
