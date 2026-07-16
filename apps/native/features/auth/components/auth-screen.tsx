import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { SiagaButton } from "@/components/siaga-button";
import { SiagaScreen } from "@/components/siaga-screen";

import { useSignInMutation, useSignUpMutation } from "../api";
import { signInSchema, signUpSchema } from "../types";

interface AuthScreenProps {
  mode: "sign-in" | "sign-up";
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const signIn = useSignInMutation();
  const signUp = useSignUpMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isPending = signIn.isPending || signUp.isPending;

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      if (isSignUp) {
        const values = signUpSchema.safeParse({
          confirmPassword,
          email,
          name,
          password,
        });
        if (!values.success) {
          setError(
            values.error.issues[0]?.message ?? "Periksa kembali data akun."
          );
          return;
        }
        await signUp.mutateAsync(values.data);
      } else {
        const values = signInSchema.safeParse({ email, password });
        if (!values.success) {
          setError(
            values.error.issues[0]?.message ?? "Periksa kembali data akun."
          );
          return;
        }
        await signIn.mutateAsync(values.data);
      }
      router.replace("/");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Autentikasi gagal."
      );
    }
  }, [
    confirmPassword,
    email,
    isSignUp,
    name,
    password,
    router,
    signIn,
    signUp,
  ]);

  const handleSwitchMode = useCallback(() => {
    router.replace(isSignUp ? "/sign-in" : "/sign-up");
  }, [isSignUp, router]);

  let submitLabel = isSignUp ? "Daftar" : "Masuk";
  if (isPending) {
    submitLabel = "Memproses...";
  }

  return (
    <SiagaScreen contentClassName="justify-center gap-6 py-12">
      <View className="gap-2">
        <Text className="font-extrabold text-[30px] text-siaga-ink">
          {isSignUp ? "Buat akun pelapor" : "Masuk ke SIAGA"}
        </Text>
        <Text className="text-[13px] text-siaga-muted leading-5">
          Laporan darurat online memerlukan akun agar status dan riwayat dapat
          dipulihkan dengan aman.
        </Text>
      </View>

      <View className="gap-4 rounded-2xl border border-siaga-border bg-siaga-panel p-5">
        {isSignUp ? (
          <TextInput
            accessibilityLabel="Nama lengkap"
            className="h-14 rounded-xl border border-siaga-border bg-siaga-input px-4 text-siaga-ink"
            onChangeText={setName}
            placeholder="Nama lengkap"
            placeholderTextColorClassName="text-siaga-muted"
            value={name}
          />
        ) : null}
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          className="h-14 rounded-xl border border-siaga-border bg-siaga-input px-4 text-siaga-ink"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColorClassName="text-siaga-muted"
          value={email}
        />
        <TextInput
          accessibilityLabel="Kata sandi"
          autoCapitalize="none"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="h-14 rounded-xl border border-siaga-border bg-siaga-input px-4 text-siaga-ink"
          onChangeText={setPassword}
          placeholder="Kata sandi"
          placeholderTextColorClassName="text-siaga-muted"
          secureTextEntry
          value={password}
        />
        {isSignUp ? (
          <TextInput
            accessibilityLabel="Konfirmasi kata sandi"
            autoCapitalize="none"
            autoComplete="new-password"
            className="h-14 rounded-xl border border-siaga-border bg-siaga-input px-4 text-siaga-ink"
            onChangeText={setConfirmPassword}
            placeholder="Konfirmasi kata sandi"
            placeholderTextColorClassName="text-siaga-muted"
            secureTextEntry
            value={confirmPassword}
          />
        ) : null}
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            className="text-red-200 text-sm"
          >
            {error}
          </Text>
        ) : null}
        <SiagaButton isDisabled={isPending} onPress={handleSubmit}>
          {submitLabel}
        </SiagaButton>
      </View>

      <Pressable
        accessibilityRole="button"
        className="items-center p-3"
        onPress={handleSwitchMode}
      >
        <Text className="font-semibold text-siaga-primary text-sm">
          {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
        </Text>
      </Pressable>
    </SiagaScreen>
  );
}
