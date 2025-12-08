"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthService } from "@/lib/auth-service";
import { getSafeRedirect } from "@/lib/safe-redirect";
import {
  OtpVerificationFormData,
  PasswordCreationFormData,
  UserDetailsFormData,
  UserTypeFormData,
} from "@/schemas/desktop";
import { toast } from "sonner";
import { AuthLayout } from "./forms/auth/auth-layout";
import { AccountTypeForm } from "./forms/auth/desktop/account-type-form";
import { OtpVerificationForm } from "./forms/auth/desktop/otp-verification-form";
import { PasswordCreationForm } from "./forms/auth/desktop/password-creation-form";
import { UserDetailsForm } from "./forms/auth/desktop/user-details-form";
import { PasswordResetModal } from "./forms/auth/password-reset-modal";

type SignupData = {
  userType?: UserTypeFormData;
  userDetails?: UserDetailsFormData;
  otpVerification?: OtpVerificationFormData;
  passwordCreation?: PasswordCreationFormData;
};

type Props = { callbackUrl: string | null };

export default function SignUpClient({ callbackUrl }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>({});
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const singleProduct = useSearchParams();
  const safe = getSafeRedirect(callbackUrl);

  useEffect(() => {
    if (safe) sessionStorage.setItem("redirect_hint", safe);
  }, [safe]);

  function getRedirect() {
    const fromStorage = sessionStorage.getItem("redirect_hint");
    return getSafeRedirect(fromStorage) || "/";
  }

  // useEffect(() => {
  //   function maybeForceReauth() {
  //     if (singleProduct.get("prompt") === "login") {
  //       localStorage.removeItem("isce_auth_token");

  //       sessionStorage.removeItem("redirect_hint");

  //       document.cookie = "accessToken=; Max-Age=0; path=/;";
  //     }
  //   }

  //   maybeForceReauth();
  // }, [singleProduct]);

  const cardImages = [
    "/images/BROWN.png",
    "/images/GREEN.png",
    "/images/PuURPLE.png",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((p) => (p + 1) % cardImages.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  const handleUserTypeSubmit = (data: UserTypeFormData) => {
    setSignupData((prev) => ({ ...prev, userType: data }));
    setCurrentStep(2);
  };

  const handleUserDetailsSubmit = async (data: UserDetailsFormData) => {
    let userDetails: SignupData["userDetails"];

    if ((signupData.userType?.userType || "USER") === "BUSINESS_USER") {
      userDetails = {
        ...data,
        userType: "BUSINESS_USER" as const,
        address: data.address ?? "",
        dob: data.dob ?? "",
      };
    } else {
      userDetails = {
        ...data,
        userType: "USER" as const,
        dob: data.dob ?? "",
      };
    }
    setSignupData((prev) => ({
      ...prev,
      userDetails,
    }));
    toast.success(
      "Details saved! Please check your email for verification code."
    );
    setCurrentStep(3);
  };

  const handleOtpVerificationSubmit = async (data: OtpVerificationFormData) => {
    if (!signupData.userDetails?.email) {
      toast.error("Email not found. Please start over.");
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);

    try {
      // If your backend supports separate OTP verification, uncomment this:
      const response = await AuthService.verifyOtp({
        ...data,
        email: signupData.userDetails.email,
      });

      if (!response.success) {
        toast.error(response.message);
        setIsLoading(false);
        return;
      }

      // For now, just store the OTP data and move to next step
      setSignupData((prev) => ({ ...prev, otpVerification: data }));
      toast.success("Email verified successfully!");
      setCurrentStep(4);
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordCreationSubmit = async (
    data: PasswordCreationFormData
  ) => {
    if (!signupData.userDetails) {
      toast.error("User details not found. Please start over.");
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.completeSignup(
        signupData.userDetails,
        data
      );

      if (response.success) {
        setSignupData((prev) => ({ ...prev, passwordCreation: data }));
        toast.success("Account created successfully!");

        const login = await AuthService.signIn(
          signupData.userDetails.email,
          data.password
        );
        if (!login.success || !login.data?.accessToken) {
          toast.error(
            "Account created, but login failed. Please sign in manually."
          );
          const redirect = safe || getRedirect();
          router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
          setIsLoading(false);
          return;
        }

        const accessToken = login.data.accessToken;
        localStorage.setItem("isce_auth_token", accessToken);

        toast.success("Welcome! Redirecting...");

        if (safe && accessToken) {
          const target = new URL(safe);
          const callback = new URL("/auth/callback", target.origin);
          callback.searchParams.set("token", accessToken);

          const finalPath = target.pathname + target.search + target.hash;
          callback.searchParams.set("redirect", finalPath);

          window.location.href = callback.toString();
          return;
        }
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Complete signup error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signupData.userDetails?.email) {
      toast.error("Email not found. Please start over.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthService.requestOtp(
        signupData.userDetails.email
      );

      if (response.success) {
        toast.success("Verification code sent!");
      } else {
        toast.error(response.message);
      }

      toast.success("Verification code sent!");
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Please Select your account type";
      case 2:
        return "Enter your details";
      case 3:
        return "Enter the OTP code sent to your mail";
      case 4:
        return "Set your password to your account";
      default:
        return "";
    }
  };

  const selectedUserType = signupData.userType?.userType;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountTypeForm
            onSubmit={handleUserTypeSubmit}
            defaultValues={signupData.userType}
          />
        );
      case 2:
        if (!selectedUserType) {
          setCurrentStep(1);
          return null;
        }
        return (
          <UserDetailsForm
            onSubmit={handleUserDetailsSubmit}
            defaultValues={signupData.userDetails}
            userType={selectedUserType || "USER"}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <OtpVerificationForm
            onSubmit={handleOtpVerificationSubmit}
            onResendCode={handleResendCode}
            defaultValues={signupData.otpVerification}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <PasswordCreationForm
            onSubmit={handlePasswordCreationSubmit}
            defaultValues={signupData.passwordCreation}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout
      currentStep={currentStep}
      totalSteps={4}
      cardImages={cardImages}
      currentSlide={current}
      setCurrentSlide={setCurrent}>
      {renderCurrentStep()}
      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => setIsPasswordResetModalOpen(false)}
        onLoginRedirect={() => {
          setIsPasswordResetModalOpen(false);
          const r = safe || getRedirect();
          router.push(`/sign-in?redirect=${encodeURIComponent(r)}`);
        }}
      />
    </AuthLayout>
  );
}
