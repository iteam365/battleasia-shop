import { useMemo } from 'react';

import { Box } from '@mui/material';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { accountMenuItems } from '../menu-items-config';

// ----------------------------------------------------------------------

type NavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
    isActive: (pathname: string) => boolean;
};

// ----------------------------------------------------------------------

export function FloatingFooterNav() {
    const pathname = usePathname();

    const navItems: NavItem[] = useMemo(() => accountMenuItems
        .filter((item) => item.mobileMenu === true && item.href)
        .map((item) => ({
            label: item.label,
            href: item.href!,
            icon: item.icon,
            isActive: (currentPath: string) => currentPath.startsWith(item.href!),
        }))
        , []
    );

    return (
        <Box
            sx={{
                display: { xs: 'flex', md: 'none' },
                position: 'fixed',
                bottom: 5,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1300,
                gap: 1,
                alignItems: 'center',
                justifyContent: 'center',
                px: 1.5,
                py: 1,
                borderRadius: 6,
                backgroundColor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
            }}
        >
            {navItems.map((item) => {
                const isActive = item.isActive(pathname);

                return (
                    <Box
                        key={item.href}
                        component={RouterLink}
                        href={item.href}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            ...(isActive
                                ? {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    borderRadius: 2.5,
                                    px: 2,
                                    py: 1,
                                    minWidth: 70,
                                    gap: 0.5,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                }
                                : {
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    backgroundColor: 'action.hover',
                                    color: 'text.secondary',
                                    '&:hover': {
                                        backgroundColor: 'action.selected',
                                        transform: 'scale(1.05)',
                                    },
                                }),
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: isActive ? 18 : 22,
                                height: isActive ? 18 : 22,
                                '& svg': {
                                    width: isActive ? 18 : 22,
                                    height: isActive ? 18 : 22,
                                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                                },
                            }}
                        >
                            {item.icon}
                        </Box>
                        {isActive && (
                            <Box
                                component="span"
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1,
                                }}
                            >
                                {item.label}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

