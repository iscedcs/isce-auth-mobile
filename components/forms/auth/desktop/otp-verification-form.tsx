"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  OtpVerificationFormData,
  otpVerificationSchema,
} from "@/schemas/desktop";

export function OtpVerificationForm({
  onSubmit,
  onResendCode,
  defaultValues,
  isLoading,
}: OtpVerificationFormProps) {
  const form = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: defaultValues || {
      code: "",
    },
  });

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-400 text-sm">
        Enter the OTP code sent to your mail
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Enter the code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter code"
                    maxLength={6}
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0 text-center text-lg tracking-widest"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-center">
            <button
              type="button"
              onClick={onResendCode}
              className="text-sm text-gray-400 hover:text-white underline">
              {"Didn't Receive Code? Resend Code"}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg">
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
