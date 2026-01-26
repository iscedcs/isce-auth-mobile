"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserTypeFormData, userTypeSchema } from "@/schemas/desktop";

export function AccountTypeForm({
  onSubmit,
  defaultValues,
}: AccountTypeFormProps) {
  const form = useForm<UserTypeFormData>({
    resolver: zodResolver(userTypeSchema),
    defaultValues: defaultValues || {
      accountType: undefined,
    },
  });

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-400 text-sm">
        Please Select your account type
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="space-y-4">
                    <div className="relative flex items-start space-x-4 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                      <RadioGroupItem
                        value="USER"
                        id="USER"
                        className="peer hidden"
                        checked={field.value === "USER"}
                      />
                      <Label htmlFor="USER" className="flex cursor-pointer">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">
                            Individual
                          </h3>
                          <p className="text-sm text-gray-400">
                            Perfect for personal use. Get access to basic
                            features with simple registration process.
                          </p>
                        </div>
                      </Label>
                      <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center peer-data-[state=checked]:border-white peer-data-[state=checked]:bg-white">
                        <svg
                          className="w-3 h-3 text-black opacity-0 peer-data-[state=checked]:opacity-100 transition"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* <div className="relative items-start space-x-4 p-4 border border-gray-700 rounded-lg cursor-pointer peer-checked:border-white peer-checked:bg-gray-900/50 hover:border-gray-600 transition-colors">
                      <RadioGroupItem
                        disabled
                        value="BUSINESS_USER"
                        id="BUSINESS_USER"
                        className="peer hidden"
                        checked={field.value === "BUSINESS_USER"}
                      />
                      <Label htmlFor="BUSINESS_USER" className="flex ">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">
                            Business
                          </h3>
                          <p className="text-sm text-gray-400">
                            Ideal for businesses. Includes advanced features and
                            requires additional business information.
                          </p>
                        </div>
                        <div className="w-4 h-4 border border-gray-400 rounded-sm peer-checked:border-white peer-checked:bg-white flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-black opacity-0 peer-checked:opacity-100  transition"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </Label>
                    </div> */}
                    {/* <div
                      className="relative items-start space-x-4 p-4 border border-gray-700 rounded-lg 
    opacity-40 cursor-not-allowed pointer-events-none">
                      <RadioGroupItem
                        value="BUSINESS_USER"
                        id="BUSINESS_USER"
                        className="peer hidden"
                        disabled
                      />
                      <Label htmlFor="BUSINESS_USER" className="flex">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">
                            Business
                          </h3>
                          <p className="text-sm text-gray-400">
                            Currently unavailable — coming soon.
                          </p>
                        </div>
                      </Label>
                    </div> */}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!form.watch("userType")}
            className={`w-full py-3 rounded-lg ${
              form.watch("userType")
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-gray-600 text-white opacity-50 cursor-not-allowed"
            }`}>
            Continue
          </Button>
        </form>
      </Form>
    </div>
  );
}
