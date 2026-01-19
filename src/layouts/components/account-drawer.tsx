import type { IconButtonProps } from '@mui/material/IconButton';

import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import {
  Box, Avatar, Drawer, MenuList, MenuItem, Collapse, Typography, IconButton, ListItemButton, Link
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { getImageUrl } from 'src/utils/get-image-url';

import { useSelector } from 'src/store';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateBorder } from 'src/components/animate';

import { UpgradeBlock } from './nav-upgrade';
import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

import type { AccountMenuItem } from '../menu-items-config';

// ----------------------------------------------------------------------

export type AccountDrawerProps = IconButtonProps & {
  data?: AccountMenuItem[];
};

export function AccountDrawer({ data = [], sx, ...other }: AccountDrawerProps) {
  const pathname = usePathname();

  const storeUser = useSelector((state) => state.auth.user);

  // Use prop user if provided, otherwise fallback to store user
  const user = {
    displayName: storeUser?.username || storeUser?.email || '',
    email: storeUser?.email || '',
    photoURL: getImageUrl(storeUser?.avatar),
  };

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleToggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderAvatar = () => (
    <AnimateBorder
      sx={{ mb: 2, p: '6px', width: 96, height: 96, borderRadius: '50%' }}
      slotProps={{
        primaryBorder: { size: 120, sx: { color: 'primary.main' } },
      }}
    >
      <Avatar src={user?.photoURL} alt={user?.displayName} sx={{ width: 1, height: 1 }}>
        {user?.displayName?.charAt(0).toUpperCase()}
      </Avatar>
    </AnimateBorder>
  );

  const renderList = () => (
    <MenuList
      disablePadding
      sx={[
        (theme) => ({
          py: 3,
          px: 2.5,
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          '& li': { p: 0 },
        }),
      ]}
    >
      {data.map((option) => {
        const rootLabel = 'Shop';
        const rootHref = paths.user.shop;
        const hasChildren = option.children && option.children.length > 0;
        const isExpanded = expandedItems.has(option.label);

        if (hasChildren) {
          return (
            <Box key={option.label}>
              <MenuItem>
                <ListItemButton
                  onClick={() => handleToggleExpand(option.label)}
                  sx={{
                    p: 1,
                    width: 1,
                    display: 'flex',
                    typography: 'body2',
                    alignItems: 'center',
                    color: 'text.secondary',
                    '& svg': { width: 24, height: 24 },
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {option.icon}

                  <Box component="span" sx={{ ml: 2, flexGrow: 1 }}>
                    {option.label === 'Home' ? rootLabel : option.label}
                  </Box>

                  <Iconify
                    icon={isExpanded ? 'iconamoon:arrow-down-2-light' : 'iconamoon:arrow-right-2-light'}
                    width={20}
                    sx={{ ml: 1 }}
                  />
                </ListItemButton>
              </MenuItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4 }}>
                  {option.children?.map((child) => (
                    <MenuItem key={child.label}>
                      <Link
                        component={RouterLink}
                        href={child.href || '#'}
                        color="inherit"
                        underline="none"
                        onClick={onClose}
                        sx={{
                          p: 1,
                          width: 1,
                          display: 'flex',
                          typography: 'body2',
                          alignItems: 'center',
                          color: 'text.secondary',
                          '& svg': { width: 20, height: 20 },
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        {child.icon}

                        <Box component="span" sx={{ ml: 2 }}>
                          {child.label}
                        </Box>
                      </Link>
                    </MenuItem>
                  ))}
                </Box>
              </Collapse>
            </Box>
          );
        }

        return (
          <MenuItem key={option.label}>
            <Link
              component={RouterLink}
              href={option.label === 'Home' ? rootHref : option.href || '#'}
              color="inherit"
              underline="none"
              onClick={onClose}
              sx={{
                p: 1,
                width: 1,
                display: 'flex',
                typography: 'body2',
                alignItems: 'center',
                color: 'text.secondary',
                '& svg': { width: 24, height: 24 },
                '&:hover': { color: 'text.primary' },
              }}
            >
              {option.icon}

              <Box component="span" sx={{ ml: 2 }}>
                {option.label === 'Home' ? rootLabel : option.label}
              </Box>
            </Link>
          </MenuItem>
        );
      })}
    </MenuList>
  );

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL={user?.photoURL || ""}
        displayName={user?.displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320 } }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            top: 12,
            left: 12,
            zIndex: 9,
            position: 'absolute',
          }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box
            sx={{
              pt: 8,
              pb: 4,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            {renderAvatar()}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {user?.displayName}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
              {user?.email}
            </Typography>
          </Box>

          {renderList()}

          <Box sx={{ px: 2.5, py: 3 }}>
            <UpgradeBlock />
          </Box>
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}
