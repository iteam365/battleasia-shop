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
  getCurrencyRatesApi: () => Promise<any>;
  // coingo collection
  startCoingoCollectionApi: (data: { email: string; amount: number; walletNumber: string; walletType: string }) => Promise<any>;
  getCoingoCollectionStatusApi: (merchantSerialNo: string) => Promise<any>;
  // coingo payout
  createCoingoPayoutApi: (data: { amount: number; walletNumber: string; walletType: string; description?: string }) => Promise<any>;
  getCoingoPayoutStatusApi: (merchantSerialNo: string) => Promise<any>;
  // balance history
  getBalanceHistoryApi: (params?: { page?: number; limit?: number }) => Promise<any>;
  
};

