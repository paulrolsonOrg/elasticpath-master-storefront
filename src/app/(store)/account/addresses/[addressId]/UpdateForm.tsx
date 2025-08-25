"use client";

import React from "react";
import { updateAddress } from "../actions";
import { FormStatusButton } from "../../../../../components/button/FormStatusButton";
import { UnifiedAddressForm } from "../../../../../components/forms";
import { AccountAddress } from "@elasticpath/js-sdk";
import {
  accountAddressesQueryKeys,
  useAuthedAccountMember,
} from "../../../../../react-shopper-hooks";
import { useQueryClient } from "@tanstack/react-query";

export function UpdateForm({
  addressId,
  addressData,
}: {
  addressId: string;
  addressData: AccountAddress;
}) {
  const queryClient = useQueryClient();
  const { selectedAccountToken } = useAuthedAccountMember();

  // Convert AccountAddress to the format expected by UnifiedAddressForm
  const defaultValues = {
    address_name: addressData.name,
    first_name: addressData.first_name,
    last_name: addressData.last_name,
    company_name: addressData.company_name,
    line_1: addressData.line_1,
    line_2: addressData.line_2,
    city: addressData.city,
    county: addressData.county,
    region: addressData.region,
    postcode: addressData.postcode,
    country: addressData.country,
    phone_number: addressData.phone_number,
    instructions: addressData.instructions,
  };

  return (
    <form
      action={async (formData) => {
        await updateAddress(formData);
        await queryClient.invalidateQueries({
          queryKey: [
            ...accountAddressesQueryKeys.list({
              accountId: selectedAccountToken?.account_id,
            }),
          ],
        });
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" value={addressId} name="addressId" readOnly />
      <UnifiedAddressForm
        mode="server-action"
        title="Update Address"
        fields={{
          addressName: true,
          company: false,
          line2: true,
          county: true,
          phone: true,
          instructions: true,
        }}
        fieldMapping={{
          address_name: 'name'
        }}
        layout="account"
        autoComplete="shipping"
        useStaticCountries={true}
        defaultValues={defaultValues}
        required={['address_name', 'first_name', 'last_name', 'line_1', 'postcode', 'country']}
        enableGooglePlaces={true}
      />
      <div className="flex">
        <FormStatusButton variant="secondary" type="submit">
          Save changes
        </FormStatusButton>
      </div>
    </form>
  );
}
