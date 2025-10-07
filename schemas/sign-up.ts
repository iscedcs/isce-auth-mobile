import { z } from "zod";

export const MOI = ["NIN", "CVC"] as const;

export const signUpForIndividualSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name should be more than 2 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name should be more than 2 characters" }),
  phoneNumber: z
    .string({
      message: "Please enter phone number.",
    })
    .regex(/^0[789][01]\d{8}$/, "This is not a valid phone number"),
  email: z.email({ message: "Email address is not valid" }),
  // otp: z.string().max(7, { message: "OTP Code should be 6 characters" }),
  address: z
    .string()
    .min(2, { message: "Address should be more than 2 characters" }),
  dob: z.date({
    error: "A date of birth is required.",
  }),
  moi: z.enum(MOI, {
    message: "Please select a valid means of identification",
  }),
  idNumber: z.string().max(12, { message: "IDs should have 12 characters" }),
  profilePhoto: z.string().optional(),
  passwordObj: z
    .object({
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      // .regex(/[\W_]/, "Password must contain at least one special character"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const otpSchema = z.object({
  otp: z.string().max(7, { message: "OTP Code should be 6 characters" }),
});

export const signUpForBusinessSchema = z.object({
  businessName: z
    .string()
    .min(2, { message: "First name should be more than 2 characters" })
    .optional(),
  businessEmail: z.email({ message: "Email address is not valid" }).optional(),
});

export const extendedSignUpSchema = signUpForIndividualSchema.merge(
  signUpForBusinessSchema
);
