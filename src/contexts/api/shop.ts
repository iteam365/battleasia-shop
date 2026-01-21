import axios from 'src/lib/axios';

export const listShopItemsApi = (params?: { page?: number; limit?: number; search?: string; category?: string; type?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);
  if (params?.category) query.append('category', params.category);
  if (params?.type) query.append('type', params.type);
  return axios.get(`/api/v3/shop/items?${query.toString()}`);
};

export const getShopItemApi = (id: string) => axios.get(`/api/v3/shop/items/${id}`);

export const checkoutShopApi = (data: { items: { itemId: string; quantity: number }[]; shippingAddress?: any }) =>
  axios.post('/api/v3/shop/orders/checkout', data);

export const listMyOrdersApi = (params?: { page?: number; limit?: number; status?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.status) query.append('status', params.status);
  return axios.get(`/api/v3/shop/orders/me?${query.toString()}`);
};

export const getCurrencyRatesApi = () => axios.get('/api/v3/shop/coins/public');

export const buyCoinsApi = (data: { amount: number; paymentMethod?: string }) =>
  axios.post('/api/v3/coins/buy', data);

export const sellCoinsApi = (data: { amount: number }) => axios.post('/api/v3/coins/sell', data);

export const startCoingoCollectionApi = (data: { amount: number; walletNumber: string; walletType: string }) =>
  axios.post('/api/v3/payments/coingo/collection/start', data);

export const getCoingoCollectionStatusApi = (merchantSerialNo: string) =>
  axios.get(`/api/v3/payments/coingo/collection/${merchantSerialNo}/status`);
