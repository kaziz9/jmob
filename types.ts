export interface Order {
  route: string;
  product: string;
  trays: number;
  inStock?: boolean;
}

export interface OrderData {
  issueDate: string;
  orders: Order[];
}
