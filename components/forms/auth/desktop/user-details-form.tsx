"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
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
import { UserDetailsFormData, userDetailsSchema } from "@/schemas/desktop";

interface UserDetailsFormProps {
  onSubmit: (data: UserDetailsFormData) => void;
  defaultValues?: Partial<UserDetailsFormData>;
  userType: "USER" | "BUSINESS_USER";
  isLoading?: boolean;
  referralCode?: string | null;
  prefillEmail?: string;
}

export function UserDetailsForm({
  onSubmit,
  defaultValues,
  isLoading,
  userType,
  referralCode: referralCodeProp,
  prefillEmail,
}: UserDetailsFormProps) {
  const isBusinessAccount = userType === "BUSINESS_USER";
  const sp = useSearchParams();

  const formDefaults = isBusinessAccount
    ? ({
        userType: "BUSINESS_USER",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        address: "",
        dob: "",
        referralCode: "",
        ...defaultValues,
      } as UserDetailsFormData)
    : ({
        userType: "USER",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        referralCode: "",
        ...defaultValues,
      } as UserDetailsFormData);

  const form = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: formDefaults,
  });

  const [isReferralDisabled, setIsReferralDisabled] = useState(false);
  const [isEmailPrefilled, setIsEmailPrefilled] = useState(false);

  useEffect(() => {
    const fromUrl =
      sp?.get("ref") ||
      sp?.get("referralCode") ||
      sp?.get("referralUsername");
    const fromStorage =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("referral_code")
        : null;
    const refCode =
      referralCodeProp?.trim() || fromUrl?.trim() || fromStorage?.trim() || null;

    if (refCode) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("referral_code", refCode);
      }
      setIsReferralDisabled(true);
      if (!form.getValues("referralCode")) {
        form.setValue("referralCode", refCode);
      }
    }
  }, [sp, form, referralCodeProp]);

  // Pre-fill email from parent if provided (from email-first pre-step) and lock it
  useEffect(() => {
    const emailToSet = prefillEmail || defaultValues?.email;
    if (emailToSet) {
      form.setValue("email", emailToSet);
      setIsEmailPrefilled(true);
    }
  }, [prefillEmail, defaultValues?.email, form]);

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-400 text-sm">
        Enter your {isBusinessAccount ? "BUSINESS_USER" : ""} details
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            onSubmit({
              ...data,
              referralCode:
                data.referralCode?.trim() ||
                form.getValues("referralCode")?.trim() ||
                (typeof sessionStorage !== "undefined"
                  ? sessionStorage.getItem("referral_code")?.trim() || undefined
                  : undefined),
            })
          )}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter your firstname
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="firstname"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
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
              <FormItem>
                <FormLabel className="text-white">
                  Enter your lastname
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="lastname"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter your phone number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Phone number"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter your email address
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    disabled={isEmailPrefilled}
                    readOnly={isEmailPrefilled}
                    placeholder="email address"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Referral username (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isReferralDisabled}
                    readOnly={isReferralDisabled}
                    placeholder="e.g. johndoe"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isBusinessAccount && (
            <>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Enter your business address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Business address"
                        className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">
                      Enter your date of birth
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        placeholder="Date of birth"
                        className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <input type="hidden" {...field} value={userType} />
                )}
              />
            </>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>
              An OTP Code will be sent to your mails to verify the mail used.
            </span>
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
