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
  AddressDobFormData,
  addressDobSchema,
} from "@/schemas/desktop";

interface AddressDobFormProps {
  onSubmit: (data: AddressDobFormData) => void;
  defaultValues?: Partial<AddressDobFormData>;
  isLoading?: boolean;
}

export function AddressDobForm({
  onSubmit,
  defaultValues,
  isLoading,
}: AddressDobFormProps) {
  const form = useForm<AddressDobFormData>({
    resolver: zodResolver(addressDobSchema),
    defaultValues: {
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
            className="w-full rounded-[12px] font-semibold py-[24px]"
          >
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
