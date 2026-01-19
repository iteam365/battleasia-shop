import { useCallback } from 'react';
import { toast } from 'sonner';

type Variant = 'default' | 'success' | 'error' | 'warning' | 'info';

type SnackbarOptions = {
  variant?: Variant;
  description?: string;
  duration?: number;
};

export function useSnackbar() {
  const enqueueSnackbar = useCallback(
    (message: string, options?: SnackbarOptions) => {
      const { variant = 'default', description, duration } = options || {};
      const common = { description, duration };
      switch (variant) {
        case 'success':
          toast.success(message, common);
          break;
        case 'error':
          toast.error(message, common);
          break;
        case 'warning':
          toast.warning(message, common);
          break;
        case 'info':
          toast.info(message, common);
          break;
        default:
          toast(message, common);
      }
    },
    []
  );

  return { enqueueSnackbar };
}
