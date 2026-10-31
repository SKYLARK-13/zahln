import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, newerByVersion, type Order } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { money, localize } from "../format";
import type { Copy, Locale } from "../i18n";
import { newIdempotencyKey } from "../qr";
import { useSession } from "../session";
import { colors, type } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "ConfirmPay"> & {
  t: Copy;
  locale: Locale;
};

export function ConfirmPayScreen({ navigation, route, t, locale }: Props) {
  const { orderId } = route.params;
  const { client } = useSession();
  const [order, setOrder] = useState<Order | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const idempotencyKey = useRef(newIdempotencyKey()).current;

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const next = await client.getOrder(orderId);
      setOrder((current) => newerByVersion(current, next));
    } catch (err) {
      const notFound =
        isApiError(err) && (err.status === 404 || /not found/i.test(err.message));
      setError(notFound ? t.orderNotFound : isApiError(err) ? err.message : t.errorGeneric);
      setOrder(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, orderId]);

  async function unlock() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.confirmPay,
        cancelLabel: t.cancel,
        fallbackLabel: "PIN",
      });
      if (result.success) {
        await pay();
        return;
      }
    }

    setPinOpen(true);
  }

  async function pay() {
    if (!order?.amountCents) {
      setError(t.errorGeneric);
      return;
    }

    setBusy(true);
    setError("");
    setPinOpen(false);

    try {
      const payment = await client.createPayment(
        order.id,
        order.amountCents,
        idempotencyKey,
      );
      navigation.replace("PayResult", { paymentId: payment.id });
    } catch (err) {
      setError(isApiError(err) ? err.message : t.errorGeneric);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (error && !order) {
    return (
      <Screen scroll>
        <LinkButton label={t.back} onPress={() => navigation.goBack()} />
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t.confirmTitle}</Text>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.muted}>
            {t.order}: {orderId}
          </Text>
          <PrimaryButton label={t.tryAgain} onPress={() => void loadOrder()} />
          <SecondaryButton label={t.back} onPress={() => navigation.goBack()} />
        </Card>
      </Screen>
    );
  }

  if (!order) return null;

  return (
    <Screen scroll>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      <Text style={styles.title}>{t.confirmTitle}</Text>

      <Card style={styles.summary}>
        <Text style={styles.muted}>
          {t.mensa}: {order.mensa.name}
        </Text>
        <Text style={styles.muted}>
          {t.till}: {order.till.name}
        </Text>
        <Text style={styles.amount}>{money(order.amountCents ?? 0, locale)}</Text>
        <Text style={styles.label}>{t.amount}</Text>
      </Card>

      <Card style={styles.items}>
        <Text style={styles.section}>{t.items}</Text>
        {order.items.map((item) => (
          <Text key={item.itemId} style={styles.item}>
            {item.quantity}× {localize(item.name, locale)}
            {item.unitPriceCents != null
              ? ` · ${money(item.unitPriceCents * item.quantity, locale)}`
              : ""}
          </Text>
        ))}
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <PrimaryButton
          label={t.confirmPay}
          busy={busy}
          disabled={order.status === "paid" || order.status === "expired"}
          onPress={() => void unlock()}
        />
      </View>

      <Modal visible={pinOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Card style={styles.modal}>
            <Text style={styles.section}>{t.pinTitle}</Text>
            <Text style={styles.muted}>{t.pinHint}</Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={styles.input}
              accessibilityLabel={t.pinTitle}
            />
            <View style={styles.row}>
              <LinkButton label={t.cancel} onPress={() => setPinOpen(false)} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <PrimaryButton
                  label={t.continue}
                  disabled={pin !== "1234"}
                  onPress={() => void pay()}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: type.title,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 16,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  summary: {
    marginBottom: 12,
  },
  items: {
    marginBottom: 12,
  },
  muted: {
    color: colors.muted,
    marginBottom: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 14,
    letterSpacing: -0.8,
  },
  label: {
    color: colors.muted,
    fontWeight: "600",
  },
  section: {
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 8,
    fontSize: type.section,
  },
  item: {
    color: colors.ink,
    marginBottom: 8,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    marginVertical: 10,
    fontWeight: "600",
    lineHeight: 20,
  },
  errorCard: {
    marginTop: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  footer: {
    marginTop: 12,
    paddingBottom: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(16,35,28,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    gap: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    letterSpacing: 8,
    fontSize: 22,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
