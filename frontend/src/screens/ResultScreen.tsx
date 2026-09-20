import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ResultScreenProps } from "../navigation";
import { generateHeadshot } from "../services/api";
import { saveToPhotoLibrary } from "../utils/saveToPhotoLibrary";

const STAGES = [
  "Reading your likeness…",
  "Lighting the studio…",
  "Rendering your look…",
  "Upscaling to high-res…",
];

export default function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { imageUri, stylePreset } = route.params;
  const [stageIndex, setStageIndex] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!busy || resultUrl) return;
    const timer = setInterval(() => {
      setStageIndex((current) => (current + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [busy, resultUrl]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await generateHeadshot(imageUri, stylePreset);
        setResultUrl(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed.");
      } finally {
        setBusy(false);
      }
    };

    void run();
  }, [imageUri, stylePreset]);

  const retry = () => {
    started.current = false;
    setResultUrl(null);
    setError(null);
    setBusy(true);
    setStageIndex(0);
    started.current = true;
    void generateHeadshot(imageUri, stylePreset)
      .then((result) => setResultUrl(result.url))
      .catch((err) => setError(err instanceof Error ? err.message : "Generation failed."))
      .finally(() => setBusy(false));
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    try {
      setSaving(true);

      if (Platform.OS === "web") {
        await saveToPhotoLibrary(resultUrl);
        Alert.alert("Success", "Image downloaded successfully!");
        return;
      }

      const filename = `headshot-${Date.now()}.png`;
      const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!directory) throw new Error("Could not save photo");
      const localUri = `${directory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(resultUrl, localUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Success", "Image downloaded successfully!");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save photo";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.popToTop()} hitSlop={12}>
          <Text style={styles.back}>Home</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {stylePreset.charAt(0).toUpperCase() + stylePreset.slice(1)}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.frame}>
        {resultUrl ? (
          <Image source={{ uri: resultUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.processing}>
            <ActivityIndicator size="large" color="#D4AF77" />
            <Text style={styles.stage}>{error ? "Something went wrong" : STAGES[stageIndex]}</Text>
            <Text style={styles.stageHint}>
              {error ?? "This usually takes about a minute. Keep the app open."}
            </Text>
          </View>
        )}
      </View>

      {resultUrl ? (
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={handleShare} disabled={saving}>
            <Text style={styles.primaryText}>{saving ? "Working…" : "Save"}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={handleShare} disabled={saving}>
            <Text style={styles.secondaryText}>Share</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          {error ? (
            <Pressable style={styles.primary} onPress={retry}>
              <Text style={styles.primaryText}>Try again</Text>
            </Pressable>
          ) : (
            <View style={styles.waitingBar}>
              <Text style={styles.waitingText}>Generating high-res portrait</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#08080A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  back: { color: "#D4AF77", fontSize: 16, width: 48 },
  headerTitle: { color: "#F5F1EA", fontSize: 16, fontWeight: "700" },
  frame: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#121214",
    borderWidth: 1,
    borderColor: "#2A2722",
  },
  image: { width: "100%", height: "100%" },
  processing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  stage: {
    color: "#F5F1EA",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },
  stageHint: {
    color: "#9A948A",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
  },
  primary: {
    flex: 1,
    backgroundColor: "#D4AF77",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { color: "#14110C", fontWeight: "800", fontSize: 16 },
  secondary: {
    flex: 1,
    borderColor: "#D4AF77",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryText: { color: "#D4AF77", fontWeight: "800", fontSize: 16 },
  waitingBar: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  waitingText: { color: "#9A948A" },
});
