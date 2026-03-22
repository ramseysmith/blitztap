// Shop inventory persistence for BlitzTap

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerInventory, DEFAULT_INVENTORY } from './shopData';

const INVENTORY_KEY = 'blitztap_shop_inventory';

export async function getInventory(): Promise<PlayerInventory> {
  try {
    const data = await AsyncStorage.getItem(INVENTORY_KEY);
    if (!data) return { ...DEFAULT_INVENTORY };
    return { ...DEFAULT_INVENTORY, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_INVENTORY };
  }
}

export async function saveInventory(inventory: PlayerInventory): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error('Error saving inventory:', error);
  }
}

export async function addOwnedItem(itemId: string): Promise<PlayerInventory> {
  const inventory = await getInventory();
  if (!inventory.ownedItems.includes(itemId)) {
    inventory.ownedItems = [...inventory.ownedItems, itemId];
    await saveInventory(inventory);
  }
  return inventory;
}

export async function setEquipped(
  category: 'shapes' | 'backgrounds' | 'effects',
  itemId: string,
): Promise<PlayerInventory> {
  const inventory = await getInventory();
  if (category === 'shapes') {
    inventory.equippedShape = itemId;
  } else if (category === 'backgrounds') {
    inventory.equippedBackground = itemId;
  } else {
    inventory.equippedEffect = itemId;
  }
  await saveInventory(inventory);
  return inventory;
}
