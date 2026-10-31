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
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen } from "../ui";

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
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const idempotencyKey = useRef(newIdempotencyKey()).current;

  useEffect(() => {
    let cancelled = false;
    client
      .getOrder(orderId)
      .then((next) => {
        if (!cancelled) setOrder((current) => newerByVersion(current, next));
      })
      .catch((err) => {
        if (!cancelled) setError(isApiError(err) ? err.message : t.errorGeneric);
      });
    return () => {
      cancelled = true;
    };
  }, [client, orderId, t.errorGeneric]);

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

  if (error && !order) {
    return (
      <Screen>
        <LinkButton label={t.back} onPress={() => navigation.goBack()} />
        <Text style={styles.error}>{error}</Text>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen>
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
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 16,
    marginBottom: 14,
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
    fontSize: 36,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 14,
  },
  label: {
    color: colors.muted,
  },
  section: {
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  item: {
    color: colors.ink,
    marginBottom: 6,
  },
  error: {
    color: colors.danger,
    marginVertical: 10,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    letterSpacing: 8,
    fontSize: 20,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
});
