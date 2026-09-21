import z from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const userTypeSchema = z.object({
  userType: z.enum(["USER", "BUSINESS_USER"], {
    error: "Please select an user type",
  }),
});

export const baseUserDetailsSchema = z.object({
  firstName: z
    .string({
      error: "This field cannot be empty",
    })
    .min(2, {
      error: "First name must be greater than 2 characters.",
    })
    .max(50, "firstname must be less than 50 characters"),

  lastName: z
    .string({
      error: "This field cannot be empty",
    })
    .min(2, {
      error: "Last name must be greater than 2 characters.",
    })
    .max(50, "lastname must be less than 50 characters"),

  // See schemas/mobile/sign-up.ts — value arrives as E.164 from <PhoneInput/>.
  phoneNumber: z
    .string()
    .refine((value) => isValidPhoneNumber(value), {
      message: "Please enter a valid phone number for the selected country",
    }),

  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  referralCode: z.string().optional(),
  referralUsername: z.string().optional(),
});

const individualUserDetailsSchema = baseUserDetailsSchema.extend({
  userType: z.literal("USER"),
  address: z.string().optional(),
  dob: z.string().optional(),
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

const businessUserDetailsSchema = baseUserDetailsSchema.extend({
  userType: z.literal("BUSINESS_USER"),
  businessName: z.string().optional(),
  businessEmail: z
    .string()
    .email("Enter a valid business email address")
    .refine(
      (email) => {
        if (!email) return true;
        const domain = email.split("@")[1]?.toLowerCase().trim();
        return domain ? !FREE_EMAIL_DOMAINS.includes(domain) : false;
      },
      {
        message:
          "Business email must be a business domain and not a normal email provider (e.g. Gmail, Yahoo)",
      }
    )
    .optional(),
  identificationType: z.string().optional(),
  idNumber: z.string().optional(),
  position: z.string().optional(),
  businessAddress: z.string().optional(),
  displayPicture: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
});

export const businessOnlyDetailsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z
    .string()
    .email("Enter a valid business email address")
    .refine(
      (email) => {
        if (!email) return true;
        const domain = email.split("@")[1]?.toLowerCase().trim();
        return domain ? !FREE_EMAIL_DOMAINS.includes(domain) : false;
      },
      {
        message:
          "Business email must be a business domain and not a normal email provider (e.g. Gmail, Yahoo)",
      }
    ),
  identificationType: z.string().min(1, "Please select an identification type"),
  idNumber: z.string().min(1, "ID number is required"),
  position: z.string().optional(),
  businessAddress: z.string().min(1, "Business address is required"),
  address: z
    .string({
      error: "This field cannot be empty",
    })
    .min(2, {
      error: "Address must be at least 2 characters.",
    })
    .max(100, {
      error: "Address must not be longer than 100 characters.",
    }),
  dob: z
    .string()
    .min(2, { error: "Please enter a valid date of birth" })
    .refine(
      (date) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        const parsedDate = new Date(date);
        return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
      },
      { error: "Please enter a valid date (YYYY-MM-DD)" }
    ),
});

export type BusinessOnlyDetailsFormData = z.infer<typeof businessOnlyDetailsSchema>;

export const companyDetailsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z
    .string()
    .email("Enter a valid business email address")
    .refine(
      (email) => {
        if (!email) return true;
        const domain = email.split("@")[1]?.toLowerCase().trim();
        return domain ? !FREE_EMAIL_DOMAINS.includes(domain) : false;
      },
      {
        message:
          "Business email must be a business domain and not a normal email provider (e.g. Gmail, Yahoo)",
      }
    ),
  businessAddress: z.string().min(1, "Business address is required"),
  position: z.string().optional(),
});
export type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>;

export const identificationDetailsSchema = z.object({
  identificationType: z.string().min(1, "Please select an identification type"),
  idNumber: z.string().min(1, "ID number is required"),
});
export type IdentificationDetailsFormData = z.infer<typeof identificationDetailsSchema>;

export const addressDobSchema = z.object({
  address: z
    .string({
      error: "This field cannot be empty",
    })
    .min(2, {
      error: "Address must be at least 2 characters.",
    })
    .max(100, {
      error: "Address must not be longer than 100 characters.",
    }),
  dob: z
    .string()
    .min(2, { error: "Please enter a valid date of birth" })
    .refine(
      (date) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) return false;
        const parsedDate = new Date(date);
        return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
      },
      { error: "Please enter a valid date (YYYY-MM-DD)" }
    ),
});
export type AddressDobFormData = z.infer<typeof addressDobSchema>;

export const userDetailsSchema = z.discriminatedUnion("userType", [
  individualUserDetailsSchema,
  businessUserDetailsSchema,
]);

export const otpVerificationSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^[a-zA-Z0-9]+$/, "Verification code must contain only numbers"),
});

export const passwordCreationSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordWithCodeSchema = z.intersection(
  resetPasswordSchema,
  z.object({
    resetCode: z
      .string({
        error: "Reset code is required",
      })
      .min(6, "Reset code must be at least 6 characters")
      .max(100, "Reset code is too long")
      .trim(),
  })
);

export type UserTypeFormData = z.infer<typeof userTypeSchema>;
export type UserDetailsFormData = z.infer<typeof userDetailsSchema>;
export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;
export type PasswordCreationFormData = z.infer<typeof passwordCreationSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordWithCodeFormData = z.infer<
  typeof resetPasswordWithCodeSchema
>;
