"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form/Form";
import { Input } from "../input/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select/Select";
import { Label } from "../label/Label";
import { useCountries } from "../../hooks/use-countries";
import { countries as staticCountries } from "../../lib/all-countries";
import { GooglePlacesAutocomplete, PlaceResult } from "./GooglePlacesAutocomplete";

export interface AddressData {
  address_name?: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  line_1: string;
  line_2?: string;
  city: string;
  county?: string;
  region: string;
  postcode: string;
  country: string;
  phone_number?: string;
  instructions?: string;
}

export interface UnifiedAddressFormProps {
  // Form integration mode
  mode: 'react-hook-form' | 'server-action';
  
  // Field configuration
  fieldPrefix?: string; // e.g., 'shippingAddress', 'billingAddress'
  
  // Field visibility
  fields?: {
    addressName?: boolean;
    company?: boolean;
    line2?: boolean;
    county?: boolean;
    phone?: boolean;
    instructions?: boolean;
  };
  
  // Field name mapping (for compatibility with different APIs)
  fieldMapping?: Record<string, string>;
  
  // Behavior
  title?: string;
  required?: Array<keyof AddressData>;
  autoComplete?: 'shipping' | 'billing' | 'none';
  
  // Data (for server-action mode)
  defaultValues?: Partial<AddressData>;
  
  // Layout
  layout?: 'checkout' | 'account' | 'compact';
  
  // Countries data source
  useStaticCountries?: boolean;
  
  // Google Places configuration
  enableGooglePlaces?: boolean;
  googlePlacesApiKey?: string;
  googlePlacesCountries?: string[];
}

const defaultFields = {
  addressName: false,
  company: true,
  line2: true,
  county: false,
  phone: true,
  instructions: false,
};

const defaultRequired: Array<keyof AddressData> = [
  'first_name',
  'last_name', 
  'line_1',
  'city',
  'region',
  'postcode',
  'country'
];

// Wrapper component that handles the mode switching properly
export function UnifiedAddressForm(props: UnifiedAddressFormProps) {
  if (props.mode === 'react-hook-form') {
    return <RHFAddressForm {...props} />;
  }
  return <SAAddressForm {...props} />;
}

// Component for React Hook Form mode (can call useFormContext)
function RHFAddressForm(props: UnifiedAddressFormProps) {
  const { control, setValue, trigger } = useFormContext();
  return <AddressFormCore {...props} control={control} setValue={setValue} trigger={trigger} />;
}

// Component for Server Action mode (doesn't call useFormContext)
function SAAddressForm(props: UnifiedAddressFormProps) {
  return <AddressFormCore {...props} control={null} setValue={null} trigger={null} />;
}

// Core component that contains the actual form logic
function AddressFormCore({
  mode = 'react-hook-form',
  fieldPrefix = '',
  fields = defaultFields,
  title = "Address",
  required = defaultRequired,
  autoComplete = 'shipping',
  defaultValues,
  layout = 'checkout',
  useStaticCountries = false,
  fieldMapping = {},
  enableGooglePlaces = false,
  googlePlacesApiKey,
  googlePlacesCountries,
  control,
  setValue,
  trigger,
}: UnifiedAddressFormProps & { control: any; setValue: any; trigger: any }) {
  const finalFields = { ...defaultFields, ...fields };
  const { data: dynamicCountries } = useCountries();
  const countries = useStaticCountries ? staticCountries : dynamicCountries;

  const getFieldName = React.useCallback((fieldName: string) => {
    // Apply field mapping first
    const mappedName = fieldMapping[fieldName as keyof typeof fieldMapping] || fieldName;
    return fieldPrefix ? `${fieldPrefix}.${mappedName}` : mappedName;
  }, [fieldPrefix, fieldMapping]);

  // Handle Google Places selection
  const handlePlaceSelect = React.useCallback((placeResult: PlaceResult) => {
    console.log('🏠 Google Places result received:', placeResult);
    
    if (mode === 'react-hook-form' && setValue) {
      console.log('📋 Updating React Hook Form fields...');
      
      // Update React Hook Form fields using setValue with shouldValidate: false to prevent validation errors
      const updates = [
        { field: 'line_1', value: placeResult.line_1 },
        { field: 'city', value: placeResult.city },
        { field: 'region', value: placeResult.region },
        { field: 'postcode', value: placeResult.postcode },
        { field: 'country', value: placeResult.country },
      ];
      
      updates.forEach(({ field, value }) => {
        const fieldName = getFieldName(field);
        console.log(`  Setting ${fieldName} = "${value}"`);
        setValue(fieldName, value, { 
          shouldValidate: false,
          shouldDirty: true,
          shouldTouch: true 
        });
      });
      
      // Also update DOM elements directly as a fallback (especially for Select components)
      setTimeout(() => {
        console.log('🔄 Applying DOM fallback updates...');
        updates.forEach(({ field, value }) => {
          if (!value) return;
          
          const fieldName = getFieldName(field);
          // Try to find the actual DOM element by various selectors
          const selectors = [
            `input[name="${fieldName}"]`,
            `select[name="${fieldName}"]`,
            `[data-field-name="${fieldName}"]`,
            `[name*="${field}"]`
          ];
          
          let element: HTMLInputElement | HTMLSelectElement | null = null;
          for (const selector of selectors) {
            element = document.querySelector(selector);
            if (element) {
              console.log(`  Found DOM element for ${fieldName} using selector: ${selector}`);
              break;
            }
          }
          
          if (element) {
            if (element.value !== value) {
              element.value = value;
              // Trigger change events
              const events = ['change', 'input', 'blur'];
              events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                element!.dispatchEvent(event);
              });
              console.log(`  DOM updated ${fieldName} = "${value}"`);
            }
          } else {
            console.warn(`  Could not find DOM element for field: ${fieldName}`);
          }
        });
      }, 50);
      
      // Trigger validation for the updated fields to ensure React Hook Form recognizes changes
      if (trigger) {
        setTimeout(() => {
          console.log('🔍 Triggering form validation...');
          const fieldsToValidate = updates.map(({ field }) => getFieldName(field));
          trigger(fieldsToValidate).then((isValid: boolean) => {
            console.log('Form validation result:', isValid);
          }).catch((error: any) => {
            console.error('Form validation error:', error);
          });
        }, 100);
      }
      
      console.log('✅ All fields updated');
    }
    // For server action mode, the GooglePlacesAutocomplete component
    // will update the DOM inputs directly via JavaScript
  }, [mode, setValue, getFieldName, trigger]);

  const getAutoComplete = React.useCallback((field: string) => {
    if (autoComplete === 'none') return undefined;
    const prefix = autoComplete;
    
    const autoCompleteMap: Record<string, string> = {
      first_name: `${prefix} given-name`,
      last_name: `${prefix} family-name`,
      company_name: `${prefix} company`,
      line_1: `${prefix} address-line-1`,
      line_2: `${prefix} address-line-2`,
      city: `${prefix} city`,
      county: `${prefix} county`,
      region: `${prefix} region`,
      postcode: `${prefix} postcode`,
      country: `${prefix} country`,
      phone_number: prefix === 'shipping' ? 'shipping tel' : 'tel',
      instructions: `${prefix} instructions`,
    };
    
    return autoCompleteMap[field];
  }, [autoComplete]);

  const isRequired = React.useCallback((fieldName: keyof AddressData) => {
    return required.includes(fieldName);
  }, [required]);

  // Grid classes based on layout
  const gridClasses = React.useMemo(() => {
    switch (layout) {
      case 'checkout':
        return {
          main: 'grid gap-4',
          twoCol: 'grid grid-cols-[1fr] gap-4 lg:grid-cols-[1fr_1fr]',
          threeCol: 'grid grid-cols-[1fr] gap-4 lg:grid-cols-3',
        };
      case 'account':
        return {
          main: 'grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-6',
          twoCol: 'sm:col-span-3',
          threeCol: 'sm:col-span-2',
        };
      case 'compact':
        return {
          main: 'grid gap-3',
          twoCol: 'grid grid-cols-2 gap-3',
          threeCol: 'grid grid-cols-3 gap-3',
        };
      default:
        return {
          main: 'grid gap-4',
          twoCol: 'grid grid-cols-[1fr] gap-4 lg:grid-cols-[1fr_1fr]',
          threeCol: 'grid grid-cols-[1fr] gap-4 lg:grid-cols-3',
        };
    }
  }, [layout]);

  // React Hook Form Field Renderer
  const renderRHFField = React.useCallback((
    name: string,
    label: string,
    type: string = 'text',
    required: boolean = false,
    className: string = '',
    children?: React.ReactNode
  ) => {
    if (!control) return null;
    
    return (
      <FormField
        key={name}
        control={control}
        name={getFieldName(name)}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {children || (
                <Input
                  {...field}
                  type={type}
                  autoComplete={getAutoComplete(name)}
                  aria-label={label}
                  sizeKind="mediumUntilSm"
                  required={required}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }, [control, getFieldName, getAutoComplete]);

  // Server Action Field Renderer
  const renderSAField = React.useCallback((
    name: string,
    label: string,
    type: string = 'text',
    required: boolean = false,
    className: string = '',
    children?: React.ReactNode
  ) => {
    const actualFieldName = fieldMapping[name] || name;
    const fieldClassName = layout === 'account' ? className : '';
    
    if (layout === 'account') {
      return (
        <p key={name} className={fieldClassName}>
          <Label htmlFor={actualFieldName}>{label}</Label>
          {children || (
            <Input
              id={actualFieldName}
              type={type}
              name={actualFieldName}
              defaultValue={defaultValues?.[name as keyof AddressData] || ''}
              autoComplete={getAutoComplete(name)}
              aria-label={label}
              required={required}
            />
          )}
        </p>
      );
    }
    
    return (
      <div key={name} className={className}>
        <Label htmlFor={actualFieldName}>{label}</Label>
        {children || (
          <Input
            id={actualFieldName}
            type={type}
            name={actualFieldName}
            defaultValue={defaultValues?.[name as keyof AddressData] || ''}
            autoComplete={getAutoComplete(name)}
            aria-label={label}
            required={required}
          />
        )}
      </div>
    );
  }, [layout, fieldMapping, defaultValues, getAutoComplete]);

  const renderField = mode === 'react-hook-form' ? renderRHFField : renderSAField;

  return (
    <fieldset className="flex flex-col gap-5">
      <div>
        <legend className="text-2xl font-medium">{title}</legend>
      </div>
      
      <div className={gridClasses.main}>
        {/* Address Name */}
        {finalFields.addressName && 
          renderField(
            "address_name",
            "Address Name",
            "text",
            isRequired('address_name'),
            layout === 'account' ? 'col-span-full' : ''
          )
        }

        {/* Name Fields */}
        {layout === 'account' ? (
          <>
            {renderField("first_name", "First Name", "text", isRequired('first_name'), "sm:col-span-3")}
            {renderField("last_name", "Last Name", "text", isRequired('last_name'), "sm:col-span-3")}
          </>
        ) : (
          <div className={gridClasses.twoCol}>
            {renderField("first_name", "First Name", "text", isRequired('first_name'))}
            {renderField("last_name", "Last Name", "text", isRequired('last_name'))}
          </div>
        )}

        {/* Google Places Autocomplete */}
        {enableGooglePlaces && (
          mode === 'react-hook-form' && control ? (
            <FormField
              control={control}
              name={getFieldName('address_autocomplete')}
              render={({ field }) => (
                <GooglePlacesAutocomplete
                  mode="react-hook-form"
                  field={field}
                  onPlaceSelect={handlePlaceSelect}
                  apiKey={googlePlacesApiKey}
                  countries={googlePlacesCountries}
                  className={layout === 'account' ? 'col-span-full' : ''}
                  label="Address"
                  placeholder="Start typing your address..."
                  enableGooglePlaces={enableGooglePlaces}
                />
              )}
            />
          ) : (
            <GooglePlacesAutocomplete
              mode="server-action"
              name="address_autocomplete"
              onPlaceSelect={handlePlaceSelect}
              apiKey={googlePlacesApiKey}
              countries={googlePlacesCountries}
              className={layout === 'account' ? 'col-span-full' : ''}
              label="Address"
              placeholder="Start typing your address..."
              enableGooglePlaces={enableGooglePlaces}
            />
          )
        )}

        {/* Company */}
        {finalFields.company && 
          renderField(
            "company_name",
            "Company (optional)",
            "text",
            isRequired('company_name'),
            layout === 'account' ? 'col-span-full' : ''
          )
        }

        {/* Address Lines */}
        {renderField(
          "line_1",
          "Street Address",
          "text",
          isRequired('line_1'),
          layout === 'account' ? 'col-span-full' : ''
        )}

        {finalFields.line2 && 
          renderField(
            "line_2",
            "Address Line 2 (optional)",
            "text",
            isRequired('line_2'),
            layout === 'account' ? 'col-span-full' : ''
          )
        }

        {/* Country */}
        {renderField(
          "country",
          "Country",
          "text",
          isRequired('country'),
          layout === 'account' ? 'sm:col-span-2' : '',
          mode === 'react-hook-form' && control ? (
            <FormField
              control={control}
              name={getFieldName('country')}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  required={isRequired('country')}
                  autoComplete={getAutoComplete('country')}
                  aria-label="Country"
                >
                  <SelectTrigger sizeKind="mediumUntilSm">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {countries?.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <Select
              name={fieldMapping['country'] || 'country'}
              defaultValue={defaultValues?.country || ''}
              autoComplete={getAutoComplete('country')}
              aria-label="Country"
              required={isRequired('country')}
            >
              <SelectTrigger sizeKind="mediumUntilSm">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {countries?.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* City, County, Region, Postcode */}
        {layout === 'account' ? (
          <>
            {renderField("city", "City", "text", isRequired('city'), "sm:col-span-2 sm:col-start-1")}
            {finalFields.county && renderField("county", "County", "text", isRequired('county'), "sm:col-span-2")}
            {renderField("region", "Region", "text", isRequired('region'), "sm:col-span-2")}
            {renderField("postcode", "Postcode", "text", isRequired('postcode'), "sm:col-span-2 sm:col-start-1")}
          </>
        ) : (
          <div className={gridClasses.threeCol}>
            {renderField("city", "City", "text", isRequired('city'))}
            {finalFields.county && renderField("county", "County", "text", isRequired('county'))}
            {renderField("region", "Region", "text", isRequired('region'))}
            {renderField("postcode", "Postcode", "text", isRequired('postcode'))}
          </div>
        )}

        {/* Phone Number */}
        {finalFields.phone && 
          renderField(
            "phone_number",
            "Phone Number (optional)",
            "tel",
            isRequired('phone_number'),
            layout === 'account' ? 'sm:col-span-2' : ''
          )
        }

        {/* Instructions (shipping-specific) */}
        {finalFields.instructions && 
          renderField(
            "instructions",
            "Delivery Instructions (optional)",
            "text",
            isRequired('instructions'),
            layout === 'account' ? 'col-span-full' : ''
          )
        }
      </div>
    </fieldset>
  );
}