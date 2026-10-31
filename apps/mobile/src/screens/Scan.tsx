import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import type { Copy } from "../i18n";
import { orderIdFromQr } from "../qr";
import { colors, type } from "../theme";
import { Card, LinkButton, PrimaryButton, Screen, SecondaryButton } from "../ui";

type Props = NativeStackScreenProps<RootStackParamList, "Scan"> & {
  t: Copy;
};

export function ScanScreen({ navigation, t }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState("");
  const locked = useRef(false);

  function openOrder(raw: string) {
    const orderId = orderIdFromQr(raw);
    if (!orderId || locked.current) return;
    locked.current = true;
    navigation.replace("ConfirmPay", { orderId });
  }

  return (
    <Screen scroll>
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
          placeholder="ord_…"
          placeholderTextColor={colors.muted}
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
    fontSize: type.title,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  hint: {
    color: colors.muted,
    marginBottom: 16,
    marginTop: 6,
    lineHeight: 20,
  },
  cameraCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 14,
  },
  camera: {
    height: 280,
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
    fontSize: type.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.ink,
    backgroundColor: "#fff",
    fontSize: 16,
  },
});
