import { z } from "zod";

/**
 * Validating optional text input field https://github.com/colinhacks/zod/issues/310
 */
const emptyStringToUndefined = z.literal("").transform(() => undefined);

const guestInformationSchema = z.object({
  email: z.string({ required_error: "Required" }).email("Invalid email"),
});

const accountMemberInformationSchema = z.object({
  email: z.string({ required_error: "Required" }).email("Invalid email"),
  name: z.string({ required_error: "Required" }),
});

const billingAddressSchema = z.object({
  address_name: z.string().optional().or(emptyStringToUndefined),
  first_name: z.string().optional().or(emptyStringToUndefined),
  last_name: z.string().optional().or(emptyStringToUndefined),
  company_name: z.string().optional().or(emptyStringToUndefined),
  line_1: z.string().optional().or(emptyStringToUndefined),
  line_2: z.string().optional().or(emptyStringToUndefined),
  city: z.string().optional().or(emptyStringToUndefined),
  county: z.string().optional().or(emptyStringToUndefined),
  region: z.string().optional().or(emptyStringToUndefined),
  postcode: z.string().optional().or(emptyStringToUndefined),
  country: z.string().optional().or(emptyStringToUndefined),
  phone_number: z.string().optional().or(emptyStringToUndefined),
});

export const shippingAddressSchema = z.object({
  address_name: z.string().optional().or(emptyStringToUndefined),
  first_name: z.string({ required_error: "First name is required" }),
  last_name: z.string({ required_error: "Last name is required" }),
  company_name: z.string().optional().or(emptyStringToUndefined),
  line_1: z.string({ required_error: "Address is required" }),
  line_2: z.string().optional().or(emptyStringToUndefined),
  city: z.string({ required_error: "City is required" }),
  county: z.string().optional().or(emptyStringToUndefined),
  region: z.string({ required_error: "Region is required" }),
  postcode: z.string({ required_error: "Postcode is required" }),
  country: z.string({ required_error: "Country is required" }),
  phone_number: z.string().optional().or(emptyStringToUndefined),
  instructions: z.string().optional().or(emptyStringToUndefined),
});

export const anonymousCheckoutFormSchema = z.object({
  guest: guestInformationSchema,
  shippingAddress: shippingAddressSchema,
  sameAsShipping: z.boolean().default(true),
  billingAddress: billingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  cardId: z.string().optional(),
  quoteId: z.string().optional(),
});

export type AnonymousCheckoutForm = z.TypeOf<
  typeof anonymousCheckoutFormSchema
>;

export const accountMemberCheckoutFormSchema = z.object({
  account: accountMemberInformationSchema,
  shippingAddress: shippingAddressSchema,
  sameAsShipping: z.boolean().default(true),
  billingAddress: billingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  cardId: z.string().optional(),
  quoteId: z.string().optional(),
});

export type AccountMemberCheckoutForm = z.TypeOf<
  typeof accountMemberCheckoutFormSchema
>;

export const checkoutFormSchema = z.union([
  anonymousCheckoutFormSchema,
  accountMemberCheckoutFormSchema,
]);

export type CheckoutForm = z.TypeOf<typeof checkoutFormSchema>;
