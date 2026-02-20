import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../utils/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.button_primary : styles.button_secondary,
        size === 'small' ? styles.button_small : size === 'large' ? styles.button_large : styles.button_medium,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.text_primary : styles.text_secondary,
          size === 'small' ? styles.text_small : size === 'large' ? styles.text_large : styles.text_medium,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  button_primary: {
    backgroundColor: Colors.accent,
  },
  button_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  button_small: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  button_medium: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  button_large: {
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  text_primary: {
    color: Colors.background,
  },
  text_secondary: {
    color: Colors.accent,
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 18,
  },
  text_large: {
    fontSize: 22,
  },
});
