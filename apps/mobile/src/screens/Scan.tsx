import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { orderIdFromQr } from "../qr";
import { colors } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Scan"> & {
  t: Copy;
};

export function ScanScreen({ navigation, t }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState("");
  const [locked, setLocked] = useState(false);

  function openOrder(raw: string) {
    const orderId = orderIdFromQr(raw);
    if (!orderId || locked) return;
    setLocked(true);
    navigation.replace("ConfirmPay", { orderId });
  }

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.back}>{t.back}</Text>
      </Pressable>

      <Text style={styles.title}>{t.scanTitle}</Text>
      <Text style={styles.hint}>{t.scanHint}</Text>

      {!permission?.granted ? (
        <View style={styles.box}>
          <Text style={styles.muted}>{t.cameraDenied}</Text>
          <Pressable style={styles.secondary} onPress={() => void requestPermission()}>
            <Text style={styles.secondaryText}>{t.continue}</Text>
          </Pressable>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => openOrder(data)}
        />
      )}

      <Text style={styles.label}>{t.enterOrder}</Text>
      <TextInput
        value={manualId}
        onChangeText={setManualId}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        accessibilityLabel={t.enterOrder}
      />
      <Pressable
        style={[styles.primary, !manualId.trim() && styles.disabled]}
        disabled={!manualId.trim()}
        onPress={() => openOrder(manualId)}
        accessibilityRole="button"
      >
        <Text style={styles.primaryText}>{t.openOrder}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
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
  },
  hint: {
    color: colors.muted,
    marginBottom: 16,
  },
  camera: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  box: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  muted: {
    color: colors.muted,
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
    marginBottom: 12,
    color: colors.ink,
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
  secondary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
