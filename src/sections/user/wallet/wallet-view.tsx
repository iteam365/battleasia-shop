import { useState, useEffect, useMemo } from 'react';
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
    Backdrop,
    CircularProgress,
} from '@mui/material';

import useApi from 'src/hooks/use-api';
import { fCurrency, fNumber } from 'src/utils/format-number';
import { useSelector } from 'src/store';
import { DashboardContent } from 'src/layouts/dashboard';
import { CONFIG, PAYMENT_OPTIONS, PAYMENT_META } from 'src/global-config';

import { toast } from 'react-hot-toast';

import { Iconify } from 'src/components/iconify';
import { Image } from 'src/components/image';

// ----------------------------------------------------------------------

type BalanceHistoryItem = {
    id: string;
    amount: number;
    type: 'deposit' | 'withdraw';
    balanceBefore: number;
    balanceAfter: number;
    performedBy: string;
    detail: Record<string, any>;
    createdAt: Date | string | null;
};

type CurrencyRate = {
    id?: string;
    region?: string;
    currency: string;
    rate: number;
};
// ---------------------------------------------------------------------

export function WalletView() {
    const { user } = useSelector((state) => state.auth);
    const { getBalanceHistoryApi, createCoingoPayoutApi, getCoingoPayoutStatusApi, getCurrencyRatesApi } = useApi();
    const playerEmail = useSelector((state) => state.auth.user?.email || '');

    const [transactions, setTransactions] = useState<BalanceHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [payoutAmount, setPayoutAmount] = useState<string>('');
    const [payoutWallet, setPayoutWallet] = useState<string>('');
    const [payoutType, setPayoutType] = useState<'bkash' | 'nagad'>('bkash');
    const [payoutSubmitting, setPayoutSubmitting] = useState(false);
    const [lastPayoutRef, setLastPayoutRef] = useState<string>('');
    const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);

    const [paymentFilter, setPaymentFilter] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number]>('bkash');
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const fetchBalanceHistory = async () => {
            if (!user?._id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await getBalanceHistoryApi({ page: 1, limit: 100 });
                const responseData = response?.data;

                if (responseData?.status && Array.isArray(responseData?.data?.results)) {
                    setTransactions(
                        responseData.data.results.map((item: any) => ({
                            id: item.id || item._id,
                            amount: Number(item.amount) || 0,
                            type: item.type === 'deposit' ? 'deposit' : 'withdraw',
                            balanceBefore: Number(item.balanceBefore) || 0,
                            balanceAfter: Number(item.balanceAfter) || 0,
                            performedBy: item.performedBy || '',
                            detail: item.detail || {},
                            createdAt: item.createdAt ? new Date(item.createdAt) : null,
                        }))
                    );
                }
            } catch (error: any) {
                console.error('Failed to fetch balance history:', error);
                const errorMsg =
                    error?.response?.data?.message ||
                    error?.message ||
                    'Failed to load wallet history';
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchBalanceHistory();
    }, [getBalanceHistoryApi, user?._id]);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await getCurrencyRatesApi();
                const data = res?.data?.data;
                if (Array.isArray(data)) {
                    setCurrencyRates(data);
                }
            } catch (error) {
                console.error('Failed to fetch currency rates:', error);
                toast.error('Failed to load currency rates');
            }
        };
        fetchRates();
    }, [getCurrencyRatesApi]);

    const walletData = useMemo(() => {
        const deposits = transactions.filter((t) => t.type === 'deposit');
        const withdraws = transactions.filter((t) => t.type === 'withdraw');

        const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
        const totalWithdraws = withdraws.reduce((sum, t) => sum + t.amount, 0);

        // Calculate win money (deposits from match rewards)
        const winMoney = deposits
            .filter((t) => t.detail?.reason === 'match_reward' || t.detail?.matchId)
            .reduce((sum, t) => sum + t.amount, 0);

        // Calculate join money (withdraws for match entry fees)
        const joinMoney = withdraws
            .filter((t) => t.detail?.reason === 'match_entry_fee' || t.detail?.matchId)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalBalance: user?.balance || 0,
            winMoney,
            joinMoney,
            totalPayout: totalWithdraws,
            totalPayoutCommission: 0,
            earnings: totalDeposits,
            payouts: totalWithdraws,
        };
    }, [transactions, user?.balance]);

    const userBalanceTotals = useMemo(
        () =>
            currencyRates.map((item) => {
                const amount = user?.balance * item.rate;
                return {
                    code: item.currency.toUpperCase(),
                    amount: amount != null ? amount : 0,
                };
            }),
        [currencyRates, user?.balance]
    );

    const handleOpenModal = () => {
        if (!payoutAmount || !payoutWallet) {
            toast.error('Amount and wallet are required');
            return;
        }
        if (Number(payoutAmount) <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }
        if (!paymentFilter) {
            toast.error('Please choose wallet');
            return;
        }
        setOpenModal(true);
        setPaymentMethod(paymentFilter ? (paymentFilter as (typeof PAYMENT_OPTIONS)[number]) : 'bkash');
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleSubmitPayout = async () => {
        if (!payoutAmount || !payoutWallet) {
            toast.error('Amount and wallet are required');
            return;
        }
        if (Number(payoutAmount) <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }
        if (!paymentMethod) {
            toast.error('Please choose a payment method');
            return;
        }
        if (paymentMethod === 'crypto') {
            toast.error('Please choose bKash or Nagad for Coingopay checkout');
            return;
        }
        try {
            setPayoutSubmitting(true);
            const res = await createCoingoPayoutApi({
                amount: Number(payoutAmount),
                walletNumber: payoutWallet.trim(),
                walletType: payoutType,
            });
            const ref = res?.data?.data?.merchantSerialNo;
            if (ref) {
                setLastPayoutRef(ref);
                toast.success('Payout submitted');
            } else {
                toast.error('Payout submission failed');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Payout failed');
        } finally {
            setPayoutSubmitting(false);
        }
    }

    const findRateForMethod = (method: (typeof PAYMENT_OPTIONS)[number]) => {
        const lookup = (code: string) =>
            currencyRates.find(
                (rate) =>
                    rate.currency?.toLowerCase() === code.toLowerCase() || rate.region?.toLowerCase() === code.toLowerCase()
            )?.rate;

        if (method === 'crypto') return lookup('usd') ?? currencyRates[0]?.rate ?? payoutAmount ?? 0;

        // Mobile wallets: prefer BDT, then INR, then PKR
        return (
            lookup('bdt') ??
            lookup('inr') ??
            lookup('pkr') ??
            currencyRates[0]?.rate ??
            payoutAmount ??
            0
        );
    };

    const walletTotals =
        payoutAmount && (paymentMethod === 'bkash' || paymentMethod === 'nagad')
            ? ['bdt', 'inr', 'pkr'].map((code) => {
                const rate =
                    currencyRates.find(
                        (r) => r.currency?.toLowerCase() === code || r.region?.toLowerCase() === code
                    )?.rate ?? null;
                return {
                    code: code.toUpperCase(),
                    rate,
                    total: rate ? rate * Number(payoutAmount) : null,
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

    // const handleCheckPayoutStatus = async () => {
    //     if (!lastPayoutRef) {
    //         toast.warning('No payout reference found');
    //         return;
    //     }
    //     const res = await getCoingoPayoutStatusApi(lastPayoutRef);
    //     const status = res?.data?.data?.status;
    //     toast.success(`Payout status: ${status || 'unknown'}`);
    // }

    // useEffect(() => {
    //     if (lastPayoutRef) {
    //         handleCheckPayoutStatus();
    //     }
    // }, [lastPayoutRef]);

    const renderBalanceCard = () => (
        <Card
            sx={{
                p: 4,
                mt: 14,
                borderRadius: 2,
            }}
        >
            <Stack spacing={3}>
                {/* Total Balance */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Total Balance
                        </Typography>
                    </Box>
                    <Typography
                        variant="h2"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Iconify icon="solar:wallet-money-bold" width={32} sx={{ color: 'primary.main' }} />
                        {fNumber(user?.balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BAC
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1, maxWidth: 200 }}>
                        {userBalanceTotals.map((item) => (
                            <Box
                                key={item.code}
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {item.code}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {item.amount != null
                                        ? fNumber(item.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : '--'}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Balance Breakdown */}
                {/* <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                Win Money
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {fNumber(walletData.winMoney, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BAC
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                Join Money
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {fNumber(walletData.joinMoney, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BAC
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                Total Payout
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {fNumber(walletData.totalPayout, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BAC
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                Total Payout Commission
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                    {fNumber(walletData.totalPayoutCommission, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BAC
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid> */}

                <Stack spacing={2} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Request payout (Coingopay)</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                            label="Amount (BAC)"
                            type="number"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value || '')}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Wallet number"
                            value={payoutWallet}
                            onChange={(e) => setPayoutWallet(e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Choose Wallet"
                            value={paymentFilter}
                            onChange={(e) => { setPaymentFilter(e.target.value); setPaymentMethod(e.target.value as (typeof PAYMENT_OPTIONS)[number]) }}
                            sx={{ mb: 2, textTransform: 'capitalize' }}
                            SelectProps={{
                                MenuProps: {
                                    PaperProps: {
                                        sx: {
                                            bgcolor: '#fff',
                                            backgroundImage: 'linear-gradient(to right, #fff, #f5f5f5)'
                                        }
                                    },
                                },
                            }}
                        >
                            {PAYMENT_OPTIONS.map((opt) => (
                                <MenuItem
                                    key={opt}
                                    value={opt}
                                    sx={{ textTransform: 'capitalize', bgcolor: '#fff' }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box
                                            sx={{
                                                backgroundImage: `url(${PAYMENT_META[opt].imgurl})`,
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'left',
                                                backgroundRepeat: 'no-repeat',
                                                width: 48,
                                                height: 32,
                                                borderRadius: 1,
                                                bgcolor: 'transparent',
                                            }}
                                        />
                                        <Typography variant="body2">{PAYMENT_META[opt].label}</Typography>
                                    </Stack>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button
                            variant="contained"
                            disabled={payoutSubmitting}
                            onClick={handleOpenModal}
                        >
                            Submit payout
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Card>
    );

    const renderSummaryCards = () => (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                    sx={{
                        p: 3,
                        borderRadius: 2,
                    }}
                >
                    <Stack spacing={2}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            EARNINGS
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: 'primary.main' }} />
                            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                {fCurrency(walletData.earnings)}
                            </Typography>
                        </Box>
                    </Stack>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Card
                    sx={{
                        p: 3,
                        borderRadius: 2,
                    }}
                >
                    <Stack spacing={2}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            PAYOUTS
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: 'primary.main' }} />
                            <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 600 }}>
                                {fCurrency(walletData.payouts)}
                            </Typography>
                        </Box>
                    </Stack>
                </Card>
            </Grid>
        </Grid>
    );

    const getTransactionTitle = (transaction: BalanceHistoryItem): string => {
        const detail = transaction.detail || {};
        if (detail.reason === 'match_entry_fee' && detail.matchName) {
            return `Match Joined - ${detail.matchName}`;
        }
        if (detail.reason === 'match_reward' && detail.matchName) {
            return `Match Reward - ${detail.matchName}`;
        }
        if (detail.reason === 'match_entry_fee') {
            return `Match Entry Fee`;
        }
        if (detail.reason === 'match_reward') {
            return `Match Reward`;
        }
        if (detail.note) {
            return detail.note;
        }
        return transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
    };

    const formatDate = (date: Date | string | null): string => {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const renderTransactionHistory = () => (
        <Box>
            <Typography
                variant="h5"
                sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    mb: 3,
                }}
            >
                Wallet History
            </Typography>
            {loading ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    Loading...
                </Typography>
            ) : transactions.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No transaction history found
                </Typography>
            ) : (
                <Stack spacing={2}>
                    {transactions.map((transaction) => (
                        <Card
                            key={transaction.id}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
                                        {getTransactionTitle(transaction)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                        {formatDate(transaction.createdAt)}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mb: 1 }}>
                                        <Chip
                                            label={transaction.type === 'withdraw' ? 'Debit' : 'Credit'}
                                            size="small"
                                            sx={{
                                                bgcolor: transaction.type === 'withdraw' ? 'error.main' : 'success.main',
                                                color: 'common.white',
                                                fontWeight: 600,
                                                height: 24,
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mb: 0.5 }}>
                                        <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: transaction.type === 'withdraw' ? 'error.main' : 'success.main',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {transaction.type === 'withdraw' ? '-' : '+'} {fNumber(transaction.amount)} BAC
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                        <Iconify icon="solar:wallet-money-bold" width={16} sx={{ color: 'primary.main' }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {fNumber(transaction.balanceAfter)} BAC
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );

    return (
        <DashboardContent>
            <Stack spacing={3}>
                {/* Main Balance Card */}
                {renderBalanceCard()}

                {/* Earnings and Payouts Summary */}
                {/* {renderSummaryCards()} */}

                {/* Transaction History */}
                {renderTransactionHistory()}
            </Stack>

            <Dialog open={!!openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>Withdrawal</DialogTitle>
                <DialogContent dividers>
                    <MuiGrid container spacing={3}>
                        <MuiGrid item xs={12} md={7}>
                            <Stack spacing={2}>
                                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify icon="solar:wallet-money-bold" />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Withdraw Amount
                                            </Typography>
                                        </Stack>
                                        <Typography variant="subtitle1">{payoutAmount ? `${Number(payoutAmount).toFixed(2)}` : payoutAmount} BAC </Typography>
                                        <Divider />
                                        {/* <Stack direction="row" alignItems="center" spacing={1}>
                                            <Iconify icon="solar:ticket-outline" />
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                Coupon
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            No available coupon
                                        </Typography> */}
                                    </Stack>
                                </Card>

                                <Stack spacing={1}>
                                    <Typography variant="subtitle1">Select payment channels</Typography>
                                    <Stack spacing={1}>
                                        {PAYMENT_OPTIONS.map((method) => {
                                            const meta = PAYMENT_META[method];
                                            return (
                                                <Card
                                                    key={method}
                                                    onClick={() => setPaymentMethod(method)}
                                                    sx={{
                                                        p: 1.5,
                                                        border: '1px solid',
                                                        borderColor: paymentMethod === method ? 'primary.main' : 'divider',
                                                        boxShadow: paymentMethod === method ? 6 : 0,
                                                        cursor: 'pointer',
                                                        bgcolor: paymentMethod === method ? 'action.hover' : 'background.paper',
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
                                    <Stack direction="column" justifyContent="space-between">
                                        <Typography variant="subtitle1">Withdarw to</Typography>
                                        <Card variant="outlined" sx={{ p: 1.5, width: '100%' }}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">
                                                    {payoutWallet || '—'}
                                                </Typography>
                                            </Stack>
                                        </Card>
                                    </Stack>

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
                                                {payoutAmount ? `${currencyLabel()} ${Number(payoutAmount).toFixed(2)}` : payoutAmount}
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
                </DialogContent>
                {/* red text color for some text  */}
                {/* <Stack direction="row" justifyContent="flex-end" px={2} alignItems="center">
                    <Typography variant="body2" color="error">
                        Payments can only be made in Bangladeshi Taka (BDT).
                    </Typography>
                </Stack> */}
                <DialogActions sx={{}}>
                    <Button onClick={handleCloseModal} disabled={payoutSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmitPayout} disabled={payoutSubmitting || !payoutAmount}>
                        Confirm & Pay
                    </Button>
                </DialogActions>
            </Dialog>

            {/* <Backdrop
                open={paymentStatus === 'pending' || paymentStatus === 'expired'}
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 2 }}
            >
                <Stack
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        bgcolor: 'rgba(0,0,0,0.85)',
                        px: 3,
                        py: 2.5,
                        borderRadius: 2,
                        boxShadow: 6,
                        minWidth: 280,
                    }}
                >
                    {paymentStatus === 'pending' ? (
                        <CircularProgress color="inherit" size={28} />
                    ) : (
                        <Iconify icon="solar:close-circle-bold" width={28} height={28} color="error.main" />
                    )}
                    <Typography variant="body2">
                        {paymentStatus === 'expired'
                            ? 'Payment expired'
                            : paymentStatus === 'pending'
                            ? 'Payment in progress...'
                            : paymentStatus === 'failed'
                            ? 'Payment not completed'
                            : 'Payment expired'}
                    </Typography>
                    {paymentStatus === 'expired' || paymentStatus === 'failed' ? (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setPaymentStatus('idle');
                                setPaymentRef('');
                                setPaymentExpiryAt(null);
                            }}
                            sx={{ px: 3 }}
                        >
                            Close
                        </Button>
                    ) : null}
                </Stack>
            </Backdrop> */}
        </DashboardContent>
    );
}

