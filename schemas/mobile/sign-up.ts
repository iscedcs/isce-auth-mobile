import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const MOI = ["NIN", "CAC", "TIN", "BVN"] as const;

export const signUpForIndividualSchema = z.object({
  firstName: z
    .string({ error: "First name is required" })
    .min(2, { message: "First name must be at least 2 characters" }),

  lastName: z
    .string({ error: "Last name is required" })
    .min(2, { message: "Last name must be at least 2 characters" }),

  // Stored in E.164 by <PhoneInput/>, so validation is country-agnostic:
  // libphonenumber reads the country from the dial code on the value itself.
  phoneNumber: z
    .string({ error: "Phone number is required" })
    .refine((value) => isValidPhoneNumber(value), {
      message: "Enter a valid phone number for the selected country",
    }),

  email: z
    .string({ error: "Email address is required" })
    .email("Enter a valid email address"),

  address: z
    .string({ error: "Address is required" })
    .min(5, { message: "Address must be at least 5 characters" }),

  structuredAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),

  dob: z
    .date({
      error: "Date of birth is required",
    })
    .refine(
      (value) => value instanceof Date && !isNaN(value.getTime()),
      "Enter a valid date",
    )
    .refine(
      (value) => value <= new Date(),
      "Date of birth cannot be in the future",
    ),

  passwordObj: z
    .object({
      password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must include at least one uppercase letter")
        .regex(/[a-z]/, "Password must include at least one lowercase letter")
        .regex(/[0-9]/, "Password must include at least one number"),

      confirmPassword: z.string({
        error: "Please confirm your password",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
  referralCode: z.string().optional(),
});

// export const signUpForIndividualSchema = z.object({
//   firstName: z
//     .string()
//     .min(2, { message: "First name should be more than 2 characters" }),
//   lastName: z
//     .string()
//     .min(2, { message: "Last name should be more than 2 characters" }),
//   phoneNumber: z
//     .string({
//       message: "Please enter phone number.",
//     })
//     .regex(/^(070|080|081|090|091|071)\d{8}$/, "Invalid Nigerian phone number"),
//   email: z.email({ message: "Email address is not valid" }),
//   address: z
//     .string()
//     .min(2, { message: "Address should be more than 2 characters" }),
//   structuredAddress: z
//     .object({
//       street: z.string().optional(),
//       city: z.string().optional(),
//       state: z.string().optional(),
//       zipCode: z.string().optional(),
//       country: z.string().optional(),
//     })
//     .optional(),
//   dob: z
//     .date()
//     .refine((v) => v instanceof Date && !isNaN(v.getTime()), {
//       message: "A date of birth is required.",
//     })
//     .refine((v) => v <= new Date(), {
//       message: "Date must be in the past",
//     }),
//   passwordObj: z
//     .object({
//       password: z
//         .string()
//         .min(8, "Password must be at least 8 characters long")
//         .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
//         .regex(/[a-z]/, "Password must contain at least one lowercase letter")
//         .regex(/[0-9]/, "Password must contain at least one number"),
//       // .regex(/[\W_]/, "Password must contain at least one special character"),
//       confirmPassword: z.string(),
//     })
//     .refine((data) => data.password === data.confirmPassword, {
//       message: "Passwords do not match",
//       path: ["confirmPassword"],
//     }),
// });

export const otpSchema = z.object({
  otp: z.string().max(7, { message: "OTP Code should be 6 characters" }),
});

const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "zoho.com",
  "protonmail.com",
  "proton.me",
  "yandex.com",
  "live.com",
  "msn.com",
  "gmx.com",
];

export const signUpForBusinessSchema = z.object({
  businessName: z
    .string({ error: "Business name is required" })
    .min(2, { message: "Business name must be at least 2 characters" }),
  businessEmail: z
    .string({ error: "Business email is required" })
    .email({ message: "Enter a valid business email address" })
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase().trim();
        return domain ? !FREE_EMAIL_DOMAINS.includes(domain) : false;
      },
      {
        message:
          "Business email must be a business domain and not a normal email provider (e.g. Gmail, Yahoo)",
      }
    ),
  identificationType: z.enum(["NIN", "CAC", "TIN", "BVN"], {
    error: "Please select an identification type",
  }),
  idNumber: z.string().min(1, "ID number is required"),
  position: z.string().optional(),
  businessAddress: z.string().min(1, "Business address is required"),
  referralCode: z.string().optional(),
});

export const extendedSignUpSchema = signUpForIndividualSchema.merge(
  signUpForBusinessSchema,
);
