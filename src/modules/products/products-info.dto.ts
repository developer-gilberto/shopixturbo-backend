import { ApiProperty } from '@nestjs/swagger';

export class AttributeValueDTO {
  @ApiProperty()
  value_id: number;

  @ApiProperty()
  original_value_name: string;

  @ApiProperty()
  value_unit: string;
}

export class PriceInfoDTO {
  @ApiProperty()
  currency: string;

  @ApiProperty()
  original_price: number;

  @ApiProperty()
  current_price: number;
}

export class DimensionDTO {
  @ApiProperty()
  package_length: number;

  @ApiProperty()
  package_width: number;

  @ApiProperty()
  package_height: number;
}

export class LogisticDTO {
  @ApiProperty()
  logistic_id: number;

  @ApiProperty()
  logistic_name: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  size_id: number;

  @ApiProperty()
  is_free: boolean;

  @ApiProperty()
  estimated_shipping_fee: number;
}

export class PreOrderDTO {
  @ApiProperty()
  is_pre_order: boolean;

  @ApiProperty()
  days_to_ship: number;
}

export class BrandDTO {
  @ApiProperty()
  brand_id: number;

  @ApiProperty()
  original_brand_name: string;
}

export class FieldDTO {
  @ApiProperty()
  field_type: string;

  @ApiProperty()
  text: string;
}

export class SummaryInfoDTO {
  @ApiProperty()
  total_reserved_stock: number;

  @ApiProperty()
  total_available_stock: number;
}

export class SellerStockDTO {
  @ApiProperty()
  location_id: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  if_saleable: boolean;
}

export class ShopeeStockDTO {
  @ApiProperty()
  location_id: string;

  @ApiProperty()
  stock: number;
}

export class AdvanceStockDTO {
  @ApiProperty()
  sellable_advance_stock: number;

  @ApiProperty()
  in_transit_advance_stock: number;
}

export class TagDTO {
  @ApiProperty()
  kit: boolean;
}

export class PurchaseLimitDTO {
  @ApiProperty()
  min_purchase_limit: number;
}

export class AttributeDTO {
  @ApiProperty()
  attribute_id: number;

  @ApiProperty()
  original_attribute_name: string;

  @ApiProperty({ type: [AttributeValueDTO] })
  attribute_value_list: AttributeValueDTO[];

  @ApiProperty()
  is_mandatory: boolean;
}

export class ImageDTO {
  @ApiProperty({ type: [String] })
  image_id_list: string[];

  @ApiProperty({ type: [String] })
  image_url_list: string[];

  @ApiProperty()
  image_ratio: string;
}

export class PromotionImageDTO {
  @ApiProperty({ type: [String] })
  image_id_list: string[];

  @ApiProperty({ type: [String] })
  image_url_list: string[];
}

export class TaxInfoDTO {
  @ApiProperty() ncm: string;
  @ApiProperty() same_state_cfop: string;
  @ApiProperty() diff_state_cfop: string;
  @ApiProperty() csosn: string;
  @ApiProperty() origin: string;
  @ApiProperty() cest: string;
  @ApiProperty() measure_unit: string;
  @ApiProperty() pis_cofins_cst: string;
  @ApiProperty() federal_state_taxes: string;
  @ApiProperty() operation_type: string;
  @ApiProperty() ex_tipi: string;
  @ApiProperty() fci_num: string;
  @ApiProperty() recopi_num: string;
  @ApiProperty() additional_info: string;
}

export class ComplaintPolicyDTO {
  @ApiProperty()
  warranty_time: string;

  @ApiProperty()
  exclude_entrepreneur_warranty: boolean;

  @ApiProperty()
  complaint_address_id: number;

  @ApiProperty()
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
  @ApiProperty()
  item_id: number;

  @ApiProperty()
  category_id: number;

  @ApiProperty()
  item_name: string;

  @ApiProperty()
  item_sku: string;

  @ApiProperty()
  create_time: number;

  @ApiProperty()
  update_time: number;

  @ApiProperty({ type: [AttributeDTO] })
  attribute_list: AttributeDTO[];

  @ApiProperty({ type: [PriceInfoDTO] })
  price_info: PriceInfoDTO[];

  @ApiProperty({ type: ImageDTO })
  image: ImageDTO;

  @ApiProperty()
  weight: string;

  @ApiProperty({ type: DimensionDTO })
  dimension: DimensionDTO;

  @ApiProperty({ type: [LogisticDTO] })
  logistic_info: LogisticDTO[];

  @ApiProperty({ type: PreOrderDTO })
  pre_order: PreOrderDTO;

  @ApiProperty()
  condition: string;

  @ApiProperty()
  size_chart: string;

  @ApiProperty()
  item_status: string;

  @ApiProperty()
  has_model: boolean;

  @ApiProperty()
  promotion_id: number;

  @ApiProperty()
  has_promotion: boolean;

  @ApiProperty({ type: BrandDTO })
  brand: BrandDTO;

  @ApiProperty()
  item_dangerous: number;

  @ApiProperty({ type: TaxInfoDTO })
  tax_info: TaxInfoDTO;

  @ApiProperty({ type: ComplaintPolicyDTO })
  complaint_policy: ComplaintPolicyDTO;

  @ApiProperty({ type: DescriptionInfoDTO })
  description_info: DescriptionInfoDTO;

  @ApiProperty()
  description_type: string;

  @ApiProperty({ type: StockInfoDTO })
  stock_info_v2: StockInfoDTO;

  @ApiProperty()
  gtin_code: string;

  @ApiProperty()
  size_chart_id: number;

  @ApiProperty({ type: PromotionImageDTO })
  promotion_image: PromotionImageDTO;

  @ApiProperty()
  deboost: string;

  @ApiProperty({ type: Object })
  compatibility_info: Record<string, any>;

  @ApiProperty()
  authorised_brand_id: number;

  @ApiProperty()
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
