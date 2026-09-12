import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PaywallScreenProps } from "../navigation";

const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_RC_ENTITLEMENT ?? "premium";
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";
const GENERIC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "";

const BENEFITS = [
  "3-day free trial — cancel anytime",
  "Weekly studio access after trial",
  "Identity-locked, photoreal headshots",
  "Corporate, Editorial & Dating looks",
  "2× high-res upscale, ready to share",
];

let purchasesConfigured = false;

function apiKeyForPlatform(): string {
  if (Platform.OS === "ios") return IOS_KEY || GENERIC_KEY;
  if (Platform.OS === "android") return ANDROID_KEY || GENERIC_KEY;
  return GENERIC_KEY;
}

function hasActiveEntitlement(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

function pickWeeklyPackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  if (offering.weekly) return offering.weekly;
  return (
    offering.availablePackages.find(
      (pkg) =>
        pkg.packageType === PACKAGE_TYPE.WEEKLY ||
        pkg.identifier.toLowerCase().includes("week")
    ) ?? offering.availablePackages[0] ?? null
  );
}

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const { imageUri, stylePreset } = route.params;
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [weekly, setWeekly] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goToResult = useCallback(() => {
    navigation.replace("Result", { imageUri, stylePreset });
  }, [imageUri, navigation, stylePreset]);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (Platform.OS === "web") {
        setLoading(false);
        setError("Subscriptions are available on iOS and Android.");
        return;
      }

      const apiKey = apiKeyForPlatform();
      if (!apiKey) {
        setError("test_srkPAJCWlPAgYFrzdQzJhCuXkBA.");
        setLoading(false);
        return;
      }

      try {
        if (!purchasesConfigured) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
          Purchases.configure({ apiKey });
          purchasesConfigured = true;
        }

        const info = await Purchases.getCustomerInfo();
        if (hasActiveEntitlement(info)) {
          goToResult();
          return;
        }

        const offerings = await Purchases.getOfferings();
        const pkg = pickWeeklyPackage(offerings.current);
        if (!cancelled) {
          setWeekly(pkg);
          if (!pkg) setError("No weekly plan is configured in RevenueCat yet.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load plans.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [goToResult]);

  const purchase = async () => {
    if (!weekly) {
      Alert.alert("Unavailable", error ?? "Weekly plan is not ready.");
      return;
    }

    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(weekly);
      if (hasActiveEntitlement(customerInfo) || Object.keys(customerInfo.entitlements.active).length) {
        goToResult();
        return;
      }
      Alert.alert("Purchase incomplete", "No active studio entitlement was found.");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "PURCHASE_CANCELLED" || code === "1") return;
      Alert.alert("Purchase failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      if (hasActiveEntitlement(info) || Object.keys(info.entitlements.active).length) {
        goToResult();
        return;
      }
      Alert.alert("No subscription found", "We couldn't find a previous purchase on this account.");
    } catch (err) {
      Alert.alert("Restore failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const priceLabel = weekly?.product.priceString ?? "—";
  const trialHighlight =
    weekly?.product.introPrice?.periodNumberOfUnits === 3
      ? `${weekly.product.introPrice.periodNumberOfUnits}-day free trial`
      : "3-day free trial";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>Back</Text>
        </Pressable>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{trialHighlight.toUpperCase()}</Text>
        </View>

        <Text style={styles.title}>Unlock your studio look.</Text>
        <Text style={styles.subtitle}>
          Start with a 3-day free trial. Then just {priceLabel} per week. Cancel anytime.
        </Text>

        <View style={styles.card}>
          <Text style={styles.planKicker}>WEEKLY STUDIO ACCESS</Text>
          <Text style={styles.planPrice}>{priceLabel}</Text>
          <Text style={styles.planMeta}>after your 3-day free trial</Text>
          {BENEFITS.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <Text style={styles.bullet}>✦</Text>
              <Text style={styles.benefit}>{item}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#D4AF77" style={{ marginTop: 28 }} />
        ) : (
          <Pressable
            style={[styles.cta, purchasing && styles.ctaDisabled]}
            onPress={purchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#14110C" />
            ) : (
              <Text style={styles.ctaText}>Start 3-day free trial</Text>
            )}
          </Pressable>
        )}

        <Pressable onPress={restore} disabled={purchasing} style={styles.restore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {__DEV__ ? (
          <Pressable onPress={goToResult} style={styles.devSkip}>
            <Text style={styles.devSkipText}>Continue without purchase (dev)</Text>
          </Pressable>
        ) : null}

        <Text style={styles.legal}>
          Payment is charged to your store account at the end of the trial unless you cancel at
          least 24 hours before it ends. Subscriptions renew weekly until cancelled in your
          account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#08080A" },
  content: { padding: 24, paddingBottom: 48 },
  back: { color: "#9A948A", fontSize: 16, marginBottom: 18 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#2A2114",
    borderColor: "#D4AF77",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: { color: "#D4AF77", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#F5F1EA", fontSize: 34, fontWeight: "800", lineHeight: 40 },
  subtitle: { color: "#9A948A", fontSize: 16, marginTop: 12, lineHeight: 22 },
  card: {
    marginTop: 28,
    backgroundColor: "#141418",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#D4AF77",
  },
  planKicker: { color: "#D4AF77", letterSpacing: 1.4, fontSize: 12, fontWeight: "700" },
  planPrice: { color: "#F5F1EA", fontSize: 36, fontWeight: "800", marginTop: 8 },
  planMeta: { color: "#9A948A", marginBottom: 18, marginTop: 4 },
  benefitRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  bullet: { color: "#D4AF77", fontSize: 14 },
  benefit: { color: "#F5F1EA", flex: 1, lineHeight: 20 },
  cta: {
    marginTop: 28,
    backgroundColor: "#D4AF77",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: "#14110C", fontWeight: "800", fontSize: 16 },
  restore: { marginTop: 16, alignItems: "center" },
  restoreText: { color: "#C8B89A", fontWeight: "600" },
  error: { color: "#E8A0A0", textAlign: "center", marginTop: 16, lineHeight: 20 },
  devSkip: { marginTop: 20, alignItems: "center" },
  devSkipText: { color: "#6E6A64", fontSize: 13 },
  legal: { color: "#6E6A64", fontSize: 11, lineHeight: 16, marginTop: 24, textAlign: "center" },
});
