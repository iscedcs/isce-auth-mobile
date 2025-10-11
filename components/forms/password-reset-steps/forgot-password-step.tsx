"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, Phone, ArrowLeft } from "lucide-react";
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
import Image from "next/image";
import {
  ForgotPasswordFormData,
  forgotPasswordSchema,
} from "@/schemas/desktop";

interface ForgotPasswordStepProps {
  onSubmit: (data: ForgotPasswordFormData, method?: "email" | "phone") => void;
  onBackToLogin: () => void;
  isLoading?: boolean;
}

export function ForgotPasswordStep({
  onSubmit,
  onBackToLogin,
  isLoading = false,
}: ForgotPasswordStepProps) {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = (data: ForgotPasswordFormData) => {
    onSubmit(data, "email");
  };

  const handlePhoneReset = () => {
    const email = form.getValues("email");
    if (email) {
      onSubmit({ email }, "phone");
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-40 h-40 flex text-background items-center justify-center">
          <Image
            src="/images/signpost1.png"
            alt="Forgot Password Icon"
            width={70}
            height={70}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">
          Forgot your Password?
        </h2>
        <p className="text-white text-sm">
          Enter your email address and we'll send you a code to reset your
          password.{" "}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  {"What's your email?"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 pr-10 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                    />
                    <Mail className="absolute right-0 top-3 h-5 w-5 text-white" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Option */}
          {/* <Button
            type="button"
            onClick={handlePhoneReset}
            disabled={isLoading || !form.getValues("email")}
            className="flex items-center w-full bg-transparent space-x-2 text-sm text-white hover:text-white disabled:opacity-50">
            <Phone size={16} />
            <span>Retrieve Using Phone Number</span>
          </Button> */}

          <Button
            type="submit"
            disabled={isLoading || !form.formState.isValid}
            className="w-full rounded-xl bg-white hover:bg-gray-100 text-black py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          We'll send a 6-digit verification code to your email address.
        </p>
      </div>
      {/* Back to Login */}
      <Button
        onClick={onBackToLogin}
        disabled={isLoading}
        className="flex items-center rounded-xl  bg-transparent justify-center space-x-2 text-sm text-white hover:text-white w-full">
        <ArrowLeft size={16} />
        <span>Back to Login</span>
      </Button>
    </div>
  );
}
