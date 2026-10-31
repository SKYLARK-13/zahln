import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Copy } from "../i18n";
import { loginErrorMessage, useSession } from "../session";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen } from "../ui";

const users = [
  { username: "student", labelKey: "student" as const },
  { username: "staff", labelKey: "staff" as const },
  { username: "guest", labelKey: "guest" as const },
];

type Props = {
  t: Copy;
  onToggleLocale: () => void;
};

export function PickUserScreen({ t, onToggleLocale }: Props) {
  const { login } = useSession();
  const [username, setUsername] = useState("student");
  const [candidateId, setCandidateId] = useState(
    process.env.EXPO_PUBLIC_CANDIDATE_ID || "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>{t.appName}</Text>
        <LinkButton label={t.lang} onPress={onToggleLocale} />
      </View>

      <Text style={styles.title}>{t.pickTitle}</Text>
      <Text style={styles.hint}>{t.pickHint}</Text>

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
          accessibilityLabel={t.candidateId}
        />

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
  screen: {
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  hint: {
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    gap: 14,
  },
  chooser: {
    gap: 10,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  optionOn: {
    borderColor: colors.accent,
    backgroundColor: "#e7efe9",
  },
  optionText: {
    color: colors.ink,
    fontSize: 16,
  },
  optionTextOn: {
    color: colors.accent,
    fontWeight: "600",
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
    color: colors.ink,
    backgroundColor: "#fff",
  },
  error: {
    color: colors.danger,
  },
});
