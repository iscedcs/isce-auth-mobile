import z from "zod";

export const signInFormSchema = z.object({
  email: z.string().email({
    message: "Email address is not valid.",
  }),
  password: z.string().min(2, { message: "Please enter a valid password" }),
});
