import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, space, type } from "./theme";

export function Screen({
  children,
  style,
  scroll,
  centered,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  centered?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: Math.max(insets.top, 12) + 8,
    paddingBottom: Math.max(insets.bottom, 12) + 8,
  };

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={[styles.screen, pad]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            centered && styles.centeredContent,
            style,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.screen, pad, style]}>{children}</View>;
}

export function HeroBand({ children }: { children: ReactNode }) {
  return <View style={styles.heroBand}>{children}</View>;
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.pressed,
        (disabled || busy) && styles.disabled,
      ]}
      disabled={disabled || busy}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.primaryText}>{busy ? "…" : label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

export function LangToggle({
  label,
  onPress,
  tone = "dark",
}: {
  label: string;
  onPress: () => void;
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.langChip,
        light && styles.langChipLight,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.langChipText, light && styles.langChipTextLight]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionTile({
  title,
  subtitle,
  onPress,
  tone = "primary",
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: "primary" | "secondary";
}) {
  const primary = tone === "primary";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.tile,
        primary ? styles.tilePrimary : styles.tileSecondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.tileTitle, primary && styles.tileTitleOn]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.tileSub, primary && styles.tileSubOn]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  centeredContent: {
    justifyContent: "center",
  },
  heroBand: {
    backgroundColor: colors.bgDeep,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.bgDeep,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primary: {
    backgroundColor: colors.cta,
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: colors.ctaInk,
    fontWeight: "800",
    fontSize: type.body,
    letterSpacing: 0.2,
  },
  secondary: {
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.accentDark,
    fontWeight: "800",
    fontSize: type.body,
  },
  ghost: {
    backgroundColor: colors.chip,
    borderRadius: 999,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghostText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: type.label,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  link: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: type.label,
  },
  langChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  langChipLight: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  langChipText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  langChipTextLight: {
    color: colors.accentDark,
  },
  tile: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
    minHeight: 104,
    justifyContent: "center",
    gap: 8,
  },
  tilePrimary: {
    backgroundColor: colors.bgDeep,
  },
  tileSecondary: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.ink,
  },
  tileTitleOn: {
    color: "#fff",
  },
  tileSub: {
    fontSize: type.label,
    color: colors.muted,
    lineHeight: 18,
  },
  tileSubOn: {
    color: "rgba(255,255,255,0.72)",
  },
});
