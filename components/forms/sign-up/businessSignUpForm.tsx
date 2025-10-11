import { extendedSignUpSchema } from "@/schemas/mobile/sign-up";
import z from "zod";

export type businessSignUpValues = z.infer<typeof extendedSignUpSchema>;
export default function BusinessSignUpForm() {
  return (
    <div>
      <p>Business Form</p>
    </div>
  );
}
