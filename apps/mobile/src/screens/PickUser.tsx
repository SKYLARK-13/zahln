import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Copy } from "../i18n";
import { loginErrorMessage, useSession } from "../session";
import { colors, type } from "../theme";
import { Card, HeroBand, LangToggle, PrimaryButton, Screen } from "../ui";

type Mode = "student" | "till";

const studentUsers = [
  { username: "student", labelKey: "student" as const },
  { username: "staff", labelKey: "staff" as const },
  { username: "guest", labelKey: "guest" as const },
];

const tillUsers = [
  { username: "cashier-campus-1", labelKey: "cashierCampus1" as const },
  { username: "cashier-nord-1", labelKey: "cashierNord1" as const },
  { username: "cashier-bibliothek-1", labelKey: "cashierBib1" as const },
];

type Props = {
  t: Copy;
  onToggleLocale: () => void;
};

export function PickUserScreen({ t, onToggleLocale }: Props) {
  const { login } = useSession();
  const [mode, setMode] = useState<Mode>("student");
  const [username, setUsername] = useState("student");
  const [candidateId, setCandidateId] = useState(
    process.env.EXPO_PUBLIC_CANDIDATE_ID || "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const users = mode === "student" ? studentUsers : tillUsers;

  function pickMode(next: Mode) {
    setMode(next);
    setUsername(next === "student" ? "student" : "cashier-campus-1");
  }

  async function onContinue() {
    setBusy(true);
    setError("");
    try {
      await login({
        username,
        password: "test1234",
        candidateId: candidateId.trim(),
      });
    } catch (err) {
      setError(loginErrorMessage(err, t.errorGeneric, t.errorLogin));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <HeroBand>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{t.appName}</Text>
            <Text style={styles.brandSub}>Campus payments</Text>
          </View>
          <LangToggle label={t.lang} onPress={onToggleLocale} />
        </View>
        <Text style={styles.heroTitle}>{t.pickModeTitle}</Text>
        <Text style={styles.heroHint}>{t.pickModeHint}</Text>
      </HeroBand>

      <View style={styles.modeRow}>
        <Pressable
          style={[styles.mode, mode === "student" && styles.modeOn]}
          onPress={() => pickMode("student")}
          accessibilityRole="button"
        >
          <Text style={[styles.modeText, mode === "student" && styles.modeTextOn]}>
            {t.modeStudent}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.mode, mode === "till" && styles.modeOn]}
          onPress={() => pickMode("till")}
          accessibilityRole="button"
        >
          <Text style={[styles.modeText, mode === "till" && styles.modeTextOn]}>
            {t.modeTill}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.section}>
        {mode === "student" ? t.pickTitle : t.pickTillTitle}
      </Text>
      <Text style={styles.hint}>
        {mode === "student" ? t.pickHint : t.pickTillHint}
      </Text>

      <Card style={styles.card}>
        <View style={styles.chooser}>
          {users.map((user) => {
            const selected = username === user.username;
            return (
              <Pressable
                key={user.username}
                style={[styles.option, selected && styles.optionOn]}
                onPress={() => setUsername(user.username)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.optionText, selected && styles.optionTextOn]}>
                  {t[user.labelKey]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t.candidateId}</Text>
        <TextInput
          value={candidateId}
          onChangeText={setCandidateId}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          placeholder="c_…"
          placeholderTextColor={colors.muted}
          accessibilityLabel={t.candidateId}
        />
        <Text style={styles.fieldHint}>{t.candidateHint}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={t.continue}
          busy={busy}
          disabled={!candidateId.trim()}
          onPress={() => void onContinue()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  brand: {
    fontSize: type.brand,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
  },
  brandSub: {
    marginTop: 4,
    color: colors.cta,
    fontWeight: "700",
    fontSize: type.label,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroHint: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 20,
    fontSize: 14,
  },
  section: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 6,
  },
  hint: {
    color: colors.muted,
    marginBottom: 14,
    lineHeight: 20,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  mode: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: colors.paper,
  },
  modeOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  modeText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 14,
  },
  modeTextOn: {
    color: colors.accentDark,
    fontWeight: "900",
  },
  card: {
    gap: 14,
    marginBottom: 24,
  },
  chooser: {
    gap: 10,
  },
  option: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 14,
    backgroundColor: colors.paper,
  },
  optionOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  optionTextOn: {
    color: colors.accentDark,
    fontWeight: "800",
  },
  label: {
    color: colors.muted,
    fontSize: type.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.ink,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  fieldHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: -6,
    lineHeight: 16,
  },
  error: {
    color: colors.danger,
    fontWeight: "700",
  },
});
