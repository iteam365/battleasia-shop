import { z as zod } from 'zod';
import { useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import useApi from 'src/hooks/use-api';

import { dispatch } from 'src/store';
import { GAME_SERVERS } from 'src/global-config';
import { loginAction } from 'src/store/reducers/auth';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

export type SignUpSchemaType = zod.infer<typeof SignUpSchema>;

export const SignUpSchema = zod
  .object({
    inGameUserName: zod.string().min(1, { message: 'In Game User Name is required!' }),
    mobile: zod.string().min(1, { message: 'Mobile No is required!' }),
    pubgId: zod.string().min(1, { message: 'PUBG ID is required!' }),
    gameServer: zod.string().min(1, { message: 'Game Server is required!' }),
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    // referralCode: zod.string().optional(),
    password: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .min(8, { message: 'Password must be at least 8 characters!' }),
    confirmPassword: zod.string().min(1, { message: 'Confirm Password is required!' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

export function SignUpView() {
  const router = useRouter();
  const { registerApi } = useApi();

  const showPassword = useBoolean();
  const showConfirmPassword = useBoolean();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignUpSchemaType = {
    inGameUserName: '',
    mobile: '',
    pubgId: '',
    gameServer: '',
    email: '',
    // referralCode: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm<SignUpSchemaType>({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);

      // Parse phone number to extract country code and mobile number
      let countryCode = '';
      let mobileNo = '';

      if (data.mobile) {
        // First validate the phone number
        if (!isValidPhoneNumber(data.mobile)) {
          setErrorMessage('Please enter a valid phone number');
          return;
        }

        try {
          const phoneNumber = parsePhoneNumber(data.mobile);
          if (phoneNumber && phoneNumber.isValid()) {
            countryCode = phoneNumber.countryCallingCode || '';
            mobileNo = phoneNumber.nationalNumber || '';

            // Validate that country code was extracted
            if (!countryCode || countryCode.trim() === '') {
              setErrorMessage('Unable to extract country code from phone number. Please check your phone number format.');
              return;
            }

            // Validate that mobile number was extracted
            if (!mobileNo || mobileNo.trim() === '') {
              setErrorMessage('Unable to extract mobile number from phone number. Please check your phone number format.');
              return;
            }
          } else {
            setErrorMessage('Invalid phone number format. Please enter a valid phone number.');
            return;
          }
        } catch (error) {
          setErrorMessage('Invalid phone number format. Please enter a valid phone number with country code.');
          return;
        }
      } else {
        setErrorMessage('Phone number is required');
        return;
      }

      const registerData = {
        email: data.email,
        password: data.password,
        username: data.inGameUserName,
        countryCode,
        mobileNo,
        pubgId: data.pubgId,
        gameServer: data.gameServer,
        // referralCode: data.referralCode,
      };

      const res = await registerApi(registerData);

      const { status, session, user } = res.data;

      if (!status || !session?.accessToken) {
        throw new Error(res.data?.message || 'Access token not found in response');
      }

      dispatch(
        loginAction({
          user: user || { _id: '', email: data.email, username: data.inGameUserName },
          session: { accessToken: session.accessToken },
          balance: { balance: user?.balance || 0 },
        })
      );

    } catch (error: any) {
      console.error(error);
      const feedbackMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Stack gap={2}>
      {/* In Game User Name */}
      <Field.Text
        name="inGameUserName"
        label={
          <>
            In Game User Name <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
          },
        }}
      />

      {/* Mobile No with Country Code */}
      <Field.Phone
        name="mobile"
        label={
          <>
            Country Code & Mobile No <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        slotProps={{
          inputLabel: {
            shrink: true,
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
          },
        }}
      />

      {/* Enter your PUBG ID */}
      <Field.Text
        name="pubgId"
        label={
          <>
            Enter your PUBG ID <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
          },
        }}
      />

      {/* Game Server */}
      <FormControl fullWidth>
        <InputLabel shrink sx={{ "&.Mui-focused": { color: "#fff !important" } }} >
          Game Server <Box component="span" sx={{ color: 'error.main' }}>*</Box>
        </InputLabel>
        <Controller
          name="gameServer"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <>
              <Select
                {...field}
                label={
                  <>
                    Game Server <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </>
                }
                displayEmpty
                error={!!error}
                sx={{
                  color: "common.white",
                }}
              >
                <MenuItem value="" disabled sx={{ color: "common.white" }}>
                  Select
                </MenuItem>
                {GAME_SERVERS.map((server) => (
                  <MenuItem key={server.value} value={server.value} sx={{ color: "common.white" }}>
                    {server.label}
                  </MenuItem>
                ))}
              </Select>
              {error && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {error.message}
                </Typography>
              )}
            </>
          )}
        />
      </FormControl>

      {/* Email */}
      <Field.Text
        name="email"
        label={
          <>
            Email <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
          },
        }}
      />

      {/* Referral Code (optional) */}
      {/* <Field.Text
        name="referralCode"
        label="Referral Code (optional)"
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
          },
        }}
      /> */}

      {/* Password */}
      <Field.Text
        name="password"
        label={
          <>
            Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        type={showPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showPassword.onToggle} edge="end">
                  <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Confirm Password */}
      <Field.Text
        name="confirmPassword"
        label={
          <>
            Confirm Password <Box component="span" sx={{ color: 'error.main' }}>*</Box>
          </>
        }
        type={showConfirmPassword.value ? 'text' : 'password'}
        slotProps={{
          inputLabel: {
            sx: { "&.Mui-focused": { color: "#fff !important" } },
          },
          input: {
            sx: { color: "common.white" },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={showConfirmPassword.onToggle} edge="end">
                  <Iconify
                    icon={showConfirmPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <LoadingButton
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Create account..."
      >
        Create account
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      <Box sx={{ mb: 5, height: 1, mt: { xs: 0, sm: 5 }, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #ff8c00 0%, #ffaa00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(255, 140, 0, 0.5)',
            fontSize: { xs: 28, md: 36 },
            my: 1.5,
          }}
        >
          SIGN UP
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Already have an account? `}
          <Link component={RouterLink} href={paths.auth.signIn} variant="subtitle2">
            Sign In
          </Link>
        </Typography>
      </Box>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <Box
        component="span"
        sx={[
          () => ({
            mt: 3,
            display: 'block',
            textAlign: 'center',
            typography: 'caption',
            color: 'text.secondary',
          }),
        ]}
      >
        {'By signing up, I agree to '}
        <Link underline="always" color="primary.main">
          Terms of service
        </Link>
        {' and '}
        <Link underline="always" color="primary.main">
          Privacy policy
        </Link>
        .
      </Box>
    </>
  );
}

