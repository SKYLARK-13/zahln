import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, newerByVersion, type PaymentDetail } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { money } from "../format";
import type { Copy, Locale } from "../i18n";
import { newIdempotencyKey } from "../qr";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "TillRefund"> & {
  t: Copy;
  locale: Locale;
};

export function TillRefundScreen({ navigation, route, t, locale }: Props) {
  const { paymentId } = route.params;
  const { client } = useSession();
  const [payment, setPayment] = useState<PaymentDetail | undefined>();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef(newIdempotencyKey("refund"));

  useEffect(() => {
    let cancelled = false;
    client
      .getPayment(paymentId)
      .then((next) => {
        if (cancelled) return;
        setPayment((current) => newerByVersion(current, next));
        setAmount(String(next.refundableAmountCents));
      })
      .catch((err) => {
        if (!cancelled) setError(isApiError(err) ? err.message : t.errorGeneric);
      });
    return () => {
      cancelled = true;
    };
  }, [client, paymentId, t.errorGeneric]);

  async function onRefund() {
    const amountCents = Number(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError(t.errorGeneric);
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      await client.createRefund(
        paymentId,
        amountCents,
        key.current,
        reason.trim() || undefined,
      );
      setInfo(t.refundDone);
      // new key only after a finished intent — retries keep the same key
      key.current = newIdempotencyKey("refund");
      const fresh = await client.getPayment(paymentId);
      setPayment((current) => newerByVersion(current, fresh));
      setAmount(String(fresh.refundableAmountCents));
    } catch (err) {
      // show API message (e.g. refund_exceeds_payment, refund_window_closed)
      setError(isApiError(err) ? err.message : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (!payment && !error) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      {payment ? (
        <>
          <Text style={styles.title}>{money(payment.amountCents, locale)}</Text>
          <Text style={styles.muted}>
            {payment.payer.displayName} · {payment.mensa.name}
          </Text>

          <Card style={styles.card}>
            <Text style={styles.muted}>
              {t.refundable}: {money(payment.refundableAmountCents, locale)}
            </Text>
            <Text style={styles.label}>{t.refundAmount}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              style={styles.input}
              accessibilityLabel={t.refundAmount}
            />
            <Text style={styles.label}>{t.refundReason}</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              accessibilityLabel={t.refundReason}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.ok}>{info}</Text> : null}
            <PrimaryButton
              label={t.refund}
              busy={busy}
              disabled={payment.refundableAmountCents <= 0}
              onPress={() => void onRefund()}
            />
          </Card>
        </>
      ) : (
        <Text style={styles.error}>{error}</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 12,
  },
  muted: {
    color: colors.muted,
    marginBottom: 12,
  },
  card: {
    gap: 10,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    color: colors.ink,
  },
  error: {
    color: colors.danger,
  },
  ok: {
    color: colors.ok,
    fontWeight: "600",
  },
});
