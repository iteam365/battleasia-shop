export type RegisterData = {
  email: string;
  password: string;
  username: string;
  countryCode: string;
  mobileNo: string;
  pubgId: string;
  gameServer: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type ApiContextType = {
  // auth
  initialize: () => Promise<any>;
  registerApi: (data: RegisterData) => Promise<any>;
  loginApi: (data: LoginData) => Promise<any>;
  // shop
  listShopItemsApi: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
  }) => Promise<any>;
  getShopItemApi: (id: string) => Promise<any>;
  checkoutShopApi: (data: { items: { itemId: string; quantity: number }[]; shippingAddress?: any }) => Promise<any>;
  listMyOrdersApi: (params?: { page?: number; limit?: number; status?: string }) => Promise<any>;
  getCurrencyRatesApi: () => Promise<any>;
  buyCoinsApi: (data: { amount: number; paymentMethod?: string }) => Promise<any>;
  sellCoinsApi: (data: { amount: number }) => Promise<any>;
  startCoingoCollectionApi: (data: { amount: number; walletNumber: string; walletType: string }) => Promise<any>;
};

