import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { copy, type Locale } from "./src/i18n";
import type { RootStackParamList } from "./src/navigation";
import { ConfirmPayScreen } from "./src/screens/ConfirmPay";
import { HistoryScreen } from "./src/screens/History";
import { HomeScreen } from "./src/screens/Home";
import { PaymentDetailScreen } from "./src/screens/PaymentDetail";
import { PayResultScreen } from "./src/screens/PayResult";
import { PickUserScreen } from "./src/screens/PickUser";
import { ScanScreen } from "./src/screens/Scan";
import { TillHomeScreen } from "./src/screens/TillHome";
import { TillRefundScreen } from "./src/screens/TillRefund";
import { TillRefundsScreen } from "./src/screens/TillRefunds";
import { TillWaitScreen } from "./src/screens/TillWait";
import { SessionProvider, useSession } from "./src/session";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const [locale, setLocale] = useState<Locale>("de");
  const t = copy[locale];
  const { ready, user } = useSession();
  const isTill = user?.role === "cashier";

  function toggleLocale() {
    setLocale((current) => (current === "de" ? "en" : "de"));
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="PickUser">
            {(props) => (
              <PickUserScreen {...props} t={t} onToggleLocale={toggleLocale} />
            )}
          </Stack.Screen>
        ) : isTill ? (
          <>
            <Stack.Screen name="TillHome">
              {(props) => (
                <TillHomeScreen
                  {...props}
                  t={t}
                  locale={locale}
                  onToggleLocale={toggleLocale}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="TillWait">
              {(props) => <TillWaitScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="TillRefunds">
              {(props) => <TillRefundsScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="TillRefund">
              {(props) => <TillRefundScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Home">
              {(props) => (
                <HomeScreen {...props} t={t} onToggleLocale={toggleLocale} />
              )}
            </Stack.Screen>
            <Stack.Screen name="Scan">
              {(props) => <ScanScreen {...props} t={t} />}
            </Stack.Screen>
            <Stack.Screen name="ConfirmPay">
              {(props) => <ConfirmPayScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="PayResult">
              {(props) => <PayResultScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="History">
              {(props) => <HistoryScreen {...props} t={t} locale={locale} />}
            </Stack.Screen>
            <Stack.Screen name="PaymentDetail">
              {(props) => (
                <PaymentDetailScreen {...props} t={t} locale={locale} />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
