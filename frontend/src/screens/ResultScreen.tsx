import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import type { ResultScreenProps } from "../navigation";
import { generateHeadshot } from "../services/api";

export default function ResultScreen({ route, navigation }: ResultScreenProps) {
  const { imageUri, stylePreset } = route.params;
  const [loading, setLoading] = useState(true);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  useEffect(() => {
    const runGeneration = async () => {
      setLoading(true);
      const response = await generateHeadshot(imageUri, stylePreset);
      if (response.success && response.resultUrl) {
        setOutputImage(response.resultUrl);
      } else {
        Alert.alert("Processing Error", response.error || "Failed to render image", [
          { text: "Try Again", onPress: () => navigation.goBack() },
        ]);
      }
      setLoading(false);
    };

    void runGeneration();
  }, [imageUri, navigation, stylePreset]);

  const handleShare = async () => {
    if (!outputImage) return;
    try {
      const filename = `headshot-${Date.now()}.png`;
      const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!directory) throw new Error("Could not save photo");
      const localUri = `${directory}${filename}`;
      const { uri } = await FileSystem.downloadAsync(outputImage, localUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Success", "Image downloaded successfully!");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not save photo";
      Alert.alert("Error", message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingTitle}>Enhancing & Styling Face...</Text>
        <Text style={styles.loadingSubtitle}>
          Applying 8K studio lighting and photo parameters
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Studio Photo</Text>
      <View style={styles.imageFrame}>
        {outputImage && (
          <Image source={{ uri: outputImage }} style={styles.resultImage} resizeMode="cover" />
        )}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.secondaryBtnText}>Create Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
          <Text style={styles.primaryBtnText}>Save / Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090B", padding: 24, justifyContent: "center" },
  centerContainer: {
    flex: 1,
    backgroundColor: "#09090B",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingTitle: { color: "#FFF", fontSize: 20, fontWeight: "700", marginTop: 24 },
  loadingSubtitle: { color: "#A1A1AA", fontSize: 14, marginTop: 8, textAlign: "center" },
  header: { fontSize: 28, fontWeight: "800", color: "#FFF", textAlign: "center", marginBottom: 24 },
  imageFrame: {
    width: "100%",
    height: 420,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#18181B",
  },
  resultImage: { width: "100%", height: "100%" },
  buttonRow: { flexDirection: "row", marginTop: 24, justifyContent: "space-between" },
  primaryButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#27272A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginRight: 8,
  },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  secondaryBtnText: { color: "#E4E4E7", fontWeight: "600", fontSize: 16 },
});
