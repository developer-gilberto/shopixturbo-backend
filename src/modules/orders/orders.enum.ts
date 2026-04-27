export enum OrderStatus {
  UNPAID = 'UNPAID',
  READY_TO_SHIP = 'READY_TO_SHIP',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  IN_CANCEL = 'IN_CANCEL',
  CANCELLED = 'CANCELLED',
  INVOICE_PENDING = 'INVOICE_PENDING',
}

export enum TimeRangeField {
  CREATE_TIME = 'create_time',
  UPDATE_TIME = 'update_time',
}
