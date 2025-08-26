"use client";

import React from "react";
import { UnifiedAddressForm } from "../../../components/forms";

type AddressFormProps = {
  title?: string;
  addressField: "shippingAddress" | "billingAddress";
};

export function AddressForm({
  title = "Address",
  addressField,
}: AddressFormProps) {
  return (
    <UnifiedAddressForm
      mode="react-hook-form"
      fieldPrefix={addressField}
      title={title}
      autoComplete={addressField === "shippingAddress" ? "shipping" : "billing"}
      fields={{
        addressName: false,
        company: true,
        line2: true,
        county: false,
        phone: addressField === "shippingAddress",
        instructions: addressField === "shippingAddress",
      }}
      layout="checkout"
      useStaticCountries={true}
      enableGooglePlaces={true}
    />
  );
}
