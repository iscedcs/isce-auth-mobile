interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => void;
  onBackToSignIn: () => void;
  isLoading?: boolean;
}

interface OtpVerificationFormProps {
  onSubmit: (data: OtpVerificationFormData) => void;
  onResendCode: () => void;
  defaultValues?: OtpVerificationFormData;
  isLoading?: boolean;
}

interface AccountTypeFormProps {
  onSubmit: (data: AccountTypeFormData) => void;
  defaultValues?: AccountTypeFormData;
}
interface PasswordCreationFormProps {
  onSubmit: (data: PasswordCreationFormData) => void;
  defaultValues?: PasswordCreationFormData;
  isLoading?: boolean;
}

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => void;
  onForgotPassword: () => void; // This now opens the modal instead of changing view
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
  isLoading?: boolean;
}

interface UserDetailsFormProps {
  onSubmit: (data: UserDetailsFormData) => void;
  defaultValues?: UserDetailsFormData;
}
