import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Copy } from "../i18n";
import { loginErrorMessage, useSession } from "../session";
import { colors } from "../theme";

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
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>{t.appName}</Text>
        <Pressable onPress={onToggleLocale} accessibilityRole="button">
          <Text style={styles.lang}>{t.lang}</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{t.pickTitle}</Text>
      <Text style={styles.hint}>{t.pickHint}</Text>

      <View style={styles.list}>
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

      <Pressable
        style={[styles.primary, (!candidateId.trim() || busy) && styles.disabled]}
        disabled={!candidateId.trim() || busy}
        onPress={() => void onContinue()}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>{t.continue}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
  },
  lang: {
    color: colors.accent,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 8,
  },
  hint: {
    color: colors.muted,
    marginBottom: 20,
  },
  list: {
    gap: 10,
    marginBottom: 20,
  },
  option: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
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
    fontWeight: "600",
    color: colors.accent,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    color: colors.ink,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
  primary: {
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
});
