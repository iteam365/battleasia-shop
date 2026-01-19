import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Card,
    Grid2 as Grid,
    Grid as MuiGrid,
    Stack,
    Typography,
    Container,
    Chip,
    Button,
    Skeleton,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { Image } from 'src/components/image';
import { EmptyContent } from 'src/components/empty-content';
import useApi from 'src/hooks/use-api';
import { useSnackbar } from 'src/components/snackbar';
import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

type ShopItem = {
    amount: number;
    price: number;
    originalPrice: number;
    discountPercent: number;
    badge: string | null;
    symbol: string;
    image: string;
    isActive?: boolean;
};

type CurrencyRate = {
    id: string;
    region: string;
    currency: string;
    rate: number;
    createdAt: string;
    updatedAt: string;
};

const PAYMENT_OPTIONS = ['bkash', 'nagad', 'crypto'] as const;

const PAYMENT_META: Record<
    (typeof PAYMENT_OPTIONS)[number],
    { label: string; imgurl: string; helper?: string }
> = {
    bkash: { label: 'BKash', imgurl: '/assets/images/bkash.png' },
    nagad: { label: 'Nagad', imgurl: '/assets/images/nagad.png' },
    crypto: { label: 'Crypto (USDT)', imgurl: '/assets/images/usdt.png' },
};

export function ShopView() {
    const api = useApi();
    const { enqueueSnackbar } = useSnackbar();

    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
    const [loading, setLoading] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState<string>('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]>('bkash');
    const [submitting, setSubmitting] = useState(false);
    const [playerId] = useState<string>('');

    const fetchCurrencyRates = async () => {
        try {
            setLoading(true);
            const res = await api.getCurrencyRatesApi();
            setCurrencyRates(res?.data?.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load coin offers', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const res = await api.listShopItemsApi();
            setShopItems(res?.data?.data?.results || []);
        } catch (error) {
            enqueueSnackbar('Failed to load coin offers', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchCurrencyRates();
    }, []);

    const filteredShopItems = useMemo(
        () =>
            shopItems.filter((shopItem) => {
                const withinMin = minPrice ? shopItem.amount >= Number(minPrice) : true;
                const withinMax = maxPrice ? shopItem.amount <= Number(maxPrice) : true;
                return withinMin && withinMax;
            }),
        [shopItems, minPrice, maxPrice]
    );

    const handleOpenModal = (item: ShopItem) => {
        setSelectedItem(item);
        setPaymentMethod('bkash');
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedItem) return;
        try {
            setSubmitting(true);
            await api.buyCoinsApi({ amount: selectedItem.amount, paymentMethod });
            enqueueSnackbar('Purchase placed successfully', { variant: 'success' });
            setSelectedItem(null);
        } catch (error) {
            enqueueSnackbar('Buy request failed', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const findRateForMethod = (method: (typeof PAYMENT_OPTIONS)[number]) => {
        const lookup = (code: string) =>
            currencyRates.find(
                (rate) =>
                    rate.currency?.toLowerCase() === code.toLowerCase() || rate.region?.toLowerCase() === code.toLowerCase()
            )?.rate;

        if (method === 'crypto') return lookup('usd') ?? currencyRates[0]?.rate ?? selectedItem?.price ?? 0;

        // Mobile wallets: prefer BDT, then INR, then PKR
        return (
            lookup('bdt') ??
            lookup('inr') ??
            lookup('pkr') ??
            currencyRates[0]?.rate ??
            selectedItem?.price ??
            0
        );
    };

    const selectedRate = findRateForMethod(paymentMethod);
    const coinPrice = currencyRates[0]?.rate ?? selectedItem?.price ?? selectedRate ?? 0;
    const estimatedTotal = selectedItem ? selectedRate * selectedItem.amount : 0;

    const walletTotals =
        selectedItem && (paymentMethod === 'bkash' || paymentMethod === 'nagad')
            ? ['bdt', 'inr', 'pkr'].map((code) => {
                  const rate =
                      currencyRates.find(
                          (r) => r.currency?.toLowerCase() === code || r.region?.toLowerCase() === code
                      )?.rate ?? null;
                  return {
                      code: code.toUpperCase(),
                      rate,
                      total: rate ? rate * selectedItem.amount : null,
                  };
              })
            : [];

    const currencyLabel = () => {
        if (paymentMethod === 'crypto') return 'USD';
        if (currencyRates.find((r) => r.currency.toLowerCase() === 'bdt')) return 'BDT';
        if (currencyRates.find((r) => r.currency.toLowerCase() === 'inr')) return 'INR';
        if (currencyRates.find((r) => r.currency.toLowerCase() === 'pkr')) return 'PKR';
        return currencyRates[0]?.currency ?? 'USD';
    };

    return (
        <Box mt={17}>
            <DashboardContent>
                <Container sx={{ minHeight: 'calc(100vh - 17rem)' }}>
                    <Grid container spacing={3}>
                        {/* Filters */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Card sx={{ p: 2, position: 'sticky', top: 120 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    Payment
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Choose payment"
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    sx={{ mb: 2, textTransform: 'capitalize' }}
                                >
                                    {PAYMENT_OPTIONS.map((opt) => (
                                        <MenuItem key={opt} value={opt} sx={{ textTransform: 'capitalize' }}>
                                            {opt}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    Amount (price)
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        size="small"
                                        label="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                    />
                                    <TextField
                                        size="small"
                                        label="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                    />
                                </Stack>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 2 }}
                                    onClick={() => {
                                        setPaymentFilter('');
                                        setMinPrice('');
                                        setMaxPrice('');
                                    }}
                                >
                                    Clear
                                </Button>
                            </Card>
                        </Grid>

                        {/* Offers */}
                        <Grid size={{ xs: 12, md: 9 }}>
                            {loading ? (
                                <Grid container spacing={3}>
                                    {Array.from({ length: 6 }).map((_, idx) => (
                                        <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Card sx={{ p: 2 }}>
                                                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2, mb: 2 }} />
                                                <Skeleton variant="text" />
                                                <Skeleton variant="text" width="60%" />
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : filteredShopItems.length === 0 ? (
                                <EmptyContent filled sx={{ py: 10 }} />
                            ) : (
                                <Grid container spacing={3}>
                                    {filteredShopItems.map((shopItem) => (
                                        <Grid key={`${shopItem.amount}-${shopItem.symbol}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Card
                                                sx={{
                                                    p: 2,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1.5,
                                                }}
                                            >
                                                {shopItem.badge && (
                                                    <Chip
                                                        label={shopItem.badge}
                                                        color="success"
                                                        size="small"
                                                        sx={{ alignSelf: 'flex-start' }}
                                                    />
                                                )}
                                                <Image src={CONFIG.serverUrl + shopItem.image} alt="BAC coins" ratio="4/3" />
                                                <Typography variant="h6">{shopItem.amount}</Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                                        {shopItem.price}
                                                    </Typography>
                                                    {shopItem.discountPercent > 0 && (
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: 'text.secondary', textDecoration: 'line-through' }}
                                                        >
                                                            {shopItem.originalPrice}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                                {shopItem.discountPercent > 0 && (
                                                    <Chip
                                                        label={`-${shopItem.discountPercent}% for premium`}
                                                        color="warning"
                                                        size="small"
                                                        sx={{ alignSelf: 'flex-start' }}
                                                    />
                                                )}
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
                                                    <Button size="small" variant="contained" onClick={() => handleOpenModal(shopItem)}>
                                                        Buy
                                                    </Button>
                                                </Stack>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Container>
            </DashboardContent>

            <Dialog open={!!selectedItem} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>Security Payment</DialogTitle>
                <DialogContent dividers>
                    {selectedItem && (
                        <MuiGrid container spacing={3}>
                            <MuiGrid item xs={12} md={7}>
                                <Stack spacing={2}>
                                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                                        <Stack spacing={1.5}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Iconify icon="solar:user-outline" />
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Player ID
                                                </Typography>
                                            </Stack>
                                            <Typography variant="subtitle1">{playerId || '—'}</Typography>
                                            <Divider />
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Iconify icon="solar:ticket-outline" />
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Coupon
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                No available coupon
                                            </Typography>
                                        </Stack>
                                    </Card>

                                    <Stack spacing={1}>
                                        <Typography variant="subtitle1">Select payment channels</Typography>
                                        <Stack spacing={1}>
                                            {PAYMENT_OPTIONS.map((method) => {
                                                const selected = paymentMethod === method;
                                                const meta = PAYMENT_META[method];
                                                return (
                                                    <Card
                                                        key={method}
                                                        onClick={() => setPaymentMethod(method)}
                                                        sx={{
                                                            p: 1.5,
                                                            border: '1px solid',
                                                            borderColor: selected ? 'primary.main' : 'divider',
                                                            boxShadow: selected ? 6 : 0,
                                                            cursor: 'pointer',
                                                            bgcolor: selected ? 'action.hover' : 'background.paper',
                                                            transition: (theme) =>
                                                                theme.transitions.create(['box-shadow', 'border-color', 'background-color'], {
                                                                    duration: theme.transitions.duration.shorter,
                                                                }),
                                                        }}
                                                    >
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Box sx={{ 
                                                                backgroundImage: `url(${meta.imgurl})`,
                                                                backgroundSize: 'contain',
                                                                backgroundPosition: 'left',
                                                                backgroundRepeat: 'no-repeat',
                                                                width: 64,
                                                                height: 44,
                                                                borderRadius: 1,
                                                                bgcolor: 'transparent',
                                                                p: 0.5,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                             }} />
                                                            <Stack spacing={0.25}>
                                                                <Typography variant="body1">{meta.label}</Typography>
                                                                {meta.helper ? (
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                        {meta.helper}
                                                                    </Typography>
                                                                ) : null}
                                                            </Stack>
                                                        </Stack>
                                                    </Card>
                                                );
                                            })}
                                        </Stack>
                                    </Stack>

                                </Stack>
                            </MuiGrid>

                            <MuiGrid item xs={12} md={5}>
                                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                                    <Stack spacing={2}>
                                        <Typography variant="subtitle1">Order summary</Typography>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Image src={CONFIG.serverUrl + selectedItem.image} alt="Coin" sx={{ width: 64, height: 64 }} />
                                            <Stack spacing={0.5}>
                                                <Typography variant="subtitle2">Coins</Typography>
                                                <Typography variant="body1">{selectedItem.amount}</Typography>
                                            </Stack>
                                        </Stack>
                                        <Divider />
                                        <Stack direction="column" justifyContent="space-between">
                                            <Typography variant="subtitle1">Rates</Typography>
                                            <Card variant="outlined" sx={{ p: 1.5, width: '100%' }}>
                                                {paymentMethod === 'crypto' ? (
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="body2">USD</Typography>
                                                        <Typography variant="body2">
                                                            {findRateForMethod('crypto') ? findRateForMethod('crypto').toFixed(2) : '—'} per coin
                                                        </Typography>
                                                    </Stack>
                                                ) : (
                                                    ['bdt', 'inr', 'pkr'].map((code) => {
                                                        const rate =
                                                            currencyRates.find(
                                                                (r) =>
                                                                    r.currency?.toLowerCase() === code || r.region?.toLowerCase() === code
                                                            )?.rate ?? null;
                                                        return (
                                                            <Stack key={code} direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                                                                <Typography variant="body2">{code.toUpperCase()}</Typography>
                                                                <Typography variant="body2">{rate ? rate.toFixed(2) : '—'} per coin</Typography>
                                                            </Stack>
                                                        );
                                                    })
                                                )}
                                            </Card>
                                        </Stack>
                                        {paymentMethod === 'crypto' ? (
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body1" fontWeight={600}>
                                                    Total
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700}>
                                                    {estimatedTotal ? `${currencyLabel()} ${estimatedTotal.toFixed(2)}` : selectedItem.price}
                                                </Typography>
                                            </Stack>
                                        ) : (
                                            <Stack spacing={0.75}>
                                                <Typography variant="body1" fontWeight={600}>
                                                    Total
                                                </Typography>
                                                {walletTotals.map(({ code, total }) => (
                                                    <Stack key={code} direction="row" justifyContent="space-between">
                                                        <Typography variant="body2">{code}</Typography>
                                                        <Typography variant="subtitle1" fontWeight={700}>
                                                            {total ? `${total.toFixed(2)}` : '—'}
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        )}
                                    </Stack>
                                </Card>
                            </MuiGrid>
                        </MuiGrid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleConfirmPurchase} disabled={submitting || !selectedItem}>
                        Confirm & Pay
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

