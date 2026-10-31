import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { useSession } from "../session";
import { colors, type } from "../theme";
import { ActionTile, HeroBand, LangToggle, Screen } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "Home"> & {
  t: Copy;
  onToggleLocale: () => void;
};

export function HomeScreen({ navigation, t, onToggleLocale }: Props) {
  const { user, logout } = useSession();

  return (
    <Screen>
      <HeroBand>
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.brand}>{t.appName}</Text>
            <Text style={styles.hello}>
              {t.homeHello}, {user?.displayName}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <LangToggle label={t.lang} onPress={onToggleLocale} />
            <Text style={styles.signOut} onPress={() => void logout()}>
              {t.signOut}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>{t.homeTitle}</Text>
      </HeroBand>

      <View style={styles.actions}>
        <ActionTile
          tone="primary"
          title={t.scanPay}
          subtitle={t.homePaySub}
          onPress={() => navigation.navigate("Scan")}
        />
        <ActionTile
          tone="secondary"
          title={t.history}
          subtitle={t.homeHistorySub}
          onPress={() => navigation.navigate("History")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerActions: {
    gap: 12,
    alignItems: "flex-end",
  },
  brand: {
    fontSize: type.brand,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  hello: {
    color: "rgba(255,255,255,0.72)",
    marginTop: 4,
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.cta,
    letterSpacing: -0.6,
  },
  signOut: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    fontSize: 13,
  },
  actions: {
    gap: 14,
  },
});
