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
    <View style={styles.screen}>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>{t.back}</Text>
        </Pressable>
        <Pressable onPress={() => void load()} accessibilityRole="button">
          <Text style={styles.back}>{t.refresh}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{t.history}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {busy && items.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : undefined}
        ListEmptyComponent={
          !busy ? <Text style={styles.muted}>{t.empty}</Text> : <View />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("PaymentDetail", { paymentId: item.id })}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.mensa.name}</Text>
              <Text style={styles.muted}>{dateTime(item.createdAt, locale)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowTitle}>{money(item.amountCents, locale)}</Text>
              <Text style={styles.muted}>{paymentStatus(item.status, t)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  back: {
    color: colors.accent,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
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
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
