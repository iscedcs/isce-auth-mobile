"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthService } from "@/lib/auth-service";
import { getSafeRedirect } from "@/lib/safe-redirect";
import {
  OtpVerificationFormData,
  PasswordCreationFormData,
  UserDetailsFormData,
  UserTypeFormData,
} from "@/schemas/desktop";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthLayout } from "./forms/auth/auth-layout";
import { AccountTypeForm } from "./forms/auth/desktop/account-type-form";
import { OtpVerificationForm } from "./forms/auth/desktop/otp-verification-form";
import { PasswordCreationForm } from "./forms/auth/desktop/password-creation-form";
import { UserDetailsForm } from "./forms/auth/desktop/user-details-form";
import { PasswordResetModal } from "./forms/auth/password-reset-modal";
import { Button } from "./ui/button";

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
  const otpRequestInFlightRef = useRef(false);
  const otpResendInFlightRef = useRef(false);
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
    setCurrentStep(3);
  };

  const handleOtpVerificationSubmit = async (data: OtpVerificationFormData) => {
    if (!signupData.userDetails?.email) {
      toast.error("Email not found. Please start over.");
      setCurrentStep(1);
      return;
    }
    if (!signupData.passwordCreation?.password) {
      toast.error("Password not found. Please set your password first.");
      setCurrentStep(3);
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

      // Store the OTP data and continue to sign-in
      setSignupData((prev) => ({ ...prev, otpVerification: data }));
      toast.success("Email verified successfully!");

      const login = await AuthService.signIn(
        signupData.userDetails.email,
        signupData.passwordCreation.password
      );
      if (!login.success || !login.data?.accessToken) {
        toast.error(
          "Account verified, but login failed. Please sign in manually."
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
    if (otpRequestInFlightRef.current) return;
    if (!signupData.userDetails) {
      toast.error("User details not found. Please start over.");
      setCurrentStep(1);
      return;
    }

    setIsLoading(true);

    try {
      otpRequestInFlightRef.current = true;
      const response = await AuthService.completeSignup(
        signupData.userDetails,
        data
      );

      if (response.success) {
        setSignupData((prev) => ({ ...prev, passwordCreation: data }));
        const otpResponse = await AuthService.requestOtp(
          signupData.userDetails.email
        );
        if (!otpResponse.success) {
          toast.error(otpResponse.message, { id: "desktop-otp-request" });
          return;
        }

        toast.success(
          "Details saved! Please check your email for verification code.",
          { id: "desktop-otp-request" }
        );
        setCurrentStep(4);
      } else {
        toast.error(response.message || "Unable to create your account.", {
          id: "desktop-signup",
        });
      }
    } catch (error) {
      console.error("Complete signup error:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        id: "desktop-signup",
      });
    } finally {
      setIsLoading(false);
      otpRequestInFlightRef.current = false;
    }
  };

  const handleResendCode = async () => {
    if (otpResendInFlightRef.current) return;
    if (!signupData.userDetails?.email) {
      toast.error("Email not found. Please start over.");
      return;
    }

    setIsLoading(true);

    try {
      otpResendInFlightRef.current = true;
      const response = await AuthService.requestOtp(
        signupData.userDetails.email
      );

      if (response.success) {
        toast.success("Verification code sent!", { id: "desktop-otp-resend" });
      } else {
        toast.error(response.message, { id: "desktop-otp-resend" });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend code. Please try again.", {
        id: "desktop-otp-resend",
      });
    } finally {
      setIsLoading(false);
      otpResendInFlightRef.current = false;
    }
  };

  const handlePreviousStep = () => {
    if (isLoading) return;
    if (currentStep <= 1) return;
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Please Select your account type";
      case 2:
        return "Enter your details";
      case 3:
        return "Set your password to your account";
      case 4:
        return "Enter the OTP code sent to your mail";
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
          <PasswordCreationForm
            onSubmit={handlePasswordCreationSubmit}
            defaultValues={signupData.passwordCreation}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <OtpVerificationForm
            onSubmit={handleOtpVerificationSubmit}
            onResendCode={handleResendCode}
            defaultValues={signupData.otpVerification}
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
      <div className="space-y-4">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePreviousStep}
            className="px-0 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {renderCurrentStep()}
      </div>
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
