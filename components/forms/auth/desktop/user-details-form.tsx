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
import { UserDetailsFormData, userDetailsSchema } from "@/schemas/desktop";

interface UserDetailsFormProps {
  onSubmit: (data: UserDetailsFormData) => void;
  defaultValues?: Partial<UserDetailsFormData>;
  userType: "USER" | "BUSINESS_USER";
  isLoading?: boolean;
}

export function UserDetailsForm({
  onSubmit,
  defaultValues,
  isLoading,
  userType,
}: UserDetailsFormProps) {
  const isBusinessAccount = userType === "BUSINESS_USER";

  const formDefaults = isBusinessAccount
    ? ({
        userType: "BUSINESS_USER",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        address: "",
        dob: "",
        ...defaultValues,
      } as UserDetailsFormData)
    : ({
        userType: "USER",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        ...defaultValues,
      } as UserDetailsFormData);

  const form = useForm<UserDetailsFormData>({
    resolver: zodResolver(userDetailsSchema),
    defaultValues: formDefaults,
  });

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-400 text-sm">
        Enter your {isBusinessAccount ? "BUSINESS_USER" : ""} details
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    placeholder="email address"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
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
