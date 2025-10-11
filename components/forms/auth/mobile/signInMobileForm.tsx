"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { signInFormSchema } from "@/schemas/mobile/sign-in";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegEye } from "react-icons/fa";
import { GoArrowLeft } from "react-icons/go";
import { LuEyeClosed } from "react-icons/lu";
import { MdEmail, MdOutlinePassword } from "react-icons/md";
import { TbLoader2 } from "react-icons/tb";
import { toast } from "sonner";
import z from "zod";

export type signInValues = z.infer<typeof signInFormSchema>;

export default function MobileSignInForm({
  callbackUrl,
}: {
  callbackUrl: string | null;
}) {
  const [password, setPassword] = useState(true);
  const [loading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<signInValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "all",
  });

  const router = useRouter();

  const emailWatch = form.watch("email");

  useEffect(() => {
    const safe = getSafeRedirect(callbackUrl);
    if (safe) sessionStorage.setItem("redirect_hint", safe);
  }, [callbackUrl]);

  function getRedirect() {
    const fromStorage = sessionStorage.getItem("redirect_hint");
    return getSafeRedirect(fromStorage) || "/";
  }

  useEffect(() => {
    if (emailWatch === "") {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [emailWatch]);

  // const handleRedirectToForgotPassword = () => {
  //   router.push("/forgot-password");
  // };

  // const handleRedirectCreateAccount = () => {
  //   router.push("/sign-up");
  // };

  const sp = useSearchParams();

  useEffect(() => {
    async function maybeForceReauth() {
      if (sp.get("prompt") === "login") {
        const session = await getSession();
        if (session) {
          await signOut({ redirect: false });
        }
      }
    }
    maybeForceReauth();
  }, [sp]);

  const handleDisplayPassword = () => {
    setPassword((password) => !password);
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleSubmit = async (data: signInValues) => {
    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        toast.error("Invalid email or password");
        setIsLoading(false);
        return;
      }

      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const safe = getSafeRedirect(callbackUrl) || getRedirect();

      if (token && safe) {
        try {
          const target = new URL(safe);
          const callback = new URL("/auth/callback", target.origin);
          callback.searchParams.set("token", token);

          const finalPath = target.pathname + target.search + target.hash;
          callback.searchParams.set("redirect", finalPath);

          toast.success("Welcome back!");
          window.location.href = callback.toString();
          return;
        } catch (e) {
          // If safe was relative ("/wallet"), make it absolute to your default product origin if you prefer:
          // const origin = process.env.NEXT_PUBLIC_PRODUCT_A_ORIGIN!;
          // const target = new URL(safe, origin);
          // ... (same as above)
        }
      }

      toast.success("Signed In Successfully!");

      router.push("/dashboard");
    } catch (e) {
      console.error("Sign in error", e);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* <div className=" left-0 absolute top-0 w-screen">
          <AuthHeader
            message="Don't have an account?"
            loading={false}
            onClick={handleRedirectCreateAccount}
            linkText="Create account"
          />
        </div> */}
        {/* <div className=" left-0 absolute top-0 w-screen ">
          {step === 2 ? (
            <AuthHeader
              message="Forgot password?"
              loading={false}
              onClick={handleRedirectToForgotPassword}
              linkText="Click here to retrieve account"
            />
          ) : null}
        </div> */}
        <div className=" h-screen relative pt-[30px] ">
          <div className=" mt-[10px] flex gap-3 items-center">
            <GoArrowLeft className=" w-[32px] h-[32px]" />
            {/* <p className=" text-[24px]  font-bold">Sign in to your account</p> */}
          </div>

          <div className=" mt-[40px]">
            <div
              className={` ${
                step === 1
                  ? " inline translate-x-0 "
                  : " hidden -translate-x-full  "
              }  transition-all w-full `}>
              <MdEmail className=" w-[32px]  h-[32px]" />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label className=" mt-[10px] font-extrabold text-[24px]">
                      What’s your email?
                    </Label>
                    <FormControl>
                      <Input
                        {...field}
                        // placeholder="What’s your email?"
                        className=" mt-[15px] py-[20px] text-[20px] outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 "
                      />
                    </FormControl>
                    <FormMessage className=" text-accent" />
                  </FormItem>
                )}
              />
            </div>
            <div
              className={` ${
                step === 2
                  ? " inline translate-x-0 "
                  : " hidden -translate-x-full  "
              } hidden transition-all w-full mt-[20px] relative`}>
              <MdOutlinePassword className=" w-[32px] h-[32px]" />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label className=" mt-[10px] font-extrabold text-[24px]">
                      Enter your password
                    </Label>
                    <FormControl>
                      <div className=" relative">
                        <Input
                          {...field}
                          // placeholder="What’s your email?"
                          type={`${password ? "password" : "text"}`}
                          className=" mt-[10px] pr-[50px]  py-[20px] text-[20px] outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 "
                        />
                        {!password ? (
                          <FaRegEye
                            onClick={handleDisplayPassword}
                            className=" absolute right-0 -translate-y-1 top-1/2  w-[24px] h-[24px]"
                          />
                        ) : (
                          <LuEyeClosed
                            onClick={handleDisplayPassword}
                            className=" absolute right-0 -translate-y-1 top-1/2  w-[24px] h-[24px]"
                          />
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="  absolute bottom-0 mb-[30px] w-full">
            {step === 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="  w-full rounded-[12px] font-semibold py-[24px] ">
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="  w-full rounded-[12px] font-semibold py-[24px] ">
                {loading ? (
                  <TbLoader2 className=" w-[22px] h-[22px] animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
