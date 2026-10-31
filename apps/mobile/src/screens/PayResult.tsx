import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, newerByVersion, type Payment } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { money, paymentStatus } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, PrimaryButton, Screen } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "PayResult"> & {
  t: Copy;
  locale: Locale;
};

export function PayResultScreen({ navigation, route, t, locale }: Props) {
  const { paymentId } = route.params;
  const { client } = useSession();
  const [payment, setPayment] = useState<Payment | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const next = await client.getPayment(paymentId);
        if (cancelled) return;
        setPayment((current) => newerByVersion(current, next));

        if (next.status === "pending") {
          timer = setTimeout(() => {
            void poll();
          }, 1500);
        }
      } catch (err) {
        if (cancelled) return;
        setError(isApiError(err) ? err.message : t.errorGeneric);
        timer = setTimeout(() => {
          void poll();
        }, 2000);
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [client, paymentId, t.errorGeneric]);

  const status = payment?.status;
  const statusColor =
    status === "confirmed" ? colors.ok : status === "declined" ? colors.danger : colors.warn;

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>{t.resultTitle}</Text>

      {!payment && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.muted}>{t.checking}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {payment ? (
        <Card style={styles.card}>
          <Text style={[styles.status, { color: statusColor }]}>
            {paymentStatus(payment.status, t)}
          </Text>
          {payment.status === "pending" ? (
            <Text style={styles.muted}>{t.checking}</Text>
          ) : null}
          <Text style={styles.amount}>{money(payment.amountCents, locale)}</Text>
          <Text style={styles.muted}>
            {payment.mensa.name} · {payment.till.name}
          </Text>
        </Card>
      ) : null}

      <View style={styles.footer}>
        <PrimaryButton label={t.done} onPress={() => navigation.popToTop()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 20,
    textAlign: "center",
  },
  center: {
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    alignItems: "center",
    marginBottom: 24,
  },
  status: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.ink,
    marginVertical: 8,
  },
  muted: {
    color: colors.muted,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    marginBottom: 16,
  },
  footer: {
    marginTop: 8,
  },
});
