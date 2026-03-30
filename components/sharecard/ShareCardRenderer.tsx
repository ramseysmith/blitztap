// Share card renderer - captures off-screen card as PNG
// BlitzTap - Update 2

import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Share, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard, { ShareCardData } from './ShareCard';

export interface ShareCardRendererHandle {
  shareCard: (data: ShareCardData) => Promise<boolean>;
}

const APP_STORE_URL = 'https://apps.apple.com/app/id6759490849';

function getFallbackText(data: ShareCardData): string {
  if (data.variant === 'daily') {
    return `I scored ${data.dailyCorrect}/${data.dailyTotal} in today's BlitzTap Daily Challenge! ${APP_STORE_URL}`;
  }
  if (data.variant === 'achievement') {
    return `I unlocked "${data.achievementTitle}" in BlitzTap! ${data.achievementCount}/${data.achievementTotal} achievements. ${APP_STORE_URL}`;
  }
  if (data.variant === 'levelup') {
    return `I reached Level ${data.level} in BlitzTap! ${APP_STORE_URL}`;
  }
  const modeLabel = data.modeBadge || data.mode;
  return `I scored ${data.score} in BlitzTap (${modeLabel})! Can you beat me? ${APP_STORE_URL}`;
}

const ShareCardRenderer = forwardRef<ShareCardRendererHandle>((_, ref) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [cardData, setCardData] = React.useState<ShareCardData | null>(null);

  const shareCard = useCallback(async (data: ShareCardData): Promise<boolean> => {
    try {
      setCardData(data);

      // Wait a frame for render
      await new Promise(resolve => setTimeout(resolve, 100));

      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your BlitzTap score',
            UTI: 'public.png',
          });
          return true;
        }
      }

      // Fallback to text share
      await Share.share({
        message: getFallbackText(data),
      });
      return true;
    } catch (error) {
      // User cancelled or error
      if ((error as any)?.message?.includes('User did not share')) return false;
      console.error('Share error:', error);

      // Final fallback
      try {
        await Share.share({ message: getFallbackText(data) });
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({ shareCard }), [shareCard]);

  return (
    <View style={styles.offscreen}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
      >
        {cardData && <ShareCard data={cardData} />}
      </ViewShot>
    </View>
  );
});

ShareCardRenderer.displayName = 'ShareCardRenderer';
export default ShareCardRenderer;

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
});
