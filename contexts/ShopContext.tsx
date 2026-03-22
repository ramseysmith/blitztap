// Shop context for BlitzTap - Update 1

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PlayerInventory, ShopCategory, getItemById, DEFAULT_INVENTORY } from '../utils/shopData';
import { getInventory, saveInventory, addOwnedItem, setEquipped } from '../utils/shopStorage';
import { getTotalCoins, spendCoins } from '../utils/storage';

interface ShopContextType {
  inventory: PlayerInventory;
  coins: number;
  isLoaded: boolean;
  purchaseItem: (itemId: string) => Promise<boolean>;
  equipItem: (itemId: string, category: ShopCategory) => void;
  unequipItem: (category: ShopCategory) => void;
  canAfford: (price: number) => boolean;
  refreshCoins: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<PlayerInventory>({ ...DEFAULT_INVENTORY });
  const [coins, setCoins] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const [inv, currentCoins] = await Promise.all([
        getInventory(),
        getTotalCoins(),
      ]);
      setInventory(inv);
      setCoins(currentCoins);
      setIsLoaded(true);
    }
    load();
  }, []);

  const refreshCoins = useCallback(async () => {
    const current = await getTotalCoins();
    setCoins(current);
  }, []);

  const purchaseItem = useCallback(async (itemId: string): Promise<boolean> => {
    const item = getItemById(itemId);
    if (!item) return false;
    if (coins < item.price) return false;
    if (inventory.ownedItems.includes(itemId)) return false;

    const newTotal = await spendCoins(item.price);
    const newInventory = await addOwnedItem(itemId);

    // Auto-equip after purchase
    const equipped = { ...newInventory };
    if (item.category === 'shapes') {
      equipped.equippedShape = itemId;
    } else if (item.category === 'backgrounds') {
      equipped.equippedBackground = itemId;
    } else {
      equipped.equippedEffect = itemId;
    }
    await saveInventory(equipped);

    setInventory(equipped);
    setCoins(newTotal);
    return true;
  }, [coins, inventory]);

  const equipItem = useCallback(async (itemId: string, category: ShopCategory) => {
    const updated = await setEquipped(category, itemId);
    setInventory(updated);
  }, []);

  const unequipItem = useCallback(async (category: ShopCategory) => {
    const updated = await setEquipped(category, 'default');
    setInventory(updated);
  }, []);

  const canAfford = useCallback((price: number) => coins >= price, [coins]);

  return (
    <ShopContext.Provider
      value={{ inventory, coins, isLoaded, purchaseItem, equipItem, unequipItem, canAfford, refreshCoins }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within a ShopProvider');
  return context;
}
