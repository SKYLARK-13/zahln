import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
  // one key for this pay attempt — reused on every retry
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
      <View style={styles.screen}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t.back}</Text>
        </Pressable>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.back}>{t.back}</Text>
      </Pressable>

      <Text style={styles.title}>{t.confirmTitle}</Text>
      <Text style={styles.muted}>
        {t.mensa}: {order.mensa.name}
      </Text>
      <Text style={styles.muted}>
        {t.till}: {order.till.name}
      </Text>

      <Text style={styles.amount} accessibilityRole="header">
        {money(order.amountCents ?? 0, locale)}
      </Text>
      <Text style={styles.label}>{t.amount}</Text>

      <Text style={styles.section}>{t.items}</Text>
      {order.items.map((item) => (
        <Text key={item.itemId} style={styles.item}>
          {item.quantity}× {localize(item.name, locale)}
          {item.unitPriceCents != null
            ? ` · ${money(item.unitPriceCents * item.quantity, locale)}`
            : ""}
        </Text>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primary, busy && styles.disabled]}
        disabled={busy || order.status === "paid" || order.status === "expired"}
        onPress={() => void unlock()}
        accessibilityRole="button"
        accessibilityLabel={t.confirmPay}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>{t.confirmPay}</Text>
        )}
      </Pressable>

      <Modal visible={pinOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
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
              <Pressable onPress={() => setPinOpen(false)}>
                <Text style={styles.back}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={[styles.primary, styles.pinBtn, pin !== "1234" && styles.disabled]}
                disabled={pin !== "1234"}
                onPress={() => void pay()}
              >
                <Text style={styles.primaryText}>{t.continue}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  back: {
    color: colors.accent,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  muted: {
    color: colors.muted,
    marginBottom: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 20,
  },
  label: {
    color: colors.muted,
    marginBottom: 20,
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
    marginVertical: 12,
  },
  primary: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    letterSpacing: 8,
    fontSize: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  pinBtn: {
    marginTop: 0,
    paddingHorizontal: 20,
  },
});
