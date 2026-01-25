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

export const getCurrencyRatesApi = () => axios.get('/api/v3/shop/coins/public');

// export const buyCoinsApi = (data: { amount: number; paymentMethod?: string }) =>
//   axios.post('/api/v3/coins/buy', data);

// export const sellCoinsApi = (data: { amount: number }) => axios.post('/api/v3/coins/sell', data);

// coingo collection. PayIn
export const startCoingoCollectionApi = (data: { amount: number; walletNumber: string; walletType: string }) =>
  axios.post('/api/v3/payments/coingo/collection/start', data);

export const getCoingoCollectionStatusApi = (merchantSerialNo: string) =>
  axios.get(`/api/v3/payments/coingo/collection/${merchantSerialNo}/status`);

// coingo PayOut
export const createCoingoPayoutApi = (data: { amount: number; walletNumber: string; walletType: string; description?: string }) =>
  axios.post('/api/v3/payments/coingo/payout', data);

export const getCoingoPayoutStatusApi = (merchantSerialNo: string) =>
  axios.get(`/api/v3/payments/coingo/payout/${merchantSerialNo}/status`);

// balance history
export const getBalanceHistoryApi = (params?: { page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `api/v2/users/balance-history${queryString ? `?${queryString}` : ''}`;
  return axios.get(url);
};