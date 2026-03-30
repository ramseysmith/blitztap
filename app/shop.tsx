import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useShop } from '../contexts/ShopContext';
import { useFeedback } from '../hooks/useFeedback';
import {
  ShopItem,
  ShopCategory,
  SHAPE_SKINS,
  BACKGROUNDS,
  TAP_EFFECTS,
  RARITY_COLORS,
  Rarity,
} from '../utils/shopData';
import { Colors } from '../utils/colors';
import { ShapeSkinRenderer } from '../components/shapes/skins/ShapeSkinRenderer';
import { SPRING_CONFIG } from '../hooks/useGameAnimations';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

const CATEGORY_TABS: { id: ShopCategory; label: string; icon: string }[] = [
  { id: 'shapes', label: 'Shapes', icon: '◆' },
  { id: 'backgrounds', label: 'Backgrounds', icon: '🖼' },
  { id: 'effects', label: 'Effects', icon: '✨' },
];

const ITEMS_BY_CATEGORY: Record<ShopCategory, ShopItem[]> = {
  shapes: SHAPE_SKINS,
  backgrounds: BACKGROUNDS,
  effects: TAP_EFFECTS,
};

function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <View style={[styles.rarityBadge, { borderColor: RARITY_COLORS[rarity] }]}>
      <Text style={[styles.rarityText, { color: RARITY_COLORS[rarity] }]}>
        {rarity.toUpperCase()}
      </Text>
    </View>
  );
}

function ItemPreview({ item }: { item: ShopItem }) {
  if (item.category === 'shapes') {
    return (
      <View style={styles.previewShape}>
        <ShapeSkinRenderer shape="circle" color="blue" size={44} skinId={item.id} />
      </View>
    );
  }

  if (item.category === 'backgrounds') {
    return (
      <View style={[styles.previewBg, { backgroundColor: item.previewColor ?? Colors.background }]}>
        {/* Small star dots for space themes */}
        {(item.id === 'bg_space' || item.id === 'bg_aurora') && (
          <>
            <View style={[styles.previewStar, { top: 8, left: 12 }]} />
            <View style={[styles.previewStar, { top: 20, left: 36 }]} />
            <View style={[styles.previewStar, { top: 12, left: 55 }]} />
          </>
        )}
      </View>
    );
  }

  // Effects: static burst illustration
  return (
    <View style={styles.previewEffect}>
      <Text style={styles.previewEffectIcon}>
        {item.id === 'fx_sparkle' ? '✦' :
         item.id === 'fx_confetti' ? '🎊' :
         item.id === 'fx_electric' ? '⚡' :
         item.id === 'fx_smoke' ? '💨' :
         item.id === 'fx_shockwave' ? '💥' :
         item.id === 'fx_fireworks' ? '🎆' : '✨'}
      </Text>
    </View>
  );
}

function ItemCard({
  item,
  isOwned,
  isEquipped,
  canAfford,
  onPress,
}: {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale.value }] };
  });

  const rarityColor = RARITY_COLORS[item.rarity];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
    >
      <Animated.View
        style={[
          styles.itemCard,
          isEquipped && { borderColor: rarityColor, borderWidth: 2 },
        ].concat([cardStyle])}
      >
        <ItemPreview item={item} />

        <RarityBadge rarity={item.rarity} />

        <Text style={styles.itemName}>{item.name}</Text>

        {isEquipped ? (
          <View style={[styles.statusBadge, { backgroundColor: rarityColor + '33' }]}>
            <Text style={[styles.statusText, { color: rarityColor }]}>Equipped</Text>
          </View>
        ) : isOwned ? (
          <View style={[styles.statusBadge, styles.ownedBadge]}>
            <Text style={styles.ownedText}>Owned</Text>
          </View>
        ) : (
          <View style={styles.priceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.priceText, !canAfford && styles.priceTextAfford]}>
              {item.price}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function PurchaseModal({
  item,
  canAfford,
  coins,
  onBuy,
  onCancel,
}: {
  item: ShopItem;
  canAfford: boolean;
  coins: number;
  onBuy: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalPreview}>
            <ItemPreview item={item} />
          </View>

          <RarityBadge rarity={item.rarity} />
          <Text style={styles.modalTitle}>{item.name}</Text>
          <Text style={styles.modalDescription}>{item.description}</Text>

          <View style={styles.modalPriceRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.modalPrice, !canAfford && styles.priceTextAfford]}>
              {item.price}
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.needMoreText}>
              Need {item.price - coins} more coins
            </Text>
          )}

          <View style={styles.modalButtons}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
              onPress={canAfford ? onBuy : undefined}
            >
              <Text style={styles.buyText}>
                {canAfford ? `Buy for ${item.price} 🪙` : 'Not enough coins'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inventory, coins, purchaseItem, equipItem, unequipItem, canAfford, refreshCoins } = useShop();
  const feedback = useFeedback();
  const { checkAfterPurchase } = useAchievementContext();
  const [activeTab, setActiveTab] = useState<ShopCategory>('shapes');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // Refresh coins on focus
  useFocusEffect(useCallback(() => { refreshCoins(); }, [refreshCoins]));

  const getEquippedId = (category: ShopCategory) => {
    if (category === 'shapes') return inventory.equippedShape;
    if (category === 'backgrounds') return inventory.equippedBackground;
    return inventory.equippedEffect;
  };

  const handleItemPress = useCallback((item: ShopItem) => {
    feedback.onButtonPress();
    const isOwned = inventory.ownedItems.includes(item.id);
    const equippedId = getEquippedId(item.category);
    const isEquipped = equippedId === item.id;

    if (isOwned) {
      if (isEquipped) {
        // Unequip
        unequipItem(item.category);
      } else {
        // Equip
        equipItem(item.id, item.category);
      }
      return;
    }

    // Show purchase modal
    setSelectedItem(item);
  }, [inventory, feedback, equipItem, unequipItem]);

  const handleBuy = useCallback(async () => {
    if (!selectedItem) return;
    feedback.onLevelUp();
    const success = await purchaseItem(selectedItem.id);
    setSelectedItem(null);
    if (success) {
      checkAfterPurchase();
    } else {
      Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    }
  }, [selectedItem, purchaseItem, feedback, checkAfterPurchase]);

  const items = ITEMS_BY_CATEGORY[activeTab];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinCount}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      {/* Category tabs */}
      <View style={styles.tabs}>
        {CATEGORY_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Items grid */}
      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const isOwned = inventory.ownedItems.includes(item.id);
          const isEquipped = getEquippedId(activeTab) === item.id;
          return (
            <ItemCard
              key={item.id}
              item={item}
              isOwned={isOwned}
              isEquipped={isEquipped}
              canAfford={canAfford(item.price)}
              onPress={() => handleItemPress(item)}
            />
          );
        })}

        {/* Get More Coins teaser */}
        <View style={styles.getMoreCoinsCard}>
          <Text style={styles.getMoreTitle}>🪙 Get More Coins</Text>
          <Text style={styles.getMoreSub}>Coin packs — Coming Soon!</Text>
          <Text style={styles.getMoreHint}>Earn coins by playing any mode</Text>
        </View>
      </ScrollView>

      {/* Purchase modal */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem}
          canAfford={canAfford(selectedItem.price)}
          coins={coins}
          onBuy={handleBuy}
          onCancel={() => setSelectedItem(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backButton: { minWidth: 60 },
  backText: { color: Colors.accent, fontSize: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  coinIcon: { fontSize: 14 },
  coinCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.accent + '22',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabLabelActive: { color: Colors.accent },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  itemCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  previewShape: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewBg: {
    width: 70,
    height: 48,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  previewStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  previewEffect: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewEffectIcon: { fontSize: 36 },
  rarityBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ownedBadge: { backgroundColor: Colors.backgroundLight },
  ownedText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  priceTextAfford: { color: Colors.error },
  getMoreCoinsCard: {
    width: '100%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning + '33',
    marginTop: 4,
  },
  getMoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.warning,
    marginBottom: 4,
  },
  getMoreSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  getMoreHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  modalPreview: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  needMoreText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  buyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  buyButtonDisabled: { backgroundColor: Colors.backgroundLight },
  buyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.background,
  },
});
