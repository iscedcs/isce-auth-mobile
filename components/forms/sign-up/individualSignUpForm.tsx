import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PASSWORDCHECK } from "@/lib/const";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { userType } from "@/lib/types/auth";
import { cn, startFiveMinuteCountdown } from "@/lib/utils";
import { otpSchema, signUpForIndividualSchema } from "@/schemas/mobile/sign-up";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns/format";
import { CalendarIcon } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BiRename } from "react-icons/bi";
import { FaPhoneAlt, FaRegEye } from "react-icons/fa";
import { GoArrowLeft } from "react-icons/go";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { LuEyeClosed } from "react-icons/lu";
import { MdEmail, MdLocationOn, MdOutlinePassword } from "react-icons/md";
import { toast } from "sonner";
import z from "zod";

export type signUpValues = z.infer<typeof signUpForIndividualSchema>;
export type otpValue = z.infer<typeof otpSchema>;

export default function IndividualSignUpForm({
  step,
  stepNumber,
  setStep,
  setStepNumber,
  getRedirect,
}: {
  stepNumber: number;
  setStepNumber: React.Dispatch<React.SetStateAction<number>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  getRedirect: () => string;
}) {
  const userType: userType = "USER";
  const [isOtpScreen, setIsOtpScreen] = useState(false);
  const [isConfirmPasswordScreen, setIsConfirmPasswordScreen] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [time, setTime] = useState("00:00");
  const [resendOTP, setResendOTP] = useState(false);
  const [password, setPassword] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isBuildingProfile, setIsBuidlingProfile] = useState(false);

  //   const [errorCheck, setErrorCheck] = useState(false);
  // console.log({ step });

  const form = useForm<signUpValues>({
    resolver: zodResolver(signUpForIndividualSchema),
    defaultValues: {
      dob: new Date(),
      email: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      address: "",
      passwordObj: {
        password: "",
        confirmPassword: "",
      },
    },
    mode: "all",
  });

  const otpForm = useForm<otpValue>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
    mode: "all",
  });

  const email = form.watch("email");
  const otpWatch = otpForm.watch("otp");
  const code = otpForm.getValues("otp");
  const passwordValues = form.watch("passwordObj.password");
  const confirmPasswordValues = form.watch("passwordObj.confirmPassword");

  const hasEightCharacters = form.getValues("passwordObj.password").length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValues);
  const hasLowercase = /[a-z]/.test(passwordValues);
  const hasNumber = /[0-9]/.test(passwordValues);

  const router = useRouter();

  //   console.log({ hasEightCharacters });
  // console.log({ loading });

  const handleNextStep = async () => {
    if (step < 45 || step > 45) {
      // setIsLoading(false);
      setStep(step + 15);
      setStepNumber(stepNumber + 1);
    }

    if (step === 15 * 3 && !isOtpScreen) {
      // const email = form.getValues("email");
      try {
        setIsLoading(true);
        const res = await fetch("/api/request-verification-code", {
          body: JSON.stringify({ email }),
          method: "POST",
        });
        const data = await res.json();
        console.log({ data });
        if (res.ok) {
          toast.success("Verification Code Sent", {
            description: "Check your email for the code.",
          });
          setIsOtpScreen(true);
          setIsLoading(false);
          setStepNumber(3);
          setStep(15 * 3);
          return data;
        }
        if (res.status === 500) {
          toast.error("Something went wrong", {
            description: "This email is already being used.",
          });
        } else {
          toast.error("Something went wrong", {
            description: "There was a problem getting the verification code.",
          });
        }

        setIsLoading(false);
        setStepNumber(3);
        setStep(15 * 3);
        return null;
      } catch (e: any) {
        setIsLoading(false);
        console.log("Error sending OTP", e);
      }
    }
  };

  const handleShowConfirmPasswordScreen = () => {
    setIsConfirmPasswordScreen(true);
    if (confirmPasswordValues) {
      setIsConfirmPasswordScreen(false);
      setStep(step + 15);
      setStepNumber(stepNumber + 1);
    }

    // if (isConfirmPasswordScreen === true) {
    //   setIsConfirmPasswordScreen(false);
    //   setStep(step + 15);
    //   setStepNumber(stepNumber + 1);
    // }
  };

  const handlePreviousStep = () => {
    // setStep(step - 15);
    setStepNumber(stepNumber - 1);
    setIsOtpScreen(false);
  };

  useEffect(() => {
    if (!isOtpScreen) {
      setTime("0:00");
      return;
    }

    const stop = startFiveMinuteCountdown(
      (min, sec) => {
        setTime(
          `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
        );
      },
      () => {
        toast.error("The verifiction code has expired", {
          description:
            "Enter your email address again for a new verification code.",
        });
        setIsOtpScreen(false);
        console.log("Countdown finished!");
      }
    );

    return stop;
  }, [isOtpScreen, resendOTP]);

  useEffect(() => {
    const checkPassword = () => {
      if (hasLowercase) {
        PASSWORDCHECK[0].state = true;
      } else {
        PASSWORDCHECK[0].state = false;
      }

      if (hasEightCharacters) {
        PASSWORDCHECK[1].state = true;
      } else {
        PASSWORDCHECK[1].state = false;
      }

      if (hasUppercase) {
        PASSWORDCHECK[2].state = true;
      } else {
        PASSWORDCHECK[2].state = false;
      }

      if (hasNumber) {
        PASSWORDCHECK[3].state = true;
      } else {
        PASSWORDCHECK[3].state = false;
      }

      if (
        (!hasEightCharacters || !hasLowercase || !hasNumber || !hasUppercase) &&
        isConfirmPasswordScreen === true
      ) {
        setIsLoading(true);
      } else {
        setIsLoading(false);
      }
    };
    checkPassword();
  }, [hasEightCharacters, hasLowercase, hasUppercase, hasNumber]);
  //   console.log(PASSWORDCHECK[1].state);

  const handleResendOTP = async () => {
    try {
      setResendOTP(true);
      setIsLoading(true);
      const res = await fetch("/api/request-verification-code", {
        body: JSON.stringify({ email }),
        method: "POST",
      });
      const data = res.json();
      if (res.ok) {
        toast.success("Verification Code Resent", {
          description: "Check your email for the code.",
        });
        setIsLoading(false);
        setResendOTP(false);
        return data;
      }
      toast.error("Something went wrong", {
        description: "There was a problem getting the verification code.",
      });
      setIsLoading(false);
      setIsLoading(false);

      return null;
    } catch (e: any) {
      setIsLoading(false);
      setIsLoading(false);

      console.log("Error resending OTP Code", e);
    }
  };

  useEffect(() => {
    const verifyOTP = async () => {
      if (otpWatch.length === 6) {
        const isValid = await otpForm.trigger("otp");
        if (!isValid) return;
        try {
          setIsLoading(true);
          const res = await fetch("/api/verify-code", {
            body: JSON.stringify({ email, code }),
            method: "POST",
          });
          console.log({ email, code });
          const data = await res.json();
          if (res.ok) {
            setIsLoading(false);
            setIsOtpScreen(false);

            toast.success("Email verified successfully", {
              description: "Your email has been verified successfully",
            });
            setStep(step + 15);
            setStepNumber(stepNumber + 1);
            return data;
          }
          setTime("0");
          setIsLoading(false);
          setStepNumber(3);
          setStep(15 * 3);
          if (res.status === 400) {
            toast.error("Something went wrong", {
              description: "OTP Code is not valid, please try again",
            });
          } else {
            toast.error("Something went wrong", {
              description:
                "There was a problem verifying your email address please try again",
            });
          }
        } catch (e) {
          setIsLoading(false);
          console.log("Problem verifying email address", e);
        }
      }
    };
    verifyOTP();
  }, [otpWatch]);

  const handleDisplayPassword = () => {
    setPassword(!password);
  };

  // const handleImageUpload = async (file: File) => {
  //   setIsUploadingImage(true);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const response = await fetch("/api/upload", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     const result = await response.json();
  //     if (result.success) {
  //       form.setValue("profilePhoto", result.url);
  //       toast.success("Profile image uploaded successfully");
  //     } else {
  //       toast.error(result.error || "Failed to upload profile image");
  //     }
  //   } catch (error) {
  //     toast.error("An error occurred while uploading the profile image");
  //     console.error(error);
  //   } finally {
  //     setIsUploadingImage(false);
  //   }
  // };

  // const handleDeleteImage = () => {
  //   form.setValue("profilePhoto", "");
  // };

  const handleSubmit = async (data: signUpValues) => {
    setIsBuidlingProfile(true);
    setIsLoading(true);

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phoneNumber,
      email: data.email,
      dob: data.dob,
      address: data.address,
      password: data.passwordObj.password,
      confirmpassword: data.passwordObj.confirmPassword,
      isce_permissions: {
        connect: true,
        connect_plus: true,
        store: true,
        wallet: true,
        event: true,
        access: true,
      },
      business_permissions: {
        invoicing: true,
        appointment: true,
        chat: true,
        analytics: true,
        services: true,
      },
    };
    try {
      const res = await fetch(
        `/api/sign-up?userType=${encodeURIComponent(userType)}`,
        {
          body: JSON.stringify(payload),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setIsLoading(false);
        const signInResult = await signIn("credentials", {
          email: data.email,
          password: data.passwordObj.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          const session = await getSession();
          const token = (session as any)?.user?.accessToken;

          // pull safe redirect (from sessionStorage)
          const safe = getSafeRedirect(getRedirect());
          if (safe && token) {
            const target = new URL(safe);
            const callback = new URL("/auth/callback", target.origin);
            callback.searchParams.set("token", token);

            const finalPath = target.pathname + target.search + target.hash;
            callback.searchParams.set("redirect", finalPath);

            window.location.href = callback.toString();
            return;
          }

          // no redirect requested -> go home (or dashboard)
          window.location.href = "/";
          return;
        }

        const r = getRedirect();
        toast.success("Account created! Please sign in.");
        window.location.href = `/sign-in?redirect=${encodeURIComponent(r)}`;
        return data;
      }
      setIsBuidlingProfile(false);
      setStep(15);
      toast.error("Something is wrong", {
        description:
          "There was a problem creating your account please try again",
      });
      return null;
    } catch (e) {
      console.log("Problem creating account", e);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div
          className={` ${
            step === 15 * 2
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <BiRename className=" w-[32px] h-[32px]" />
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <Label className=" mt-[10px] font-extrabold text-[24px]">
                  Enter your first name*
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    // placeholder=" Enter your first name"
                    className=" mt-[15px] py-[20px] text-[20px] outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 "
                  />
                </FormControl>
                <FormMessage className=" text-accent" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className=" mt-[20px]">
                <Label className=" mt-[10px] font-extrabold text-[24px]">
                  Enter your last name*
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    // placeholder=" Enter your last name"
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
            step === 15 * 3 && isOtpScreen === false
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <MdEmail className=" w-[32px] h-[32px]" />
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
          className={`${
            isOtpScreen == true
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <GoArrowLeft
            onClick={handlePreviousStep}
            className=" w-[32px] h-[32px]"
          />
          <Form {...otpForm}>
            {/* <form> */}
            <FormField
              name="otp"
              control={otpForm.control}
              render={({ field }) => (
                <FormItem>
                  <Label className=" mt-[10px] font-extrabold text-[24px]">
                    Enter OTP code*
                  </Label>
                  <FormControl>
                    <div className=" relative">
                      <Input
                        {...field}
                        maxLength={6}
                        // onChange={handleVerifyOTP}
                        // placeholder="Enter OTP code"
                        className=" mt-[15px] py-[20px] text-[20px] outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 "
                      />
                      <p className=" right-0 top-1/2 text-[12px] -translate-y-1/2 absolute">
                        {time}
                      </p>
                    </div>
                  </FormControl>
                  <FormDescription className=" text-[12px]">
                    You only have to enter an OTP code we sent to your email
                    address - {email}
                  </FormDescription>
                </FormItem>
              )}
            />
            {/* </form> */}
          </Form>
        </div>
        <div
          className={` ${
            step === 15 * 4
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <FaPhoneAlt className=" w-[32px] h-[32px]" />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <Label className=" w-[70%] mt-[10px] font-extrabold text-[24px]">
                  What’s your phone number?
                </Label>
                <FormControl>
                  <div className=" mt-[15px] items-center flex gap-5">
                    <Select>
                      <SelectTrigger className=" text-[24px] font-extrabold text-white border-t-0 border-l-0 rounded-none border-r-0">
                        <SelectValue placeholder="+234" />
                      </SelectTrigger>
                      <SelectContent className=" border-0 focus:bg-secondary rounded-[20px] text-white bg-secondary">
                        <SelectItem value="+234">+234</SelectItem>
                        <SelectItem value="+224">+224</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      {...field}
                      // placeholder=" Enter ssyour first name"
                      className="  text-[20px] outline-0 rounded-none border-l-0 placeholder:text-[24px] placeholder:font-extrabold border-r-0 border-t-0 "
                    />
                  </div>
                </FormControl>
                <FormMessage className=" text-accent" />
              </FormItem>
            )}
          />
        </div>
        <div
          className={` ${
            step === 15 * 5 && isConfirmPasswordScreen === false
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <MdOutlinePassword className=" w-[32px] h-[32px]" />
          <FormField
            control={form.control}
            name="passwordObj.password"
            render={({ field }) => (
              <FormItem>
                <Label className=" mt-[10px] font-extrabold text-[24px]">
                  Setup your password
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
                <div className=" text-[12px] mt-[10px]">
                  {PASSWORDCHECK.map((check) => (
                    <div
                      key={check.key}
                      className={`flex gap-2 items-center ${
                        check.state === true ? " text-white " : " text-accent"
                      } `}>
                      {check.state === true ? <IoMdCheckmark /> : <IoMdClose />}
                      <div>{check.message}</div>
                    </div>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>
        <div
          className={`${
            isConfirmPasswordScreen === true
              ? " inline translate-x-0 "
              : " hidden -translate-x-full  "
          } hidden transition-all w-full mt-[20px]`}>
          <GoArrowLeft
            onClick={() => {
              setIsConfirmPasswordScreen(false);
            }}
            className=" w-[32px] h-[32px]"
          />
          <FormField
            name="passwordObj.confirmPassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <Label className=" mt-[10px] font-extrabold text-[24px]">
                  Confirm your password
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
                <FormMessage className=" text-accent" />
              </FormItem>
            )}
          />
        </div>
        <div
          className={` ${
            step === 15 * 6
              ? " inline translate-x-0 "
              : " hidden  -translate-x-full "
          } hidden transition-all w-full mt-[20px]`}>
          <div className="">
            <p className=" text-[24px] font-extrabold">
              Personalize your profile with your address
            </p>
            <ScrollArea className=" h-[400px]">
              <div className=" mt-[10px]">
                <FormField
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className=" relative">
                          <MdLocationOn className=" absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px]" />
                          <Input
                            {...field}
                            className="border-r-0 border-t-0 border-l-0 pl-[40px] py-[25px] rounded-none placeholder:text-[18px]"
                            placeholder="Input your address"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className=" text-accent" />
                    </FormItem>
                  )}
                />
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </div>
        <div
          className={` ${
            step === 15 * 7
              ? " inline translate-x-0 "
              : " hidden -translate-x-full "
          } hidden transition-all w-full mt-[20px]`}>
          <div className=" px-[20px] py-[100px]  bg-black w-screen  flex flex-col gap-[19px] fixed left-0 top-0 z-30 h-screen">
            <div className="">
              <p className=" text-[32px] font-bold">When’s your birthday?</p>
              <p className=" w-[70%] text-[18px]">
                Your birthday won’t be shown publicly.
              </p>
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <Popover>
                      <PopoverTrigger className="w-full" asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              " text-[18px] py-[20px] mt-[30px] border-l-0 px-0 border-r-0 border-t-0 w-full rounded-none text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0 bg-secondary mt-[10px] text-white border-none"
                        align="center">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          className="w-full bg-black text-white"
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    {/* <FormDescription>
                    Your date of birth is used to calculate your age.
                  </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={!form.formState.isValid || loading}
              className=" w-full rounded-[12px] font-semibold py-[24px]">
              Finish setup
            </Button>
          </div>
        </div>
        {isBuildingProfile ? (
          <div className="fixed left-0 top-0 z-30 h-screen">
            <div className=" relative">
              <Image
                src={"/assets/loading-screen.gif"}
                alt="building"
                width={"1000"}
                height={"1000"}
                className=" h-screen"
              />
              <div className=" bg-black/60 flex flex-col items-center justify-center top-0 absolute z-40 w-full h-screen ">
                <p className=" text-[32px] w-[60%] text-center font-bold">
                  BUILDING YOUR PROFILE
                </p>
                <p className=" text-[18px]">
                  Sit tight while we work our magic.
                </p>

                <div className=" absolute  text-center mb-[20px] bottom-0">
                  <p className=" text-[18px]">Did you know?</p>
                  <p className=" mx-auto w-[70%] text-[12px]">
                    You can share your contact information with a tap easy and
                    fast contactless lifestyle
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className=""></div>
        )}
        <div className="  absolute bottom-0 mb-[30px] w-full">
          {/* <p className=" text-center">{userType}</p> */}
          {isOtpScreen ? (
            <Button
              onClick={handleResendOTP}
              type="button"
              disabled={loading}
              className="  w-full rounded-[12px] font-semibold py-[24px] ">
              Resend OTP
            </Button>
          ) : step === 15 * 5 ? (
            <Button
              onClick={handleShowConfirmPasswordScreen}
              type="button"
              disabled={loading}
              className="  w-full rounded-[12px] font-semibold py-[24px] ">
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              type="button"
              disabled={loading}
              className="  w-full rounded-[12px] font-semibold py-[24px] ">
              {step === 15 * 6 ? "Next" : "Continue"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
