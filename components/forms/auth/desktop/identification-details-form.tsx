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
  IdentificationDetailsFormData,
  identificationDetailsSchema,
} from "@/schemas/desktop";

interface IdentificationDetailsFormProps {
  onSubmit: (data: IdentificationDetailsFormData) => void;
  defaultValues?: Partial<IdentificationDetailsFormData>;
  isLoading?: boolean;
}

export function IdentificationDetailsForm({
  onSubmit,
  defaultValues,
  isLoading,
}: IdentificationDetailsFormProps) {
  const form = useForm<IdentificationDetailsFormData>({
    resolver: zodResolver(identificationDetailsSchema),
    defaultValues: {
      identificationType: defaultValues?.identificationType || "",
      idNumber: defaultValues?.idNumber || "",
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
