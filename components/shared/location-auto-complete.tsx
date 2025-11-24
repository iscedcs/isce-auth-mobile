"use client";

import { Input } from "@/components/ui/input";
import { useLoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const libraries: "places"[] = ["places"];

interface GoogleAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface GoogleAddressFieldProps {
  value?: string;
  onChange: (address: string) => void;
  onSelectAddress?: (details: GoogleAddress) => void;
}

export default function GoogleAddressField({
  value = "",
  onChange,
  onSelectAddress,
}: GoogleAddressFieldProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);

  const [service, setService] =
    useState<google.maps.places.AutocompleteService | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && window.google) {
      setService(new google.maps.places.AutocompleteService());
    }
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (!service || newValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    service.getPlacePredictions({ input: newValue }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
    });
  };

  const handleSelect = (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    const placeId = prediction.place_id;
    setInputValue(prediction.description);
    setSuggestions([]);

    const detailsService = new google.maps.places.PlacesService(
      document.createElement("div")
    );
    detailsService.getDetails({ placeId }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const comps = place.address_components || [];

        const get = (type: string) =>
          comps.find((c) => c.types.includes(type))?.long_name || "";

        const structured = {
          street: `${get("street_number")} ${get("route")}`.trim(),
          city: get("locality") || get("sublocality") || "",
          state: get("administrative_area_level_1") || "",
          zipCode: get("postal_code") || "",
          country: get("country") || "",
        };

        onChange(prediction.description);
        onSelectAddress?.(structured);
      }
    });
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Enter your address"
        value={inputValue}
        onChange={handleInputChange}
        className="border-r-0 border-t-0 border-b border-white/20 border-l-0 pl-[40px] py-[25px] rounded-none placeholder:text-[18px]"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-neutral-900 border border-white/10 rounded-lg mt-2 max-h-52 overflow-auto z-50">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="px-3 py-2 hover:bg-white/10 cursor-pointer"
              onClick={() => handleSelect(s)}>
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
