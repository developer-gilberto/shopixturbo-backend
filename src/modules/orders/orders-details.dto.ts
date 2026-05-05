import { ApiProperty } from '@nestjs/swagger';

export class ImageInfoDTO {
  @ApiProperty({ example: 'https://cf.shopee.com.br/file/...' })
  image_url: string;
}

export class OrderItemDTO {
  @ApiProperty({ example: false })
  add_on_deal: boolean;

  @ApiProperty({ example: 0 })
  add_on_deal_id: number;

  @ApiProperty({ example: '' })
  consultation_id: string;

  @ApiProperty({ example: false })
  hot_listing_item: boolean;

  @ApiProperty({ type: ImageInfoDTO })
  image_info: ImageInfoDTO;

  @ApiProperty({ example: false })
  is_b2c_owned_item: boolean;

  @ApiProperty({ example: false })
  is_prescription_item: boolean;

  @ApiProperty({ example: 885178150 })
  item_id: number;

  @ApiProperty({ example: 'Pinguin Tux' })
  item_name: string;

  @ApiProperty({ example: 'tux-sku' })
  item_sku: string;

  @ApiProperty({ example: false })
  main_item: boolean;

  @ApiProperty({ example: 60.99 })
  model_discounted_price: number;

  @ApiProperty({ example: 0 })
  model_id: number;

  @ApiProperty({ example: '' })
  model_name: string;

  @ApiProperty({ example: 60.99 })
  model_original_price: number;

  @ApiProperty({ example: 3 })
  model_quantity_purchased: number;

  @ApiProperty({ example: '' })
  model_sku: string;

  @ApiProperty({ example: 885178150 })
  order_item_id: number;

  @ApiProperty({ example: ['BRZ'], type: [String] })
  product_location_id: string[];

  @ApiProperty({ example: 0 })
  promotion_group_id: number;

  @ApiProperty({ example: 0 })
  promotion_id: number;

  @ApiProperty({ example: '' })
  promotion_type: string;

  @ApiProperty({ example: 2 })
  weight: number;

  @ApiProperty({ example: false })
  wholesale: boolean;
}

export class InvoiceDataDTO {
  @ApiProperty({ example: '' })
  number: string;

  @ApiProperty({ example: '' })
  series_number: string;

  @ApiProperty({ example: '' })
  access_key: string;

  @ApiProperty({ example: 0 })
  issue_date: number;

  @ApiProperty({ example: 0 })
  total_value: number;

  @ApiProperty({ example: 0 })
  products_total_value: number;

  @ApiProperty({ example: '' })
  tax_code: string;
}

export class PackageItemDTO {
  @ApiProperty({ example: 885178150 })
  item_id: number;

  @ApiProperty({ example: 0 })
  model_id: number;

  @ApiProperty({ example: 3 })
  model_quantity: number;

  @ApiProperty({ example: 885178150 })
  order_item_id: number;

  @ApiProperty({ example: 0 })
  promotion_group_id: number;

  @ApiProperty({ example: 'BRZ' })
  product_location_id: string;
}

export class PackageDTO {
  @ApiProperty({ example: 'OFG230853326103707' })
  package_number: string;

  @ApiProperty({ example: null, nullable: true })
  group_shipment_id: string | null;

  @ApiProperty({ example: 'LOGISTICS_READY' })
  logistics_status: string;

  @ApiProperty({ example: 'Sandbox Shopee Xpress' })
  shipping_carrier: string;

  @ApiProperty({ type: [PackageItemDTO] })
  item_list: PackageItemDTO[];

  @ApiProperty({ example: 0 })
  parcel_chargeable_weight_gram: number;

  @ApiProperty({ example: true })
  allow_self_design_awb: boolean;

  @ApiProperty({ example: 91008 })
  logistics_channel_id: number;

  @ApiProperty({ example: '' })
  sorting_group: string;
}

export class RecipientAddressDTO {
  @ApiProperty({ example: 'z******g' })
  name: string;

  @ApiProperty({ example: '******44' })
  phone: string;

  @ApiProperty({ example: '' })
  town: string;

  @ApiProperty({ example: 'Jardim Paulistano' })
  district: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'São Paulo' })
  state: string;

  @ApiProperty({ example: 'BR' })
  region: string;

  @ApiProperty({ example: '01452001' })
  zipcode: string;

  @ApiProperty({ example: 'Avenida Brigadeiro Faria Lima, 2055...' })
  full_address: string;
}

export class OrderDetailDTO {
  @ApiProperty({ example: false })
  actual_shipping_fee_confirmed: boolean;

  @ApiProperty({ example: false })
  advance_package: boolean;

  @ApiProperty({ example: '' })
  booking_sn: string;

  @ApiProperty({ example: '' })
  buyer_cancel_reason: string;

  @ApiProperty({ example: '******' })
  buyer_cpf_id: string;

  @ApiProperty({ example: 102429149 })
  buyer_user_id: number;

  @ApiProperty({ example: 'local_regress.br' })
  buyer_username: string;

  @ApiProperty({ example: '' })
  cancel_by: string;

  @ApiProperty({ example: '' })
  cancel_reason: string;

  @ApiProperty({ example: false })
  cod: boolean;

  @ApiProperty({ example: 1777154125 })
  create_time: number;

  @ApiProperty({ example: 'BRL' })
  currency: string;

  @ApiProperty({ example: 2 })
  days_to_ship: number;

  @ApiProperty({ example: null, nullable: true })
  dropshipper: string | null;

  @ApiProperty({ example: 0 })
  edt_from: number;

  @ApiProperty({ example: 0 })
  edt_to: number;

  @ApiProperty({ example: 18.11 })
  estimated_shipping_fee: number;

  @ApiProperty({ example: 'fulfilled_by_local_seller' })
  fulfillment_flag: string;

  @ApiProperty({ example: false })
  goods_to_declare: boolean;

  @ApiProperty({ example: false })
  hot_listing_order: boolean;

  @ApiProperty({ type: InvoiceDataDTO })
  invoice_data: InvoiceDataDTO;

  @ApiProperty({ example: false })
  is_buyer_shop_collection: boolean;

  @ApiProperty({ type: [OrderItemDTO] })
  item_list: OrderItemDTO[];

  @ApiProperty({ example: '' })
  message_to_seller: string;

  @ApiProperty({ example: '' })
  note: string;

  @ApiProperty({ example: 0 })
  note_update_time: number;

  @ApiProperty({ example: 0 })
  order_chargeable_weight_gram: number;

  @ApiProperty({ example: '260426RTQ27DRH' })
  order_sn: string;

  @ApiProperty({ example: 'READY_TO_SHIP' })
  order_status: string;

  @ApiProperty({ type: [PackageDTO] })
  package_list: PackageDTO[];

  @ApiProperty({ example: 1777154125 })
  pay_time: number;

  @ApiProperty({ example: null, nullable: true })
  payment_info: object | null;

  @ApiProperty({ example: 'Pix' })
  payment_method: string;

  @ApiProperty({ example: 0 })
  pickup_done_time: number;

  @ApiProperty({ type: RecipientAddressDTO })
  recipient_address: RecipientAddressDTO;

  @ApiProperty({ example: 'BR' })
  region: string;

  @ApiProperty({ example: 0 })
  reverse_shipping_fee: number;

  @ApiProperty({ example: 0 })
  ship_by_date: number;

  @ApiProperty({ example: 'Sandbox Shopee Xpress' })
  shipping_carrier: string;

  @ApiProperty({ example: false })
  split_up: boolean;

  @ApiProperty({ example: 215.54 })
  total_amount: number;

  @ApiProperty({ example: 1777154127 })
  update_time: number;
}

export class OrderDetailListResponseDTO {
  @ApiProperty({ type: [OrderDetailDTO] })
  order_list: OrderDetailDTO[];
}
