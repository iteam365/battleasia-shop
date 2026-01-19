import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import AuthGuard from 'src/utils/authguard';

import { UserLayout } from 'src/layouts/user';

import { LoadingScreen } from 'src/components/loading-screen';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const ShopPage = lazy(() => import('src/pages/user/shop'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const userLayout = () => (
  <AuthGuard>
    <UserLayout>
      <SuspenseOutlet />
    </UserLayout>
  </AuthGuard>
);

export const userRoutes: RouteObject[] = [
  {
    path: 'user',
    element: userLayout(),
    children: [
      { index: true, element: <ShopPage /> },
      { path: 'shop', element: <ShopPage /> },
    ],
  },
];

