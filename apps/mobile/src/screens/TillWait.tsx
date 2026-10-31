import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { isApiError, newerByVersion, type Order } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { localize, money } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "TillWait"> & {
  t: Copy;
  locale: Locale;
};

export function TillWaitScreen({ navigation, route, t, locale }: Props) {
  const { orderId } = route.params;
  const { client } = useSession();
  const [order, setOrder] = useState<Order | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const next = await client.getOrder(orderId);
        if (cancelled) return;
        setOrder((current) => newerByVersion(current, next));

        // keep polling until paid or expired — never invent a result
        if (next.status === "open" || next.status === "paying") {
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
  }, [client, orderId, t.errorGeneric]);

  const paid = order?.status === "paid";
  const expired = order?.status === "expired";

  return (
    <Screen>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      <Text style={styles.title}>{t.till}</Text>
      {order ? (
        <Text style={styles.muted}>
          {order.mensa.name} · {order.till.name}
        </Text>
      ) : null}

      <Card style={styles.qrCard}>
        {!order ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <QRCode value={order.qrPayload} size={200} />
            <Text style={styles.orderId} selectable>
              {order.qrPayload}
            </Text>
          </>
        )}
      </Card>

      {order ? (
        <Card style={styles.summary}>
          {order.items.map((item) => (
            <Text key={item.itemId} style={styles.item}>
              {item.quantity}× {localize(item.name, locale)}
            </Text>
          ))}
          {order.amounts ? (
            <Text style={styles.muted}>
              {t.student}: {money(order.amounts.student, locale)} · {t.staff}:{" "}
              {money(order.amounts.staff, locale)} · {t.guest}:{" "}
              {money(order.amounts.guest, locale)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.statusCard}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!paid && !expired ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.waiting}>{t.waitingPay}</Text>
          </View>
        ) : null}
        {paid ? <Text style={styles.ok}>{t.paidOk}</Text> : null}
        {expired ? <Text style={styles.error}>{t.statusExpired}</Text> : null}
        {order ? (
          <Text style={styles.muted}>
            {order.status === "open"
              ? t.statusOpen
              : order.status === "paying"
                ? t.statusPaying
                : order.status === "paid"
                  ? t.statusPaid
                  : t.statusExpired}
          </Text>
        ) : null}
      </Card>

      <PrimaryButton label={t.newOrder} onPress={() => navigation.popToTop()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 12,
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  qrCard: {
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  orderId: {
    color: colors.muted,
    fontSize: 12,
  },
  summary: {
    marginBottom: 12,
    gap: 6,
  },
  item: {
    color: colors.ink,
  },
  statusCard: {
    marginBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waiting: {
    color: colors.warn,
    fontWeight: "600",
  },
  ok: {
    color: colors.ok,
    fontWeight: "700",
    fontSize: 18,
  },
  error: {
    color: colors.danger,
  },
});
