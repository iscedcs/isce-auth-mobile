"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
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
import { SignInFormData, signInSchema } from "@/schemas/desktop";
import { appleIcon, googleIcon } from "@/lib/icons";

export function DesktopSignInForm({
  onSubmit,
  onForgotPassword,
  onGoogleSignIn,
  onAppleSignIn,
  isLoading = false,
}: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-2xl font-semibold mb-2 text-white">
          Welcome Back to ISCE Ecosystem
        </h2>
        <p className="text-white font-normal text-sm">
          Please enter your details to sign in your account
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-transparent border border-background hover:border-bactext-background-500 text-white py-3 rounded-sm flex items-center hover:text-black justify-center space-x-4">
          {googleIcon}
          <span>Continue with Google</span>
        </Button>

        <Button
          type="button"
          onClick={onAppleSignIn}
          disabled={isLoading}
          className="w-full bg-transparent border border-background hover:border-background text-background-500 text-white py-3 rounded-sm hover:text-black flex items-center justify-center space-x-4">
          {appleIcon}
          <span>Continue with Apple</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-background" />
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="px-2 bg-black text-background">Or Sign in with</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-semibold text-base">
                  {"What's your email?"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className="bg-transparent placeholder:text-[13px] border-0 border-b border-background rounded-none px-0 py-3 pr-10 text-white placeholder:text-background-500 focus:border-white focus-visible:ring-0"
                    />
                    <Mail className="absolute right-0 top-3 h-5 w-5 text-background-400" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter your password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="bg-transparent placeholder:text-[13px] border-0 border-b border-background rounded-none px-0 py-3 pr-10 text-white placeholder:text-background-500 focus:border-white focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-0 top-3 text-background-400 hover:text-white">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
            className="w-full text-md bg-transparent hover:bg-background-100 text-primary py-3 rounded-lg font-semibold">
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </Form>

      {/* Forgot Password Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={isLoading}
          className="text-md font-semibold text-background-400 hover:text-white underline">
          Forgot password?
        </button>
      </div>
    </div>
  );
}
