# Unified Address Form Component

A flexible, reusable address form component that supports both React Hook Form and server actions, with configurable fields and layouts.

## Features

- **Dual Mode Support**: Works with both React Hook Form and server actions
- **Configurable Fields**: Show/hide specific address fields as needed
- **Multiple Layouts**: Optimized layouts for checkout, account, and compact use cases
- **Field Mapping**: Map internal field names to external API field names
- **Flexible Validation**: Support for different required field sets
- **Accessibility**: Built-in ARIA labels and autocomplete attributes
- **TypeScript**: Fully typed with comprehensive interfaces

## Usage

### Basic Usage

```tsx
import { UnifiedAddressForm } from '../components/forms';

// React Hook Form mode
<UnifiedAddressForm
  mode="react-hook-form"
  fieldPrefix="shippingAddress"
  title="Shipping Address"
  autoComplete="shipping"
/>

// Server Action mode
<UnifiedAddressForm
  mode="server-action"
  title="Billing Address"
  autoComplete="billing"
  useStaticCountries={true}
/>
```

### Configuration Options

#### Field Visibility

```tsx
<UnifiedAddressForm
  fields={{
    addressName: true,    // Show address name field
    company: true,        // Show company field
    line2: true,          // Show address line 2
    county: false,        // Hide county field
    phone: true,          // Show phone number
    instructions: false,  // Hide delivery instructions
  }}
/>
```

#### Field Requirements

```tsx
<UnifiedAddressForm
  required={[
    'first_name',
    'last_name',
    'line_1',
    'city',
    'region',
    'postcode',
    'country'
  ]}
/>
```

#### Field Mapping

For compatibility with different APIs:

```tsx
<UnifiedAddressForm
  mode="server-action"
  fieldMapping={{
    address_name: 'name',  // Maps address_name to 'name' field
    line_1: 'street_address',
  }}
/>
```

#### Layouts

```tsx
// Checkout layout (default)
<UnifiedAddressForm layout="checkout" />

// Account management layout
<UnifiedAddressForm layout="account" />

// Compact layout
<UnifiedAddressForm layout="compact" />
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'react-hook-form' \| 'server-action'` | `'react-hook-form'` | Form integration mode |
| `fieldPrefix` | `string` | `''` | Prefix for field names (e.g., 'shippingAddress') |
| `fields` | `FieldConfig` | See below | Field visibility configuration |
| `fieldMapping` | `Record<string, string>` | `{}` | Map internal to external field names |
| `title` | `string` | `'Address'` | Form section title |
| `required` | `Array<keyof AddressData>` | Core fields | Required field names |
| `autoComplete` | `'shipping' \| 'billing' \| 'none'` | `'shipping'` | Autocomplete prefix |
| `defaultValues` | `Partial<AddressData>` | `undefined` | Default values (server-action mode) |
| `layout` | `'checkout' \| 'account' \| 'compact'` | `'checkout'` | Layout style |
| `useStaticCountries` | `boolean` | `false` | Use static vs dynamic countries |

### Default Field Configuration

```tsx
const defaultFields = {
  addressName: false,
  company: true,
  line2: true,
  county: false,
  phone: true,
  instructions: false,
};
```

### Core Fields

The component includes these core address fields:

- **address_name**: Optional address name/label
- **first_name**: Required first name
- **last_name**: Required last name  
- **company_name**: Optional company name
- **line_1**: Required street address
- **line_2**: Optional address line 2
- **city**: Required city
- **county**: Optional county (shipping-specific)
- **region**: Required state/province/region
- **postcode**: Required postal/zip code
- **country**: Required country
- **phone_number**: Optional phone number
- **instructions**: Optional delivery instructions (shipping-specific)

## Migration Examples

### From Checkout AddressForm

```tsx
// Before
<AddressForm
  title="Shipping Address"
  addressField="shippingAddress"
/>

// After
<UnifiedAddressForm
  mode="react-hook-form"
  fieldPrefix="shippingAddress"
  title="Shipping Address"
  autoComplete="shipping"
  fields={{
    addressName: false,
    company: true,
    line2: true,
    county: false,
    phone: true,
    instructions: true,
  }}
  layout="checkout"
/>
```

### From Account AddForm

```tsx
// Before: Large custom form component

// After
<UnifiedAddressForm
  mode="server-action"
  title="Add Address"
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
  useStaticCountries={true}
  required={['address_name', 'first_name', 'last_name', 'line_1', 'postcode', 'country']}
/>
```

## Benefits

1. **Consistency**: All address forms use the same component and styling
2. **Maintainability**: Single source of truth for address collection
3. **Flexibility**: Configurable for different use cases and requirements
4. **Accessibility**: Built-in best practices for screen readers and keyboard navigation
5. **Type Safety**: Full TypeScript support with comprehensive type checking
6. **Performance**: Reduced bundle size through code deduplication

## Accessibility Features

- Proper ARIA labels for all form fields
- Semantic fieldset and legend elements
- Appropriate autocomplete attributes for faster form filling
- Required field indicators
- Error message association with form controls