"use client";

import BusinessSignUpForm from "@/components/forms/sign-up/businessSignUpForm";
import IndividualSignUpForm from "@/components/forms/sign-up/individualSignUpForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { userType } from "@/lib/types/auth";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SignUpMobile({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [step, setStep] = useState(15);
  const [business, setBusiness] = useState(false);
  const [individual, setIndividual] = useState(true);
  const [userType, setUserType] = useState<userType>("USER");
  const [stepNumber, setStepNumber] = useState(1);
  const singleProduct = useSearchParams();

  const safe = useMemo(() => {
    // NOTE: this component is client, so we can't await props directly.
    // We’ll read from location.search here, and still work when server-passed.
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw =
        sp.get("callbackUrl") ?? sp.get("redirect") ?? sp.get("redirect_uri");
      return getSafeRedirect(raw) || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (safe) sessionStorage.setItem("redirect_hint", safe);
  }, [safe]);

  const getRedirect = () => {
    const fromStorage = sessionStorage.getItem("redirect_hint");
    return getSafeRedirect(fromStorage) || "/";
  };
  // useEffect(() => {
  //   function maybeForceReauth() {
  //     if (singleProduct.get("prompt") === "login") {
  //       // Clear JWT token
  //       localStorage.removeItem("isce_auth_token");

  //       // Clear redirect hints used for SSO
  //       sessionStorage.removeItem("redirect_hint");

  //       // Optionally clear custom cookies you may have set
  //       document.cookie = "accessToken=; Max-Age=0; path=/;";
  //     }
  //   }

  //   maybeForceReauth();
  // }, [singleProduct]);

  const handleBusiness = () => {
    setBusiness(true);
    setIndividual(false);
    setUserType("BUSINESS_USER");
  };

  const handleIndividual = () => {
    setBusiness(false);
    setIndividual(true);
    setUserType("USER");
  };

  const handleNextStep = () => {
    setStep(step + 15);
    setStepNumber(stepNumber + 1);
  };

  return (
    <div className=" relative h-[100svh]">
      <p className=" pt-[50px] text-[14px]">
        Step {stepNumber.toString()} of 7
      </p>
      <div className=" mt-[10px]">
        <Progress value={step} className=" h-[3px]" />
      </div>

      <div
        className={`${step > 15 ? "hidden" : "inline"}  w-full flex flex-row`}>
        <div className="  absolute bottom-0 mb-[30px] w-full">
          {/* <p className=" text-center">{userType}</p> */}
          <Button
            onClick={handleNextStep}
            type="button"
            className="w-full rounded-[12px] font-semibold py-[24px] ">
            Continue
          </Button>
        </div>
        <div
          className={` ${
            step === 15 ? " inline translate-x-0" : " hidden -translate-x-full "
          } w-full flex justify-between transition-all flex-col`}>
          <div className=" mt-[20px] flex gap-5 flex-col">
            <p className="font-extrabold text-[24px]">Select an account type</p>
            <div className=" flex flex-col gap-5">
              <Card
                className={` ${
                  individual ? " border-[0.5]" : " border-0"
                } py-[10px] px-[15px] flex flex-row rounded-[12px]`}>
                <CardContent className=" ">
                  <p className=" font-bold text-white text-[20px]">
                    Individual
                  </p>
                  <p className=" text-[14px] text-white">
                    {`Create a personal account to manage your activities and
                    access exclusive features tailored just for you.`}
                  </p>
                </CardContent>
                <div className="">
                  <Checkbox
                    checked={individual}
                    onClick={() => handleIndividual()}
                  />
                </div>
              </Card>
              <Card
                className="py-[10px] px-[15px] flex flex-row rounded-[12px] 
  opacity-40 cursor-not-allowed pointer-events-none border-0">
                <CardContent className="">
                  <p className="font-bold text-white text-[20px]">Business</p>
                  <p className="text-[14px] text-white">
                    {`Currently unavailable — coming soon.`}
                  </p>
                </CardContent>

                <div className="">
                  <Checkbox checked={false} disabled />
                </div>
              </Card>

              {/* <Card
                className={` ${
                  business ? " border-[0.5]" : " border-0"
                } py-[10px] px-[15px] flex flex-row rounded-[12px]`}>
                <CardContent className=" ">
                  <p className=" font-bold text-white text-[20px]">Business</p>
                  <p className=" text-[14px] text-white">
                    {`Create a business account to manage your company's
                    activities and access exclusive features tailored for
                    businesses.`}
                  </p>
                </CardContent>
                <div className="">
                  <Checkbox
                    checked={business}
                    onClick={() => handleBusiness()}
                  />
                </div>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
      <div className=" mt-[20px]">
        {userType === "USER" ? (
          <IndividualSignUpForm
            stepNumber={stepNumber}
            setStepNumber={setStepNumber}
            step={step}
            setStep={setStep}
            getRedirect={getRedirect}
          />
        ) : userType === "BUSINESS_USER" ? (
          <BusinessSignUpForm />
        ) : (
          <IndividualSignUpForm
            stepNumber={stepNumber}
            setStepNumber={setStepNumber}
            step={step}
            setStep={setStep}
            getRedirect={getRedirect}
          />
        )}
      </div>
    </div>
  );
}
