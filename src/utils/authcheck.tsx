// components
import { useEffect, useState } from 'react';

import useApi from 'src/hooks/use-api';

import { useSelector, useDispatch } from 'src/store';
import { balanceAction, userAction } from 'src/store/reducers/auth';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthConsumer({ children }: Props) {
  const dispatch = useDispatch();
  const { initialize } = useApi();
  const { isLoggedIn } = useSelector((store) => store.auth);

  const [loading, setLoading] = useState<boolean>(true);

  const getMe = async () => {
    // Set up temp user if not logged in
    if (isLoggedIn) {
      const res = await initialize();
      if (!res?.data) return;
      dispatch(userAction(res.data.user));
      dispatch(balanceAction(res.data.user.balance as number));
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  };

  useEffect(() => {
    getMe();
  }, []);
  if (loading) return <SplashScreen />;
  return children;
}
