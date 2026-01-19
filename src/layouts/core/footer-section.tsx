import { Box, Stack, Typography, Divider, useMediaQuery, useTheme } from '@mui/material';

import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Image } from 'src/components/image';

export function FooterSection() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Box component="footer"
            sx={{
                background: "#131313",
                position: "relative",
                marginTop: { xs: 20, sm: "300px" },
                "&::before": {
                    content: '""',
                    width: 1,
                    height: 108,
                    position: "absolute",
                    top: -100,
                    left: 0,
                    background: "url('/assets/images/foot-t.png') no-repeat 50% 0",
                },
            }}
        >
            <Image src="/assets/images/foot_car.png" alt="footer-top" sx={{
                width: { xs: "auto", md: 649 },
                maxWidth: { xs: 1, md: 649 },
                height: { xs: 200, md: 505 },
                position: "absolute",
                [isMobile ? "top" : "bottom"]: { xs: -50, md: 0 },
                right: 0,
                left: { xs: "auto", md: "auto" },
                "& img": {
                    objectFit: "contain",
                    WebkitObjectFit: "contain",
                    width: 1,
                    height: 1,
                },
            }} />
            <Stack
                sx={{
                    color: "#fff",
                    padding: { xs: '40px 8px 80px', md: '45px 0 10px 160px' },
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 10 }}>
                    {/* Brand and description */}
                    <Stack spacing={2} maxWidth={300}>
                        <Logo sx={{ width: 100, height: 'auto' }} />
                    </Stack>

                    {/* Quick Links */}
                    <Stack spacing={2} justifyContent="center" textAlign={{ xs: "center", md: "left" }} >
                        <Typography className='font-tr' fontSize={20} sx={{ maxWidth: 420, color: 'text.secondary' }}>
                            Asia&apos;s premier mobile gaming platform for competitive tournaments and real cash prizes.
                        </Typography>
                        {/* <Stack direction="row" spacing={1.25} alignItems="center" justifyContent={{ xs: "center", md: "flex-start" }}>
                            <Typography
                                className='font-tr' component={RouterLink} href="/dashboard"
                                sx={{ color: 'common.white', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                Home
                            </Typography>
                            <Divider orientation="vertical" sx={{ height: 15, borderColor: 'rgba(255,255,255,0.24)' }} />

                            <Typography
                                className='font-tr' component={RouterLink} href="/dashboard/about-us"
                                sx={{ color: 'common.white', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                About Us
                            </Typography>
                            <Divider orientation="vertical" sx={{ height: 15, borderColor: 'rgba(255,255,255,0.24)' }} />

                            <Typography
                                className='font-tr' component={RouterLink} href="/dashboard/how-to-play"
                                sx={{ color: 'common.white', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                How to Play
                            </Typography>

                            <Divider orientation="vertical" sx={{ height: 15, borderColor: 'rgba(255,255,255,0.24)' }} />
                            <Typography
                                className='font-tr' component={RouterLink} href="/dashboard/rules"
                                sx={{ color: 'common.white', textDecoration: 'none', '&:hover': { color: '#fff' } }}>
                                Tournament Rules
                            </Typography>

                        </Stack> */}
                    </Stack>

                    {/* Support */}
                    {/* <Stack spacing={2} ml="5%" >
                        <Typography variant="h6" fontWeight={700} className='font-tr'>
                            Support
                        </Typography>
                        <Divider sx={{ width: 48, borderColor: 'rgba(255,255,255,0.24)' }} />
                        <Stack spacing={1.25}>
                            <Typography className='font-tr' component={RouterLink} href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#fff' } }}>Help Center</Typography>
                            <Typography className='font-tr' component={RouterLink} href="#" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#fff' } }}>FAQs</Typography>
                        </Stack>
                    </Stack> */}

                    {/* Newsletter */}
                    {/* <Stack spacing={2} maxWidth={420}>
                        <Typography variant="h6" fontWeight={700} className='font-tr'>
                            Newsletter
                        </Typography>
                        <Divider sx={{ width: 48, borderColor: 'rgba(255,255,255,0.24)' }} />
                        <Typography className='font-tr' sx={{ color: 'text.secondary' }}>
                            Subscribe to our newsletter to get updates on upcoming tournaments and events.
                        </Typography>
                        <OutlinedInput
                            placeholder="Your Email"
                            sx={{
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                borderRadius: 1,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.24)' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.32)' },
                            }}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton edge="end" sx={{
                                        bgcolor: 'rgba(120,130,170,0.35)',
                                        color: '#fff',
                                        '&:hover': { bgcolor: 'rgba(120,130,170,0.5)' }
                                    }}>
                                        <SvgIcon fontSize="small" viewBox="0 0 24 24">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </SvgIcon>
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </Stack> */}
                </Stack>

                {/* Bottom copyright bar */}
                <Box sx={{ mt: 1, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 3 }}>
                        © {new Date().getFullYear()} BattleAsia Gaming Platform. All rights reserved.
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

export default FooterSection;


