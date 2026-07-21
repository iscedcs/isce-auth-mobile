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
  CompanyDetailsFormData,
  companyDetailsSchema,
} from "@/schemas/desktop";

interface CompanyDetailsFormProps {
  onSubmit: (data: CompanyDetailsFormData) => void;
  defaultValues?: Partial<CompanyDetailsFormData>;
  isLoading?: boolean;
}

export function CompanyDetailsForm({
  onSubmit,
  defaultValues,
  isLoading,
}: CompanyDetailsFormProps) {
  const form = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      businessName: defaultValues?.businessName || "",
      businessEmail: defaultValues?.businessEmail || "",
      businessAddress: defaultValues?.businessAddress || "",
      position: defaultValues?.position || "",
    },
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter business name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Business name"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
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
              <FormItem>
                <FormLabel className="text-white">
                  Enter business email
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="info@company.com"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter business address
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
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter position / role (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Managing Director"
                    className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white placeholder:text-gray-500 focus:border-white focus-visible:ring-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[12px] font-semibold py-[24px]"
          >
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
