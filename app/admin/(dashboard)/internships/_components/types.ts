export type InternshipPricing = "free" | "paid";
export type InternshipPaymentType = "one_time" | "monthly";

export type Internship = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  skills: string[];
  qualifications: string[];
  duration: string | null;
  mode: "remote" | "onsite" | "hybrid";
  location: string | null;

  // pricing
  pricing: InternshipPricing;
  price: string | null;            // decimal comes as string from PG
  discountPrice: string | null;
  currency: string;
  paymentType: InternshipPaymentType;
  pricingNote: string | null;

  registrationOpen: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InternshipInput = {
  name: string;
  description?: string | null;
  image?: string | null;
  skills: string[];
  qualifications: string[];
  duration?: string | null;
  mode: "remote" | "onsite" | "hybrid";
  location?: string | null;

  // pricing
  pricing: InternshipPricing;
  price?: string | null;
  discountPrice?: string | null;
  currency: string;
  paymentType: InternshipPaymentType;
  pricingNote?: string | null;

  registrationOpen: boolean;
  isActive: boolean;
};

export const EMPTY_FORM: InternshipInput = {
  name: "",
  description: "",
  image: "",
  skills: [],
  qualifications: [],
  duration: "",
  mode: "remote",
  location: "",

  pricing: "free",
  price: "",
  discountPrice: "",
  currency: "INR",
  paymentType: "one_time",
  pricingNote: "",

  registrationOpen: true,
  isActive: true,
};