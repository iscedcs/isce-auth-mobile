import { AuthHeaderType } from "@/lib/types/auth";
import { IoIosInformationCircle } from "react-icons/io";
import { TbLoader2 } from "react-icons/tb";

export default function AuthHeader({
  message,
  linkText,
  loading,
  onClick,
}: AuthHeaderType) {
  return (
    <div className=" bg-secondary w-full fixed z-20  p-2.5 flex items-center justify-between ">
      <div className=" flex gap-2.5 items-center ">
        <div className="">
          <IoIosInformationCircle className=" w-[16px] h-[16px]" />
        </div>
        <span className=" flex gap-1 text-[12px]">
          <p>{message}</p>
          <p onClick={onClick} className=" underline">
            {linkText}
          </p>
        </span>
      </div>
      {loading && (
        <div className="">
          <TbLoader2 className=" w-[22px] h-[22px] animate-spin" />
        </div>
      )}
    </div>
  );
}
