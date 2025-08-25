"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "../input/Input";
import { Label } from "../label/Label";
import { FormControl, FormItem, FormLabel, FormMessage } from "../form/Form";

export interface PlaceResult {
  line_1: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
}

export interface GooglePlacesAutocompleteProps {
  // Form integration
  mode: 'react-hook-form' | 'server-action';
  
  // Styling and layout
  className?: string;
  label?: string;
  placeholder?: string;
  
  // Callbacks
  onPlaceSelect?: (place: PlaceResult) => void;
  
  // API configuration
  apiKey?: string;
  countries?: string[]; // Country codes to restrict results
  
  // Field props for server action mode
  name?: string;
  defaultValue?: string;
  
  // React Hook Form props
  field?: any; // Field from useController/FormField
  
  // Error handling
  error?: string;
  
  // Control
  enableGooglePlaces?: boolean;
}

const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export function GooglePlacesAutocomplete({
  mode,
  className = '',
  label = 'Address',
  placeholder = 'Start typing your address...',
  onPlaceSelect,
  apiKey = DEFAULT_API_KEY,
  countries,
  name = 'address_autocomplete',
  defaultValue = '',
  field,
  error,
  enableGooglePlaces = true,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const loaderRef = useRef<Loader | null>(null);

  // Parse Google Places address components into our format
  const parseAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]): PlaceResult => {
    const result: PlaceResult = {
      line_1: '',
      city: '',
      region: '',
      postcode: '',
      country: '',
    };

    let streetNumber = '';
    let route = '';

    components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.region = component.short_name; // Use short name for state/province codes
      } else if (types.includes('postal_code')) {
        result.postcode = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.short_name; // Use country code
      }
    });

    // Combine street number and route for line_1
    result.line_1 = [streetNumber, route].filter(Boolean).join(' ');

    return result;
  }, []);

  // Populate form fields in server action mode
  const populateServerActionFields = useCallback((addressData: PlaceResult) => {
    const fieldMappings = [
      { fieldName: 'line_1', value: addressData.line_1 },
      { fieldName: 'city', value: addressData.city },
      { fieldName: 'region', value: addressData.region },
      { fieldName: 'postcode', value: addressData.postcode },
      { fieldName: 'country', value: addressData.country },
    ];

    fieldMappings.forEach(({ fieldName, value }) => {
      const input = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
      if (input && value) {
        input.value = value;
        // Trigger change event for any listeners
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
      }
    });
  }, []);

  const initializeAutocomplete = useCallback(async () => {
    if (!enableGooglePlaces || !inputRef.current || !apiKey) return;

    try {
      // Initialize Google Maps loader
      if (!loaderRef.current) {
        loaderRef.current = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });
      }

      // Load the Places library
      await loaderRef.current.load();

      // Create autocomplete instance
      const autocompleteOptions: google.maps.places.AutocompleteOptions = {
        types: ['address'],
        fields: [
          'address_components',
          'formatted_address',
          'place_id'
        ],
      };
      
      // Only add component restrictions if countries are specified
      if (countries && countries.length > 0) {
        autocompleteOptions.componentRestrictions = { country: countries };
      }
      
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, autocompleteOptions);

      autocompleteRef.current = autocomplete;

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.address_components) {
          console.warn('No address components found for selected place');
          return;
        }

        // Parse address components
        const addressData = parseAddressComponents(place.address_components);
        
        // Call the callback with parsed data
        if (onPlaceSelect) {
          onPlaceSelect(addressData);
        }

        // Update the input value for display
        if (inputRef.current && place.formatted_address) {
          inputRef.current.value = place.formatted_address;
          
          // Trigger change event for React Hook Form
          if (field) {
            field.onChange(place.formatted_address);
          }
        }

        // For server action mode, populate the form fields directly
        if (mode === 'server-action') {
          populateServerActionFields(addressData);
        }
      });

    } catch (error) {
      console.error('Failed to initialize Google Places Autocomplete:', error);
    }
  }, [enableGooglePlaces, apiKey, countries, onPlaceSelect, field, mode, parseAddressComponents, populateServerActionFields]);

  // Initialize when component mounts
  useEffect(() => {
    initializeAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initializeAutocomplete]);

  // Isolate Google Maps CSS to prevent conflicts with page layout
  useEffect(() => {
    if (!enableGooglePlaces) return;
    
    const style = document.createElement('style');
    style.id = 'google-places-css-isolation';
    style.textContent = `
      /* Only style Google Places elements, don't affect the rest of the page */
      .pac-container {
        background-color: white !important;
        border: 1px solid #d1d5db !important;
        border-radius: 6px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        font-family: inherit !important;
        font-size: 14px !important;
        z-index: 10000 !important;
        margin-top: 2px !important;
      }
      
      .pac-item {
        padding: 8px 12px !important;
        font-size: 14px !important;
        color: #374151 !important;
        cursor: pointer !important;
        border-bottom: 1px solid #f3f4f6 !important;
        line-height: 1.5 !important;
      }
      
      .pac-item:last-child {
        border-bottom: none !important;
      }
      
      .pac-item:hover {
        background-color: #f9fafb !important;
      }
      
      .pac-item-selected {
        background-color: #eff6ff !important;
      }
      
      .pac-item-query {
        font-size: 14px !important;
        color: #1f2937 !important;
      }
      
      .pac-matched {
        font-weight: 600 !important;
        color: #1f2937 !important;
      }
      
      /* Prevent Google's global CSS from affecting the page */
      .gm-style * {
        box-sizing: content-box !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('google-places-css-isolation');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [enableGooglePlaces]);

  // Handle input changes for React Hook Form
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (field) {
      field.onChange(event.target.value);
    }
  }, [field]);

  // Render for React Hook Form mode
  if (mode === 'react-hook-form' && field) {
    return (
      <FormItem className={className}>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            {...field}
            ref={inputRef}
            placeholder={placeholder}
            onChange={handleInputChange}
            autoComplete="off"
            aria-label={label}
            sizeKind="mediumUntilSm"
          />
        </FormControl>
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    );
  }

  // Render for Server Action mode
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        ref={inputRef}
        id={name}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        aria-label={label}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}