import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, type Payment } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { dateTime, money, paymentStatus } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, Screen } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "History"> & {
  t: Copy;
  locale: Locale;
};

export function HistoryScreen({ navigation, t, locale }: Props) {
  const { client } = useSession();
  const [items, setItems] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const page = await client.listPayments({ limit: 50 });
      setItems(page.items);
    } catch (err) {
      setError(isApiError(err) ? err.message : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }, [client, t.errorGeneric]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={styles.top}>
        <LinkButton label={t.back} onPress={() => navigation.goBack()} />
        <LinkButton label={t.refresh} onPress={() => void load()} />
      </View>

      <Text style={styles.title}>{t.history}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {busy && items.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          items.length === 0 ? styles.emptyWrap : undefined,
        ]}
        ListEmptyComponent={
          !busy ? <Text style={styles.muted}>{t.empty}</Text> : <View />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("PaymentDetail", { paymentId: item.id })
            }
            accessibilityRole="button"
          >
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.mensa.name}</Text>
                <Text style={styles.muted}>{dateTime(item.createdAt, locale)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.rowTitle}>{money(item.amountCents, locale)}</Text>
                <Text style={styles.muted}>{paymentStatus(item.status, t)}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  rowTitle: {
    color: colors.ink,
    fontWeight: "600",
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
