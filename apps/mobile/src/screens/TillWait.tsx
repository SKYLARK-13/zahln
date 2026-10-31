import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { isApiError, newerByVersion, type Order } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { localize, money } from "../format";
import type { Copy, Locale } from "../i18n";
import { useSession } from "../session";
import { colors, type } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

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
        setError("");

        // keep polling while this screen is open — leaving for a new order is fine
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
  const waiting = !order || order.status === "open" || order.status === "paying";

  return (
    <Screen scroll>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      <Text style={styles.title}>{t.till}</Text>
      {order ? (
        <Text style={styles.muted}>
          {order.mensa.name} · {order.till.name}
        </Text>
      ) : null}

      <Card style={styles.qrCard}>
        {!order ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : (
          <>
            <View style={styles.qrFrame}>
              <QRCode value={order.qrPayload} size={220} />
            </View>
            <Text style={styles.orderId} selectable>
              {order.id}
            </Text>
            {waiting ? <Text style={styles.keep}>{t.keepShowingQr}</Text> : null}
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
            <Text style={styles.priceLine}>
              {t.student}: {money(order.amounts.student, locale)} · {t.staff}:{" "}
              {money(order.amounts.staff, locale)} · {t.guest}:{" "}
              {money(order.amounts.guest, locale)}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card style={[styles.statusCard, paid && styles.statusOk, expired && styles.statusBad]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {waiting ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.waiting}>{t.waitingPay}</Text>
          </View>
        ) : null}
        {paid ? <Text style={styles.ok}>{t.paidOk}</Text> : null}
        {expired ? <Text style={styles.error}>{t.statusExpired}</Text> : null}
        {order ? (
          <Text style={styles.statusLabel}>
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

      {waiting ? <Text style={styles.leaveHint}>{t.leaveQrHint}</Text> : null}

      <PrimaryButton label={t.newOrder} onPress={() => navigation.popToTop()} />
      {waiting ? (
        <View style={{ height: 10 }} />
      ) : null}
      {waiting ? (
        <SecondaryButton label={t.back} onPress={() => navigation.goBack()} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: type.title,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 12,
    letterSpacing: -0.4,
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 14,
  },
  qrCard: {
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
    paddingVertical: 22,
  },
  qrFrame: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  orderId: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  keep: {
    color: colors.accentDark,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 13,
  },
  summary: {
    marginBottom: 12,
    gap: 8,
  },
  item: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  priceLine: {
    color: colors.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  statusCard: {
    marginBottom: 12,
    gap: 8,
    backgroundColor: colors.warnSoft,
    borderColor: "#F0D48A",
  },
  statusOk: {
    backgroundColor: colors.okSoft,
    borderColor: "#A7F3D0",
  },
  statusBad: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FECDD3",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  waiting: {
    color: colors.warn,
    fontWeight: "800",
    fontSize: 16,
  },
  ok: {
    color: colors.ok,
    fontWeight: "800",
    fontSize: 20,
  },
  statusLabel: {
    color: colors.muted,
    fontWeight: "700",
  },
  leaveHint: {
    color: colors.muted,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
});
