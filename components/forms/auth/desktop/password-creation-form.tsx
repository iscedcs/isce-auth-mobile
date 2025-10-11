"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
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
  PasswordCreationFormData,
  passwordCreationSchema,
} from "@/schemas/desktop";

export function PasswordCreationForm({
  onSubmit,
  defaultValues,
  isLoading = false,
}: PasswordCreationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordCreationFormData>({
    resolver: zodResolver(passwordCreationSchema),
    defaultValues: defaultValues || {
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  const passwordRequirements = [
    {
      label: "At least 8 characters long",
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: "At least one lowercase letter",
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: "At least one uppercase letter",
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    { label: "At least one number", test: (pwd: string) => /\d/.test(pwd) },
    {
      label: "At least one special character",
      test: (pwd: string) => /[^a-zA-Z0-9]/.test(pwd),
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-400 text-sm">
        Set your password to your account
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 pr-10 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-3 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {password && (
            <div className="space-y-2">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm">
                  <Check
                    size={16}
                    className={
                      req.test(password) ? "text-green-500" : "text-gray-500"
                    }
                  />
                  <span
                    className={
                      req.test(password) ? "text-green-500" : "text-gray-400"
                    }>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

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
                      placeholder="Re-enter password"
                      className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 pr-10 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-0 top-3 text-gray-400 hover:text-white">
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {confirmPassword && (
            <div className="flex items-center space-x-2 text-sm">
              <Check
                size={16}
                className={
                  password === confirmPassword
                    ? "text-green-500"
                    : "text-gray-500"
                }
              />
              <span
                className={
                  password === confirmPassword
                    ? "text-green-500"
                    : "text-gray-400"
                }>
                Password Matches
              </span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg">
            Login
          </Button>
        </form>
      </Form>
    </div>
  );
}
