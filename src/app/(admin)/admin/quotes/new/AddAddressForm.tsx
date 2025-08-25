"use client";

import React from "react";
import { UnifiedAddressForm } from "../../../../../components/forms";

export function AddAddressForm() {
  return (
    <UnifiedAddressForm
      mode="server-action"
      title="Address Information"
      fields={{
        addressName: true,
        company: false,
        line2: true,
        county: true,
        phone: false,
        instructions: false,
      }}
      fieldMapping={{
        address_name: 'name'
      }}
      layout="account"
      autoComplete="shipping"
      useStaticCountries={true}
      required={['address_name', 'first_name', 'last_name', 'line_1', 'postcode', 'country']}
      enableGooglePlaces={true}
    />
  );
}
