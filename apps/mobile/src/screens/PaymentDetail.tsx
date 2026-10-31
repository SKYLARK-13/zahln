import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, newerByVersion, type PaymentDetail as Detail } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { dateTime, localize, money, paymentStatus } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentDetail"> & {
  t: Copy;
  locale: Locale;
};

export function PaymentDetailScreen({ navigation, route, t, locale }: Props) {
  const { paymentId } = route.params;
  const { client } = useSession();
  const [payment, setPayment] = useState<Detail | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    client
      .getPayment(paymentId)
      .then((next) => {
        if (!cancelled) setPayment((current) => newerByVersion(current, next));
      })
      .catch((err) => {
        if (!cancelled) setError(isApiError(err) ? err.message : t.errorGeneric);
      });
    return () => {
      cancelled = true;
    };
  }, [client, paymentId, t.errorGeneric]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.back}>{t.back}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!payment && !error ? <ActivityIndicator color={colors.accent} /> : null}

      {payment ? (
        <View>
          <Text style={styles.amount}>{money(payment.amountCents, locale)}</Text>
          <Text style={styles.status}>{paymentStatus(payment.status, t)}</Text>
          <Text style={styles.muted}>
            {payment.mensa.name} · {payment.till.name}
          </Text>
          <Text style={styles.muted}>
            {t.created}: {dateTime(payment.createdAt, locale)}
          </Text>
          <Text style={styles.muted}>
            {t.order}: {payment.orderId}
          </Text>

          <Text style={styles.section}>{t.items}</Text>
          {payment.items.map((item) => (
            <Text key={item.itemId} style={styles.item}>
              {item.quantity}× {localize(item.name, locale)} ·{" "}
              {money(item.unitPriceCents * item.quantity, locale)}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },
  back: {
    color: colors.accent,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.ink,
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
    marginVertical: 6,
  },
  muted: {
    color: colors.muted,
    marginBottom: 4,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
    color: colors.ink,
  },
  item: {
    color: colors.ink,
    marginBottom: 6,
  },
  error: {
    color: colors.danger,
  },
});
