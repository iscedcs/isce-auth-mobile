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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BusinessOnlyDetailsFormData,
  businessOnlyDetailsSchema,
} from "@/schemas/desktop";

interface BusinessDetailsFormProps {
  onSubmit: (data: BusinessOnlyDetailsFormData) => void;
  defaultValues?: Partial<BusinessOnlyDetailsFormData>;
  isLoading?: boolean;
}

export function BusinessDetailsForm({
  onSubmit,
  defaultValues,
  isLoading,
}: BusinessDetailsFormProps) {
  const form = useForm<BusinessOnlyDetailsFormData>({
    resolver: zodResolver(businessOnlyDetailsSchema),
    defaultValues: {
      businessName: defaultValues?.businessName || "",
      businessEmail: defaultValues?.businessEmail || "",
      identificationType: defaultValues?.identificationType || "",
      idNumber: defaultValues?.idNumber || "",
      businessAddress: defaultValues?.businessAddress || "",
      position: defaultValues?.position || "",
      address: defaultValues?.address || "",
      dob: defaultValues?.dob || "",
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
            name="identificationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Select identification type
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-transparent border-0 border-b border-gray-600 rounded-none px-0 py-3 text-white focus:ring-0">
                      <SelectValue placeholder="Select ID type (e.g. CAC)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CAC">CAC</SelectItem>
                    <SelectItem value="NIN">NIN</SelectItem>
                    <SelectItem value="TIN">TIN</SelectItem>
                    <SelectItem value="BVN">BVN</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter ID number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Identification number"
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

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Enter your address
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Address"
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg"
          >
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
