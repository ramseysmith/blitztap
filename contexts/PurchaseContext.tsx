// Purchase Context for BlitzTap
// Handles RevenueCat integration for in-app purchases

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../utils/adConfig';

const STORAGE_KEY = 'blitztap_purchase_state';

interface PurchaseState {
  isProUser: boolean;
  removeAdsPrice: string;
}

interface PurchaseContextType {
  isProUser: boolean;
  isLoading: boolean;
  removeAdsPrice: string;
  purchaseRemoveAds: () => Promise<{ success: boolean; message: string }>;
  restorePurchases: () => Promise<{ success: boolean; message: string }>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

interface PurchaseProviderProps {
  children: ReactNode;
}

export function PurchaseProvider({ children }: PurchaseProviderProps) {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [removeAdsPrice, setRemoveAdsPrice] = useState('$3.99');
  const [removeAdsPackage, setRemoveAdsPackage] = useState<PurchasesPackage | null>(null);

  // Load cached state for instant UI
  useEffect(() => {
    async function loadCachedState() {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const state: PurchaseState = JSON.parse(cached);
          setIsProUser(state.isProUser);
          if (state.removeAdsPrice) {
            setRemoveAdsPrice(state.removeAdsPrice);
          }
        }
      } catch (error) {
        console.error('Error loading cached purchase state:', error);
      }
    }
    loadCachedState();
  }, []);

  // Initialize RevenueCat and verify entitlements
  useEffect(() => {
    async function initializePurchases() {
      try {
        // Configure RevenueCat
        await Purchases.configure({ apiKey: REVENUECAT_CONFIG.API_KEY });

        // Get customer info to check entitlements
        const customerInfo = await Purchases.getCustomerInfo();
        const hasRemoveAds = checkRemoveAdsEntitlement(customerInfo);
        setIsProUser(hasRemoveAds);

        // Get available packages and price
        try {
          const offerings = await Purchases.getOfferings();
          const currentOffering = offerings.current;
          if (currentOffering) {
            const removeAds = currentOffering.availablePackages.find(
              (pkg: PurchasesPackage) => pkg.product.identifier === REVENUECAT_CONFIG.REMOVE_ADS_PRODUCT
            );
            if (removeAds) {
              setRemoveAdsPackage(removeAds);
              setRemoveAdsPrice(removeAds.product.priceString);
            }
          }
        } catch (offeringsError) {
          console.error('Error fetching offerings:', offeringsError);
        }

        // Cache the state
        await cacheState({ isProUser: hasRemoveAds, removeAdsPrice });
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
        // Default to showing ads (fail open for revenue)
        setIsProUser(false);
      } finally {
        setIsLoading(false);
      }
    }

    initializePurchases();

    // Listen for customer info updates
    const customerInfoListener = (customerInfo: CustomerInfo) => {
      const hasRemoveAds = checkRemoveAdsEntitlement(customerInfo);
      setIsProUser(hasRemoveAds);
      cacheState({ isProUser: hasRemoveAds, removeAdsPrice });
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, []);

  // Check if user has the remove_ads entitlement
  function checkRemoveAdsEntitlement(customerInfo: CustomerInfo): boolean {
    return (
      customerInfo.entitlements.active[REVENUECAT_CONFIG.REMOVE_ADS_ENTITLEMENT]?.isActive ?? false
    );
  }

  // Cache state to AsyncStorage
  async function cacheState(state: PurchaseState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error caching purchase state:', error);
    }
  }

  // Purchase "Remove Ads"
  const purchaseRemoveAds = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      if (!removeAdsPackage) {
        // Try to get the package again
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;
        if (!currentOffering) {
          return { success: false, message: 'Unable to load purchase options. Please try again.' };
        }

        const pkg = currentOffering.availablePackages.find(
          (p: PurchasesPackage) => p.product.identifier === REVENUECAT_CONFIG.REMOVE_ADS_PRODUCT
        );

        if (!pkg) {
          return { success: false, message: 'Remove Ads is not available at this time.' };
        }

        setRemoveAdsPackage(pkg);
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasRemoveAds = checkRemoveAdsEntitlement(customerInfo);

        if (hasRemoveAds) {
          setIsProUser(true);
          await cacheState({ isProUser: true, removeAdsPrice });
          return { success: true, message: 'Ads removed successfully!' };
        }

        return { success: false, message: 'Purchase was not completed.' };
      }

      const { customerInfo } = await Purchases.purchasePackage(removeAdsPackage);
      const hasRemoveAds = checkRemoveAdsEntitlement(customerInfo);

      if (hasRemoveAds) {
        setIsProUser(true);
        await cacheState({ isProUser: true, removeAdsPrice });
        return { success: true, message: 'Ads removed successfully!' };
      }

      return { success: false, message: 'Purchase was not completed.' };
    } catch (error: any) {
      // Check if user cancelled
      if (error.userCancelled) {
        return { success: false, message: '' }; // Silent cancel
      }
      console.error('Purchase error:', error);
      return { success: false, message: 'Purchase failed. Please try again.' };
    }
  }, [removeAdsPackage, removeAdsPrice]);

  // Restore previous purchases
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasRemoveAds = checkRemoveAdsEntitlement(customerInfo);

      if (hasRemoveAds) {
        setIsProUser(true);
        await cacheState({ isProUser: true, removeAdsPrice });
        return { success: true, message: 'Purchases restored successfully!' };
      }

      return { success: false, message: 'No previous purchases found.' };
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, message: 'Unable to restore purchases. Please try again.' };
    }
  }, [removeAdsPrice]);

  return (
    <PurchaseContext.Provider
      value={{
        isProUser,
        isLoading,
        removeAdsPrice,
        purchaseRemoveAds,
        restorePurchases,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}
