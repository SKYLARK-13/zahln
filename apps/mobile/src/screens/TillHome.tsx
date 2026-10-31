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

  function qtyFor(itemId: string) {
    return cart.find((line) => line.itemId === itemId)?.quantity ?? 0;
  }

  function setQty(itemId: string, quantity: number) {
    setCart((current) => {
      const next = current.filter((line) => line.itemId !== itemId);
      if (quantity <= 0) return next;
      return [...next, { itemId, quantity: Math.min(20, quantity) }];
    });
  }

  function addItem(item: MenuItem) {
    setQty(item.id, qtyFor(item.id) + 1);
  }

  function removeItem(itemId: string) {
    setQty(itemId, qtyFor(itemId) - 1);
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
        <View style={{ flex: 1, paddingRight: 12 }}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Card style={styles.menu}>
          {mensa.menu.map((item, index) => {
            const qty = qtyFor(item.id);
            return (
              <View
                key={item.id}
                style={[styles.menuRow, index === mensa.menu.length - 1 && styles.menuRowLast]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.rowTitle}>{localize(item.name, locale)}</Text>
                  <Text style={styles.priceLine}>
                    {money(item.prices.student, locale)} · {money(item.prices.staff, locale)} ·{" "}
                    {money(item.prices.guest, locale)}
                  </Text>
                </View>

                {qty === 0 ? (
                  <Pressable
                    style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                    onPress={() => addItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.add} ${localize(item.name, locale)}`}
                  >
                    <Text style={styles.addBtnText}>{t.add}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.stepper}>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                      onPress={() => removeItem(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t.remove}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{qty}</Text>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                      onPress={() => addItem(item)}
                      accessibilityRole="button"
                      accessibilityLabel={t.add}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        <Card style={styles.cart}>
          <Text style={styles.section}>
            {t.cart} · {cartCount}
          </Text>
          {cart.length === 0 ? (
            <Text style={styles.muted}>{t.empty}</Text>
          ) : (
            cart.map((line) => {
              const item = mensa.menu.find((entry) => entry.id === line.itemId);
              return (
                <View key={line.itemId} style={styles.cartRow}>
                  <Text style={styles.cartName}>
                    {item ? localize(item.name, locale) : line.itemId}
                  </Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                      onPress={() => removeItem(line.itemId)}
                      accessibilityRole="button"
                      accessibilityLabel={t.remove}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{line.quantity}</Text>
                    <Pressable
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                      onPress={() => setQty(line.itemId, line.quantity + 1)}
                      accessibilityRole="button"
                      accessibilityLabel={t.add}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
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
    fontWeight: "700",
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink,
  },
  hint: {
    color: colors.muted,
    marginBottom: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  menu: {
    marginBottom: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  rowTitle: {
    fontWeight: "700",
    color: colors.ink,
    fontSize: 16,
  },
  priceLine: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 84,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
    lineHeight: 22,
  },
  qty: {
    minWidth: 22,
    textAlign: "center",
    fontWeight: "700",
    color: colors.ink,
    fontSize: 16,
  },
  cart: {
    gap: 12,
    marginBottom: 12,
  },
  section: {
    fontWeight: "700",
    color: colors.ink,
    fontSize: 16,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cartName: {
    flex: 1,
    color: colors.ink,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.85,
  },
  error: {
    color: colors.danger,
  },
});
