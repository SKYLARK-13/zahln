import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isApiError, type MenuItem, type Mensa } from "@zahln/api";
import type { RootStackParamList } from "../navigation";
import { localize, money } from "../format";
import type { Copy, Locale } from "../i18n";
import { newIdempotencyKey } from "../qr";
import { useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "TillHome"> & {
  t: Copy;
  locale: Locale;
  onToggleLocale: () => void;
};

type CartLine = { itemId: string; quantity: number };

export function TillHomeScreen({ navigation, t, locale, onToggleLocale }: Props) {
  const { user, client, logout } = useSession();
  const [mensa, setMensa] = useState<Mensa | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const orderKey = useRef(newIdempotencyKey("order"));

  useEffect(() => {
    let cancelled = false;
    client
      .listMensas()
      .then((page) => {
        if (cancelled) return;
        const match =
          page.items.find((item) => item.id === user?.mensaId) || page.items[0];
        setMensa(match || null);
      })
      .catch((err) => {
        if (!cancelled) setError(isApiError(err) ? err.message : t.errorGeneric);
      });
    return () => {
      cancelled = true;
    };
  }, [client, t.errorGeneric, user?.mensaId]);

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  function addItem(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id
            ? { ...line, quantity: Math.min(20, line.quantity + 1) }
            : line,
        );
      }
      return [...current, { itemId: item.id, quantity: 1 }];
    });
  }

  function clearCart() {
    setCart([]);
    orderKey.current = newIdempotencyKey("order");
  }

  async function createOrder() {
    if (cart.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const order = await client.createOrder(cart, orderKey.current);
      clearCart();
      navigation.navigate("TillWait", { orderId: order.id });
    } catch (err) {
      setError(isApiError(err) ? err.message : t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (!mensa) {
    return (
      <Screen style={styles.center}>
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.accent} />}
        <LinkButton label={t.signOut} onPress={() => void logout()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{t.appName}</Text>
          <Text style={styles.muted}>
            {mensa.name} · {user?.displayName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <LinkButton label={t.lang} onPress={onToggleLocale} />
          <LinkButton label={t.signOut} onPress={() => void logout()} />
        </View>
      </View>

      <Text style={styles.title}>{t.tillHomeTitle}</Text>
      <Text style={styles.hint}>{t.pricesHint}</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Card style={styles.menu}>
          {mensa.menu.map((item) => (
            <Pressable
              key={item.id}
              style={styles.menuRow}
              onPress={() => addItem(item)}
              accessibilityRole="button"
              accessibilityLabel={`${t.add} ${localize(item.name, locale)}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{localize(item.name, locale)}</Text>
                <Text style={styles.muted}>
                  {money(item.prices.student, locale)} / {money(item.prices.staff, locale)} /{" "}
                  {money(item.prices.guest, locale)}
                </Text>
              </View>
              <Text style={styles.add}>{t.add}</Text>
            </Pressable>
          ))}
        </Card>

        <Card style={styles.cart}>
          <Text style={styles.section}>
            {t.cart} ({cartCount})
          </Text>
          {cart.length === 0 ? (
            <Text style={styles.muted}>{t.empty}</Text>
          ) : (
            cart.map((line) => {
              const item = mensa.menu.find((entry) => entry.id === line.itemId);
              return (
                <Text key={line.itemId} style={styles.item}>
                  {line.quantity}× {item ? localize(item.name, locale) : line.itemId}
                </Text>
              );
            })
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={t.showQr}
            busy={busy}
            disabled={cart.length === 0}
            onPress={() => void createOrder()}
          />
        </Card>

        <SecondaryButton
          label={t.refunds}
          onPress={() => navigation.navigate("TillRefunds")}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerActions: {
    gap: 12,
    alignItems: "flex-end",
  },
  brand: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.ink,
  },
  hint: {
    color: colors.muted,
    marginBottom: 12,
    marginTop: 4,
  },
  menu: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTitle: {
    fontWeight: "600",
    color: colors.ink,
  },
  add: {
    color: colors.accent,
    fontWeight: "700",
  },
  cart: {
    gap: 10,
    marginBottom: 12,
  },
  section: {
    fontWeight: "600",
    color: colors.ink,
  },
  item: {
    color: colors.ink,
  },
  error: {
    color: colors.danger,
  },
});
