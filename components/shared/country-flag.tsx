"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function CountryFlag() {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCountry() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setCountryCode(data.country_code.toLowerCase()); // "ng", "gb", etc.
      } catch (err) {
        console.error("Failed to fetch country:", err);
      }
    }
    fetchCountry();
  }, []);

  if (!countryCode) return null;

  return (
    <Image
      src={`https://flagcdn.com/w20/${countryCode}.png`}
      alt="Country Flag"
      width={20}
      height={15}
      className="rounded-full"
    />
  );
}
