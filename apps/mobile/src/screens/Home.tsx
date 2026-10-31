import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "Home"> & {
  t: Copy;
  onToggleLocale: () => void;
};

export function HomeScreen({ navigation, t, onToggleLocale }: Props) {
  const { user, logout } = useSession();

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t.appName}</Text>
          <Text style={styles.muted}>
            {t.homeHello}, {user?.displayName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <LinkButton label={t.lang} onPress={onToggleLocale} />
          <LinkButton label={t.signOut} onPress={() => void logout()} />
        </View>
      </View>

      <Text style={styles.title}>{t.homeTitle}</Text>

      <Card style={styles.card}>
        <Text style={styles.cardHint}>{t.scanHint}</Text>
        <PrimaryButton label={t.scanPay} onPress={() => navigation.navigate("Scan")} />
        <SecondaryButton label={t.history} onPress={() => navigation.navigate("History")} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  headerActions: {
    gap: 14,
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
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 16,
    color: colors.ink,
  },
  card: {
    gap: 12,
  },
  cardHint: {
    color: colors.muted,
    marginBottom: 4,
  },
});
