import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home"> & {
  t: Copy;
  onToggleLocale: () => void;
};

export function HomeScreen({ navigation, t, onToggleLocale }: Props) {
  const { user, logout } = useSession();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t.appName}</Text>
          <Text style={styles.muted}>
            {t.homeHello}, {user?.displayName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onToggleLocale} accessibilityRole="button">
            <Text style={styles.link}>{t.lang}</Text>
          </Pressable>
          <Pressable onPress={() => void logout()} accessibilityRole="button">
            <Text style={styles.link}>{t.signOut}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.title}>{t.homeTitle}</Text>

      <Pressable
        style={styles.primary}
        onPress={() => navigation.navigate("Scan")}
        accessibilityRole="button"
        accessibilityLabel={t.scanPay}
      >
        <Text style={styles.primaryText}>{t.scanPay}</Text>
      </Pressable>

      <Pressable
        style={styles.secondary}
        onPress={() => navigation.navigate("History")}
        accessibilityRole="button"
        accessibilityLabel={t.history}
      >
        <Text style={styles.secondaryText}>{t.history}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    marginTop: 12,
  },
  headerActions: {
    gap: 12,
    alignItems: "flex-end",
  },
  brand: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
  },
  link: {
    color: colors.accent,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 24,
    color: colors.ink,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondary: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryText: {
    color: colors.ink,
    fontWeight: "600",
  },
});
