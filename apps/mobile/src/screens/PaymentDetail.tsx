import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, newerByVersion, type PaymentDetail as Detail } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { dateTime, localize, money, paymentStatus } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, Screen } from "../ui";

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
    <Screen>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!payment && !error ? <ActivityIndicator color={colors.accent} /> : null}

        {payment ? (
          <>
            <Card style={styles.summary}>
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
            </Card>

            <Card style={styles.items}>
              <Text style={styles.section}>{t.items}</Text>
              {payment.items.map((item) => (
                <Text key={item.itemId} style={styles.item}>
                  {item.quantity}× {localize(item.name, locale)} ·{" "}
                  {money(item.unitPriceCents * item.quantity, locale)}
                </Text>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: 12,
  },
  items: {
    marginBottom: 12,
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
