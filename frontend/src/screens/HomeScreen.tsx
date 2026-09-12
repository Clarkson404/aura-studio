import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import type { HomeScreenProps } from "../navigation";
import type { StylePreset } from "../services/api";

const STYLES: { key: StylePreset; label: string; caption: string }[] = [
  { key: "corporate", label: "Corporate", caption: "Boardroom-ready" },
  { key: "editorial", label: "Editorial", caption: "Magazine cover" },
  { key: "dating", label: "Dating", caption: "Warm & magnetic" },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stylePreset, setStylePreset] = useState<StylePreset>("corporate");

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        fromCamera
          ? "Camera access is required to take a selfie."
          : "Photo library access is required to choose a selfie."
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.9,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.9,
        });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onGenerate = () => {
    if (!imageUri) {
      Alert.alert("Add a selfie", "Take or choose a clear face photo first.");
      return;
    }
    navigation.navigate("Paywall", { imageUri, stylePreset });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>AURA STUDIO</Text>
        <Text style={styles.title}>Studio headshots from a selfie.</Text>
        <Text style={styles.subtitle}>
          Identity-locked portraits, finished with high-res upscaling.
        </Text>

        <View style={styles.previewWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderTitle}>Your selfie</Text>
              <Text style={styles.placeholderBody}>
                Face the camera, even lighting, no sunglasses.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.row}>
          <Pressable style={styles.secondaryBtn} onPress={() => pickImage(true)}>
            <Text style={styles.secondaryText}>Take selfie</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => pickImage(false)}>
            <Text style={styles.secondaryText}>Choose photo</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Style</Text>
        <View style={styles.chips}>
          {STYLES.map((style) => {
            const selected = style.key === stylePreset;
            return (
              <Pressable
                key={style.key}
                onPress={() => setStylePreset(style.key)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {style.label}
                </Text>
                <Text style={[styles.chipCaption, selected && styles.chipCaptionSelected]}>
                  {style.caption}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.cta} onPress={onGenerate}>
          <Text style={styles.ctaText}>Create my headshot</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#08080A" },
  content: { padding: 24, paddingBottom: 40 },
  kicker: {
    color: "#D4AF77",
    letterSpacing: 3,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  title: {
    color: "#F5F1EA",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  subtitle: {
    color: "#9A948A",
    fontSize: 16,
    marginTop: 10,
    lineHeight: 22,
  },
  previewWrap: {
    marginTop: 28,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2722",
    aspectRatio: 3 / 4,
    backgroundColor: "#121214",
  },
  preview: { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderTitle: { color: "#F5F1EA", fontSize: 18, fontWeight: "600" },
  placeholderBody: {
    color: "#9A948A",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  row: { flexDirection: "row", gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    borderColor: "#D4AF77",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { color: "#D4AF77", fontWeight: "600" },
  sectionLabel: {
    color: "#F5F1EA",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  chips: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    backgroundColor: "#141418",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#2A2722",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#1C1812",
    borderColor: "#D4AF77",
  },
  chipLabel: { color: "#F5F1EA", fontWeight: "700", fontSize: 13 },
  chipLabelSelected: { color: "#D4AF77" },
  chipCaption: { color: "#9A948A", fontSize: 11, marginTop: 4, textAlign: "center" },
  chipCaptionSelected: { color: "#C8B89A" },
  cta: {
    marginTop: 32,
    backgroundColor: "#D4AF77",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: { color: "#14110C", fontWeight: "800", fontSize: 16 },
});
