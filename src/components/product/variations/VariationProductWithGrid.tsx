"use client";
import {
  useAuthedAccountMember,
  useCart,
  useVariationProduct,
  VariationProduct,
  VariationProductProvider,
} from "../../../react-shopper-hooks";
import ProductCarousel from "../carousel/ProductCarousel";
import ProductSummary from "../ProductSummary";
import ProductDetails from "../ProductDetails";
import { StatusButton } from "../../button/StatusButton";
import PersonalisedInfo from "../PersonalisedInfo";
import ProductHighlights from "../ProductHighlights";
import Reviews from "../../reviews/yotpo/Reviews";
import { ResourcePage, SubscriptionOffering } from "@elasticpath/js-sdk";
import SubscriptionOfferPlans from "../SubscriptionOfferPlans";
import { toast } from "react-toastify";
import ProductExtensions from "../ProductExtensions";
import { useEffect, useState } from "react";
import StoreLocator from "../StoreLocator";
import { Content as BuilderContent } from "@builder.io/sdk-react";
import { cmsConfig } from "../../../lib/resolve-cms-env";
import { builder } from "@builder.io/sdk";
import { builderComponent } from "../../../components/builder-io/BuilderComponents";
import { RecommendedProducts } from "../../recommendations/RecommendationProducts";
import ProductRelationship from "../related-products/ProductRelationship";
import moment from "moment";
import { getInventoryDetails } from "../actions";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import VariationQuantityGrid from "./VariationQuantityGrid";
builder.init(process.env.NEXT_PUBLIC_BUILDER_IO_KEY || "");

interface VariationQuantity {
  variationId: string;
  optionId: string;
  optionName: string;
  quantity: number;
}

export const VariationProductWithGridDetail = ({
  variationProduct,
  offerings,
  content,
  relationship,
  purchaseHistory,
}: {
  variationProduct: VariationProduct;
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
  purchaseHistory: any;
}): JSX.Element => {
  return (
    <VariationProductProvider variationProduct={variationProduct}>
      <VariationProductWithGridContainer
        offerings={offerings}
        content={content}
        relationship={relationship}
        purchaseHistory={purchaseHistory}
      />
    </VariationProductProvider>
  );
};

export function VariationProductWithGridContainer({
  offerings,
  content,
  relationship,
  purchaseHistory,
}: {
  offerings: ResourcePage<SubscriptionOffering, never>;
  content: any;
  relationship: any[];
  purchaseHistory: any;
}): JSX.Element {
  const { enableBuilderIO } = cmsConfig;
  const { product, variationsMatrix, variations } = useVariationProduct() as any;
  const { useScopedAddProductToCart, useScopedAddSubscriptionItemToCart } =
    useCart();
  const { mutate: mutateAddItem, isPending: isPendingAddItem } =
    useScopedAddProductToCart();
  const {
    mutate: mutateAddSubscriptionItem,
    isPending: isPendingSubscriptionItem,
  } = useScopedAddSubscriptionItemToCart();
  const { selectedAccountToken } = useAuthedAccountMember();

  const { response, main_image, otherImages, baseProduct } = product;
  const { extensions } = response.attributes;
  const {
    id,
    meta: { original_display_price },
  } = response;

  const [variationQuantities, setVariationQuantities] = useState<VariationQuantity[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";
  const [inventory, setInventory] = useState<number>(0);
  const [unlimitedStock, setUnlimitedStock] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoaded(false);
      const response = await getInventoryDetails(id);
      if (response) {
        setInventory(response.data.available);
      } else {
        setUnlimitedStock(true);
      }
      setLoaded(true);
    };
    init();
  }, [id]);

  const handleOverlay = (
    event: React.FormEvent<HTMLFormElement>,
    value: boolean,
  ) => {
    event.preventDefault();
    setIsOverlayOpen(value);
  };

  const getTotalQuantity = () => {
    return variationQuantities.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const totalQuantity = getTotalQuantity();
    if (totalQuantity === 0) {
      toast.error("Please select at least one item", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const itemsToAdd = variationQuantities.filter(vq => vq.quantity > 0);
    const totalItems = itemsToAdd.length;
    let successCount = 0;
    
    console.log(`Attempting to add ${totalItems} different items to cart:`, itemsToAdd);
    
    // Sequential processing function
    const processNextItem = (itemIndex: number) => {
      if (itemIndex >= itemsToAdd.length) {
        return;
      }
      
      const variationQty = itemsToAdd[itemIndex];
      console.log(`Processing item ${itemIndex + 1}/${totalItems}:`, variationQty);

      // Get the product ID for this specific variation combination
      let targetProductId: string;
      
      if (variations.length === 1) {
        // Single variation - direct lookup in matrix
        targetProductId = variationsMatrix[variationQty.optionId] || id;
      } else {
        // Multiple variations - more complex lookup needed
        // For now, we'll use the base product ID and pass variation info
        targetProductId = id;
      }

      const data: any = {
        custom_inputs: {
          additional_information: [
            {
              key: "Variation",
              value: variationQty.optionName,
            }
          ],
          options: [variationQty.optionName],
        },
      };
      
      if (enableClickAndCollect) {
        const deliveryMode = formData.get("delivery_mode");
        if (deliveryMode) {
          data.custom_inputs.location = {};
          data.custom_inputs.location.delivery_mode = deliveryMode;
        }
        const locationCode = formData.get("location_code");
        const locationName = formData.get("location_name");
        if (locationCode && locationName) {
          data.custom_inputs.location.location_name = locationName;
          data.custom_inputs.location.location_code = locationCode;
        }
      }
      
      response?.attributes?.custom_inputs &&
        Object.keys(response.attributes.custom_inputs).map((input) => {
          const value = formData.get(input);
          if (value) {
            const info = {
              key: response.attributes.custom_inputs[input].name,
              value,
            };
            data.custom_inputs.additional_information.push(info);
          }
        });

      if (response?.attributes?.extensions?.["products(vendor)"]) {
        const info = {
          key: "Fulfilled By",
          value:
            response?.attributes?.extensions?.["products(vendor)"]?.vendor_name,
        };
        info.value && data.custom_inputs.additional_information.push(info);
        data.custom_inputs.vendor_store_id =
          response?.attributes?.extensions?.["products(vendor)"]?.vendor_store_id;
      }

      const price_type = formData.get("price_type")?.toString() || "";
      
      console.log(`Adding item ${itemIndex + 1}/${totalItems} to cart:`, {
        productId: targetProductId,
        quantity: variationQty.quantity,
        optionName: variationQty.optionName,
        data
      });
      
      if (price_type === "" || price_type === "one_time") {
        mutateAddItem(
          { productId: targetProductId, quantity: variationQty.quantity, data },
          {
            onSuccess: () => {
              successCount++;
              console.log(`Item ${itemIndex + 1} added successfully. Success count: ${successCount}/${totalItems}`);
              setIsOverlayOpen(false);
              
              // Process next item or show completion message
              if (itemIndex + 1 < itemsToAdd.length) {
                // More items to process - continue with next item
                processNextItem(itemIndex + 1);
              } else {
                // All items processed - show success message
                toast.success(`Added ${successCount} item${successCount > 1 ? 's' : ''} to cart`, {
                  position: "top-center",
                  autoClose: 2000,
                  hideProgressBar: false,
                });
                // Clear quantities after successful additions
                setVariationQuantities([]);
              }
            },
            onError: (response: any) => {
              console.error(`Error adding item ${itemIndex + 1} (${variationQty.optionName}):`, response);
              if (response?.errors) {
                toast.error(`Error adding ${variationQty.optionName}: ${response?.errors?.[0].detail}`, {
                  position: "top-center",
                  autoClose: 3000,
                  hideProgressBar: false,
                });
              }
              // Continue with next item even if this one failed
              if (itemIndex + 1 < itemsToAdd.length) {
                processNextItem(itemIndex + 1);
              }
            },
          },
        );
      } else {
        const planId = formData.get("plan")?.toString() || "";
        const pricingOptionId = formData.get("pricing_option")?.toString() || "";
        if (main_image?.link?.href) {
          data.custom_inputs.image_url = main_image?.link?.href;
        }
        mutateAddSubscriptionItem({
          data: {
            type: "subscription_item",
            id: price_type,
            quantity: variationQty.quantity,
            subscription_configuration: {
              plan: planId,
              pricing_option: pricingOptionId,
            },
            custom_inputs: data.custom_inputs,
          },
        });
      }
    };
    
    // Start processing the first item
    if (itemsToAdd.length > 0) {
      processNextItem(0);
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-10">
        <div className="basis-full lg:basis-1/2">
          {main_image && (
            <ProductCarousel images={otherImages} mainImage={main_image} />
          )}
        </div>
        <div className="basis-full lg:basis-1/2">
          {original_display_price && (
            <span className="uppercase inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-medium text-pink-700 ring-1 ring-inset ring-pink-700 mb-6 mr-2">
              {response.meta.sale_id}
            </span>
          )}
          <form onSubmit={(e: any) => handleSubmit(e)}>
            <div className="flex flex-col gap-4 md:gap-6">
              <input
                type="text"
                name="delivery_mode"
                value="Home Delivery"
                hidden
                readOnly
              ></input>

              <ProductSummary product={response} offerings={offerings} />
              
              {/* Variation Quantity Grid */}
              <VariationQuantityGrid onQuantitiesChange={setVariationQuantities} />
              
              {offerings && offerings.data.length > 0 && (
                <SubscriptionOfferPlans
                  offerings={offerings}
                  product={response}
                />
              )}
              <PersonalisedInfo
                custom_inputs={response.attributes.custom_inputs}
              />
              {loaded && unlimitedStock && product.kind != "base-product" && (
                <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <span>In stock</span>
                </div>
              )}
              {loaded &&
                !unlimitedStock &&
                product.kind != "base-product" &&
                inventory > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                    <CheckIcon
                      className="h-5 w-5 flex-shrink-0 text-green-500"
                      aria-hidden="true"
                    />
                    <span>In stock ({inventory} available)</span>
                  </div>
                )}
              {loaded &&
                !unlimitedStock &&
                product.kind != "base-product" &&
                inventory === 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                    <XMarkIcon
                      className="h-5 w-5 flex-shrink-0 text-red-800"
                      aria-hidden="true"
                    />
                    <span>Out of stock</span>
                  </div>
                )}
              
              <StatusButton
                disabled={
                  (!unlimitedStock && inventory === 0) ||
                  getTotalQuantity() === 0
                }
                type="submit"
                status={
                  isPendingAddItem || isPendingSubscriptionItem
                    ? "loading"
                    : "idle"
                }
              >
                ADD TO CART
              </StatusButton>
              {offerings?.data?.length == 0 && enableClickAndCollect && (
                <StatusButton
                  disabled={product.kind === "base-product"}
                  type="submit"
                  onClick={(event: any) => handleOverlay(event, true)}
                  className="uppercase"
                >
                  Click & Collect
                </StatusButton>
              )}
              {purchaseHistory?.data?.length > 0 && (
                <div>
                  <div className="text-base font-medium uppercase lg:text-lg text-gray-800 mb-4">
                    Previous Purchase Order History
                  </div>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 px-4 py-2">
                          Purchase Date
                        </th>
                        <th className="border border-gray-300 px-4 py-2">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory?.data.map(
                        (order: any, index: number) => (
                          <tr key={index} className="border border-gray-300">
                            <td className="border border-gray-300 px-4 py-2">
                              {moment(
                                order.meta.timestamps.created_at,
                                moment.ISO_8601,
                                true,
                              ).format("DD MMM YYYY HH:mm:ss")}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {order.quantity}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <ProductDetails product={response} />
              {extensions && <ProductHighlights extensions={extensions} />}
              {extensions && <ProductExtensions extensions={extensions} />}
            </div>
          </form>
          {isOverlayOpen && (
            <StoreLocator
              onClose={() => setIsOverlayOpen(false)}
              product={response}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
      <RecommendedProducts productId={id} />
      {relationship &&
        relationship.map((rel: any) => {
          return (
            <ProductRelationship
              productId={id}
              baseProductId={baseProduct?.id}
              slug={rel.slug}
              relationship={relationship}
              key={rel.slug}
            />
          );
        })}
      {enableBuilderIO && content && (
        <BuilderContent
          model="page"
          content={content}
          apiKey={process.env.NEXT_PUBLIC_BUILDER_IO_KEY || ""}
          customComponents={builderComponent}
        />
      )}
      <Reviews product={response} />
    </div>
  );
}