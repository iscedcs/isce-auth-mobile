"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema } from "@/schemas/desktop";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Shield } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const resetPasswordWithCodeSchema = z.intersection(
  resetPasswordSchema,
  z.object({
    resetCode: z
      .string({
        error: "Reset code is required",
      })
      .min(6, "Reset code must be at least 6 characters")
      .max(100, "Reset code is too long")
      .trim(),
  })
);

type ResetPasswordWithCodeFormData = z.infer<
  typeof resetPasswordWithCodeSchema
>;

interface ResetPasswordStepProps {
  onSubmit: (data: ResetPasswordWithCodeFormData) => void;
  onResendCode?: () => void;
  isLoading?: boolean;
  email?: string;
  showResetCodeField?: boolean;
  resetCode?: string;
}

export function ResetPasswordStep({
  onResendCode,
  onSubmit,
  isLoading = false,
  email,
  showResetCodeField = false,
  resetCode,
}: ResetPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordWithCodeFormData>({
    resolver: zodResolver(resetPasswordWithCodeSchema),
    defaultValues: {
      resetCode: resetCode || "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("newPassword");
  const resetCodeValue = form.watch("resetCode");

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: "", color: "" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { strength: "Weak", color: "text-red-500" };
    if (score <= 3) return { strength: "Good", color: "text-yellow-500" };
    if (score <= 4) return { strength: "Strong", color: "text-blue-500" };
    return { strength: "Excellent", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const getMaskedEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    return `${localPart.substring(0, 2)}${"*".repeat(
      localPart.length - 2
    )}@${domain}`;
  };

  const handleSubmit = (data: ResetPasswordWithCodeFormData) => {
    console.log("=== RESET PASSWORD SUBMISSION ===");
    console.log("Form data:", {
      ...data,
      resetCode: data.resetCode,
      password: "[HIDDEN]",
      confirmPassword: "[HIDDEN]",
    });
    console.log("Reset code length:", data.resetCode.length);
    console.log("Email:", email);

    onSubmit(data);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-40 h-40 flex items-center justify-center">
          <Image
            src="/images/image.png"
            alt="Forgot Password Icon"
            width={100}
            height={100}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">
          Reset password
        </h2>
        <p className="text-gray-400 text-sm mb-2">
          {showResetCodeField
            ? "Enter the reset code from your email and set your new password"
            : "Please kindly set your new password"}
        </p>{" "}
        {email && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{getMaskedEmail(email)}</span>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {showResetCodeField && (
            <FormField
              control={form.control}
              name="resetCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Reset Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Enter the code from your email"
                        disabled={isLoading}
                        className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0 pr-10"
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          field.onChange(value);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData("text");
                          const cleanedText = pastedText.trim();
                          field.onChange(cleanedText);
                        }}
                      />
                      <Shield className="absolute right-0 top-3 h-5 w-5 text-gray-400" />
                    </div>
                  </FormControl>
                  <FormMessage />

                  {resetCodeValue && (
                    <div className="text-xs text-gray-500 mt-1">
                      {resetCodeValue.length >= 6 ? (
                        <span className="text-green-400">
                          ✅ Valid reset code format
                        </span>
                      ) : (
                        <span className="text-red-400">
                          ❌ Reset code must be at least 6 characters
                        </span>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />
          )}

          {/* Password Field */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      disabled={isLoading}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 pr-10 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-0 top-3 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  </div>
                </FormControl>
                {password && (
                  <div className="text-sm">
                    <span className="text-gray-400">Password Strength: </span>
                    <span className={passwordStrength.color}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Re-enter password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 pr-10 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                      className="absolute right-0 top-3 text-gray-400 hover:text-white">
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resend Code - NEW: Only show if showResetCodeField is true */}
          {showResetCodeField && onResendCode && (
            <div className="text-center">
              <Button
                type="button"
                onClick={onResendCode}
                disabled={isLoading}
                variant="ghost"
                className="text-sm text-gray-400 hover:text-white underline disabled:opacity-50 disabled:cursor-not-allowed p-0 h-auto font-normal">
                {isLoading
                  ? "Sending new code..."
                  : "Didn't receive the code? Resend"}
              </Button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isLoading ||
              (showResetCodeField &&
                (!resetCodeValue || resetCodeValue.length < 6)) ||
              !password ||
              passwordStrength.strength === "Weak" ||
              !form.watch("confirmPassword")
            }
            className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>

      {/* Password Requirements */}
      {/* {password && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400">
            <p className="font-semibold text-gray-300 mb-2">
              Password Requirements:
            </p>
            <div className="space-y-1">
              <div
                className={`flex items-center space-x-2 ${
                  password.length >= 8 ? "text-green-400" : "text-gray-500"
                }`}>
                <span>{password.length >= 8 ? "✅" : "⭕"}</span>
                <span>At least 8 characters</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${
                  /[a-z]/.test(password) ? "text-green-400" : "text-gray-500"
                }`}>
                <span>{/[a-z]/.test(password) ? "✅" : "⭕"}</span>
                <span>One lowercase letter</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${
                  /[A-Z]/.test(password) ? "text-green-400" : "text-gray-500"
                }`}>
                <span>{/[A-Z]/.test(password) ? "✅" : "⭕"}</span>
                <span>One uppercase letter</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${
                  /\d/.test(password) ? "text-green-400" : "text-gray-500"
                }`}>
                <span>{/\d/.test(password) ? "✅" : "⭕"}</span>
                <span>One number</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${
                  /[^a-zA-Z0-9]/.test(password)
                    ? "text-green-400"
                    : "text-gray-500"
                }`}>
                <span>{/[^a-zA-Z0-9]/.test(password) ? "✅" : "⭕"}</span>
                <span>One special character</span>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
