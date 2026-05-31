"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { AuthService } from "@/lib/auth-service";
import { csrfFetch } from "@/lib/csrf-client";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { startFiveMinuteCountdown } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { extendedSignUpSchema, MOI } from "@/schemas/mobile/sign-up";
import type { z } from "zod";

import { BiRename } from "react-icons/bi";
import { FaLock, FaPhone } from "react-icons/fa";
import { GoArrowLeft } from "react-icons/go";
import { HiOutlineAtSymbol, HiOutlineMail } from "react-icons/hi";
import { MdOutlineDateRange, MdOutlineLocationOn } from "react-icons/md";
import { MdOutlineBusinessCenter } from "react-icons/md";
import { TbLoader2 } from "react-icons/tb";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type businessSignUpValues = z.infer<typeof extendedSignUpSchema>;

interface BusinessSignUpFormProps {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  stepNumber: number;
  setStepNumber: React.Dispatch<React.SetStateAction<number>>;
  getRedirect: () => string;
  prefillEmail?: string;
  onBackFromFirst?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_SIZE = 15;
// Steps: 30=names, 45=email+OTP, 60=phone, 75=password, 90=address, 105=dob, 120=business info

const ID_TYPE_LABELS: Record<string, string> = {
  NIN: "NIN — National Identity Number",
  CAC: "CAC — Corporate Affairs Commission",
  TIN: "TIN — Tax Identification Number",
  BVN: "BVN — Bank Verification Number",
};

// ─── Slide helper ─────────────────────────────────────────────────────────────

function SlideStep({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return <>{children}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessSignUpForm({
  step,
  setStep,
  stepNumber,
  setStepNumber,
  getRedirect,
  prefillEmail,
  onBackFromFirst,
}: BusinessSignUpFormProps) {
  // ── Form setup ────────────────────────────────────────────────────────────
  const form = useForm<businessSignUpValues>({
    resolver: zodResolver(extendedSignUpSchema),
    mode: "onChange",
  });

  // ── State ─────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [isConfirmPasswordScreen, setIsConfirmPasswordScreen] = useState(false);
  const [otpState, setOtpState] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "fair" | "strong" | ""
  >("");

  const otpRequestInFlightRef = useRef(false);
  const otpVerifyInFlightRef = useRef(false);
  const otpResendInFlightRef = useRef(false);

  // ── Pre-fill email ────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefillEmail) {
      form.setValue("email", prefillEmail, { shouldValidate: false });
    }
  }, [prefillEmail, form]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goToStep = (targetStep: number, targetStepNumber: number) => {
    if (targetStepNumber > stepNumber + 1) return;
    setStep(targetStep);
    setStepNumber(Math.max(stepNumber, targetStepNumber));
  };

  const handlePreviousStep = () => {
    if (step <= STEP_SIZE * 2) {
      onBackFromFirst?.();
      return;
    }
    if (isOtpScreen) {
      setIsOtpScreen(false);
      return;
    }
    if (isConfirmPasswordScreen) {
      setIsConfirmPasswordScreen(false);
      return;
    }
    setStep((prev) => prev - STEP_SIZE);
    setStepNumber((prev) => Math.max(1, prev - 1));
  };

  // ── Step guard ────────────────────────────────────────────────────────────
  const stepGuard = async (currentStep: number): Promise<boolean> => {
    switch (currentStep) {
      case STEP_SIZE * 2:
        return form.trigger(["firstName", "lastName"]);
      case STEP_SIZE * 3:
        return form.trigger(["email"]);
      case STEP_SIZE * 4:
        return form.trigger(["phoneNumber"]);
      case STEP_SIZE * 5:
        return form.trigger([
          "passwordObj.password",
          "passwordObj.confirmPassword",
        ]);
      case STEP_SIZE * 6:
        return form.trigger(["address"]);
      case STEP_SIZE * 7:
        return form.trigger(["dob"]);
      case STEP_SIZE * 8:
        return form.trigger([
          "businessName",
          "businessEmail",
          "identificationType",
        ]);
      default:
        return true;
    }
  };

  // ── OTP ───────────────────────────────────────────────────────────────────
  const requestOtp = async (isResend = false) => {
    const email = form.getValues("email");
    if (!email) return;

    const inFlightRef = isResend ? otpResendInFlightRef : otpRequestInFlightRef;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      await csrfFetch("/api/request-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setTimeLeft(300);
      startFiveMinuteCountdown(
        (min, sec) => setTimeLeft(min * 60 + sec),
        () => setTimeLeft(0),
      );
      setIsOtpScreen(true);
    } catch {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleOtpChange = async (value: string) => {
    setOtpState(value);
    if (value.length < 6) return;
    if (otpVerifyInFlightRef.current) return;
    otpVerifyInFlightRef.current = true;

    try {
      const res = await csrfFetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.getValues("email"),
          code: value,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.verified) {
        setIsOtpScreen(false);
        goToStep(STEP_SIZE * 4, 4);
      } else {
        toast.error("Invalid code. Please try again.");
        setOtpState("");
      }
    } catch {
      toast.error("Failed to verify code. Please try again.");
    } finally {
      otpVerifyInFlightRef.current = false;
    }
  };

  // ── Password ──────────────────────────────────────────────────────────────
  const evaluatePasswordStrength = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLong = password.length >= 8;
    const score = [hasUpper, hasLower, hasNumber, isLong].filter(
      Boolean,
    ).length;
    if (score <= 2) setPasswordStrength("weak");
    else if (score === 3) setPasswordStrength("fair");
    else setPasswordStrength("strong");
  };

  const handleShowConfirmPasswordScreen = async () => {
    if (!isConfirmPasswordScreen) {
      const valid = await form.trigger("passwordObj.password");
      if (!valid) {
        toast.error("Please choose a strong password before continuing.");
        return;
      }
      setIsConfirmPasswordScreen(true);
      return;
    }
    const valid = await stepGuard(STEP_SIZE * 5);
    if (!valid) {
      toast.error("Your passwords must match to continue.");
      return;
    }
    setIsConfirmPasswordScreen(false);
    goToStep(STEP_SIZE * 6, 6);
  };

  // ── Error helpers ─────────────────────────────────────────────────────────
  const getSignupErrorMessage = (responseData: unknown) => {
    const d = responseData as Record<string, unknown> | null | undefined;
    const detailsMessage = (d?.details as Record<string, unknown>)?.message;
    if (Array.isArray(detailsMessage))
      return detailsMessage.filter(Boolean).join(", ");
    if (typeof detailsMessage === "string" && detailsMessage.trim())
      return detailsMessage;
    const directMessage = d?.message;
    if (Array.isArray(directMessage))
      return directMessage.filter(Boolean).join(", ");
    if (typeof directMessage === "string" && directMessage.trim())
      return directMessage;
    if (typeof d?.error === "string" && (d.error as string).trim())
      return d.error as string;
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (data: businessSignUpValues) => {
    const finalValid = await stepGuard(STEP_SIZE * 8);
    if (!finalValid) return;

    setIsLoading(true);
    setIsBuildingProfile(true);

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phoneNumber,
      email: data.email,
      dob: data.dob,
      address: data.address,
      businessName: data.businessName,
      businessEmail: data.businessEmail,
      identificationType: data.identificationType,
      idNumber: data.idNumber ?? null,
      position: data.position ?? null,
      password: data.passwordObj.password,
      confirmpassword: data.passwordObj.confirmPassword,
    };

    try {
      const res = await csrfFetch("/api/sign-up/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();

      if (res.ok) {
        setIsLoading(false);

        // Attempt auto sign-in
        const login = await AuthService.signIn(payload.email, payload.password);

        if (login.success && login.data?.accessToken) {
          await csrfFetch("/api/auth/set-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: login.data.accessToken,
              refreshToken: login.data.refreshToken,
            }),
          });

          toast.success("You're In!");
          const safe = getSafeRedirect(getRedirect());
          setIsBuildingProfile(true);

          setTimeout(() => {
            if (safe && login.data?.accessToken) {
              window.location.href = `/api/auth/launch?url=${encodeURIComponent(safe)}`;
              return;
            }
            window.location.href = "/dashboard";
          }, 1500);
          return;
        }

        const r = getRedirect();
        toast.success("Account created! Please sign in.");
        window.location.href = `/sign-in?redirect=${encodeURIComponent(r)}`;
        return;
      }

      setIsBuildingProfile(false);
      setIsLoading(false);
      goToStep(STEP_SIZE * 2, 2);
      const backendMessage = getSignupErrorMessage(responseData);
      toast.error("Sign up failed", {
        description:
          backendMessage ||
          "There was a problem creating your account. Please try again.",
      });
    } catch (e) {
      console.log("Business sign-up error", e);
      setIsBuildingProfile(false);
      setIsLoading(false);
    }
  };

  // ── Building profile overlay ──────────────────────────────────────────────
  if (isBuildingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <TbLoader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-semibold">
          Setting up your business profile…
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* ── STEP 2: Names ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 2 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <BiRename className="w-8 h-8" />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    First name*
                  </Label>
                  <FormControl>
                    <Input
                      required
                      autoComplete="given-name"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="e.g. John"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <Label className="font-extrabold text-[24px]">
                    Last name*
                  </Label>
                  <FormControl>
                    <Input
                      required
                      autoComplete="family-name"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="e.g. Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={async () => {
                  const valid = await stepGuard(STEP_SIZE * 2);
                  if (valid) goToStep(STEP_SIZE * 3, 3);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 3: Email ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 3 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <HiOutlineMail className="w-8 h-8" />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Your email address*
                  </Label>
                  <FormControl>
                    <Input
                      type="email"
                      required
                      autoComplete="email"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={async () => {
                  const valid = await stepGuard(STEP_SIZE * 3);
                  if (valid) await requestOtp();
                }}
              >
                Send verification code
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── OTP Screen ── */}
        <SlideStep show={step === STEP_SIZE * 3 && isOtpScreen}>
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <HiOutlineAtSymbol className="w-8 h-8" />
            <Label className="mt-2.5 font-extrabold text-[24px] block">
              Enter the 6-digit code
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Sent to {form.getValues("email")}
            </p>
            <Input
              maxLength={6}
              inputMode="numeric"
              className="rounded-[12px] h-[50px] text-[20px] tracking-widest text-center"
              placeholder="_ _ _ _ _ _"
              value={otpState}
              onChange={(e) =>
                handleOtpChange(e.target.value.replace(/\D/g, ""))
              }
            />
            <button
              type="button"
              className="mt-4 text-sm underline disabled:opacity-40"
              disabled={timeLeft > 0}
              onClick={() => requestOtp(true)}
            >
              {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Resend code"}
            </button>
          </div>
        </SlideStep>

        {/* ── STEP 4: Phone ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 4 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <FaPhone className="w-8 h-8" />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Phone number*
                  </Label>
                  <FormControl>
                    <Input
                      type="tel"
                      required
                      autoComplete="tel"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="e.g. 08012345678"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={async () => {
                  const valid = await stepGuard(STEP_SIZE * 4);
                  if (valid) goToStep(STEP_SIZE * 5, 5);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 5: Password ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 5 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <FaLock className="w-8 h-8" />
            <FormField
              control={form.control}
              name="passwordObj.password"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Create a password*
                  </Label>
                  <FormControl>
                    <Input
                      type="password"
                      required
                      autoComplete="new-password"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="Min 8 chars, upper, lower, number"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        evaluatePasswordStrength(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {passwordStrength && (
                    <div className="flex gap-2 mt-2">
                      {(["weak", "fair", "strong"] as const).map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            passwordStrength === "weak"
                              ? "bg-red-500"
                              : passwordStrength === "fair"
                                ? level !== "strong"
                                  ? "bg-yellow-400"
                                  : "bg-muted"
                                : "bg-green-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={handleShowConfirmPasswordScreen}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 5b: Confirm Password ── */}
        <SlideStep show={step === STEP_SIZE * 5 && isConfirmPasswordScreen}>
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <FaLock className="w-8 h-8" />
            <FormField
              control={form.control}
              name="passwordObj.confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Confirm your password*
                  </Label>
                  <FormControl>
                    <Input
                      type="password"
                      required
                      autoComplete="new-password"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="Re-enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={handleShowConfirmPasswordScreen}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 6: Address ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 6 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <MdOutlineLocationOn className="w-8 h-8" />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Home address*
                  </Label>
                  <FormControl>
                    <Input
                      required
                      autoComplete="street-address"
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="e.g. 12 Lagos Street, Abuja"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={async () => {
                  const valid = await stepGuard(STEP_SIZE * 6);
                  if (valid) goToStep(STEP_SIZE * 7, 7);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 7: Date of Birth ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 7 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <MdOutlineDateRange className="w-8 h-8" />
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <Label className="mt-2.5 font-extrabold text-[24px]">
                    Date of birth*
                  </Label>
                  <FormControl>
                    <Input
                      type="date"
                      required
                      className="rounded-[12px] h-[50px] text-[16px]"
                      max={new Date().toISOString().split("T")[0]}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : (field.value ?? "")
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="button"
                className="w-full rounded-[12px] font-semibold py-[24px]"
                onClick={async () => {
                  const valid = await stepGuard(STEP_SIZE * 7);
                  if (valid) goToStep(STEP_SIZE * 8, 8);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </SlideStep>

        {/* ── STEP 8: Business Info ── */}
        <SlideStep
          show={
            step === STEP_SIZE * 8 && !isOtpScreen && !isConfirmPasswordScreen
          }
        >
          <div className="w-full mt-5">
            <GoArrowLeft
              onClick={handlePreviousStep}
              className="w-8 h-8 mb-4 cursor-pointer"
            />
            <MdOutlineBusinessCenter className="w-8 h-8" />
            <Label className="mt-2.5 font-extrabold text-[24px] block mb-4">
              Your business details
            </Label>

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <Label>Business name*</Label>
                  <FormControl>
                    <Input
                      required
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="e.g. Acme Nigeria Ltd"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessEmail"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <Label>Business email*</Label>
                  <FormControl>
                    <Input
                      type="email"
                      required
                      className="rounded-[12px] h-[50px] text-[16px]"
                      placeholder="contact@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identificationType"
              render={({ field }) => (
                <FormItem className="mb-3">
                  <Label>Identification type*</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-[12px] h-[50px] text-[16px]">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOI.map((type) => (
                        <SelectItem key={type} value={type}>
                          {ID_TYPE_LABELS[type] ?? type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="absolute bottom-0 mb-[30px] w-[calc(100%-48px)]">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[12px] font-semibold py-[24px]"
              >
                {isLoading ? (
                  <TbLoader2 className="animate-spin" />
                ) : (
                  "Create business account"
                )}
              </Button>
            </div>
          </div>
        </SlideStep>
      </form>
    </Form>
  );
}
