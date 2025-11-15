import { TabletSmartphone } from "lucide-react";

export default function DesktopView() {
  return (
    <div className=" h-[100svh] w-full mx-auto flex items-center justify-center">
      <div className=" flex gap-2 items-center flex-col">
        <TabletSmartphone className=" w-[100px] h-[100px]" />
        <p>Best viewed on your mobile phone.</p>
      </div>
    </div>
  );
}
