import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { orderIdFromQr } from "../qr";
import { colors } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

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
    <Screen>
      <LinkButton label={t.back} onPress={() => navigation.goBack()} />

      <Text style={styles.title}>{t.scanTitle}</Text>
      <Text style={styles.hint}>{t.scanHint}</Text>

      <Card style={styles.cameraCard}>
        {!permission?.granted ? (
          <View style={styles.permission}>
            <Text style={styles.muted}>{t.cameraDenied}</Text>
            <SecondaryButton label={t.continue} onPress={() => void requestPermission()} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => openOrder(data)}
          />
        )}
      </Card>

      <Card style={styles.manual}>
        <Text style={styles.label}>{t.enterOrder}</Text>
        <TextInput
          value={manualId}
          onChangeText={setManualId}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel={t.enterOrder}
        />
        <PrimaryButton
          label={t.openOrder}
          disabled={!manualId.trim()}
          onPress={() => openOrder(manualId)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 16,
  },
  hint: {
    color: colors.muted,
    marginBottom: 16,
    marginTop: 6,
  },
  cameraCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 14,
  },
  camera: {
    height: 260,
  },
  permission: {
    padding: 16,
    gap: 12,
  },
  muted: {
    color: colors.muted,
  },
  manual: {
    gap: 12,
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
});
