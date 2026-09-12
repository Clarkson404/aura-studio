import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { StylePreset } from "./services/api";

export type RootStackParamList = {
  Home: undefined;
  Paywall: { imageUri: string; stylePreset: StylePreset };
  Result: { imageUri: string; stylePreset: StylePreset };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;
export type PaywallScreenProps = NativeStackScreenProps<RootStackParamList, "Paywall">;
export type ResultScreenProps = NativeStackScreenProps<RootStackParamList, "Result">;
