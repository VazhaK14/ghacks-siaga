import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Button, buttonVariants } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import { PhoneCallIcon, SirenIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { useSignInMutation, useSignUpMutation } from "../api";
import { signInSchema, signUpSchema } from "../types";

interface AuthScreenProps {
  mode: "sign-in" | "sign-up";
}

export const AuthScreen = ({ mode }: AuthScreenProps) => {
  const navigate = useNavigate();
  const signIn = useSignInMutation();
  const signUp = useSignUpMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";
  const isPending = signIn.isPending || signUp.isPending;
  let submitLabel = isSignUp ? "Buat akun" : "Masuk";
  if (isPending) {
    submitLabel = "Memproses...";
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };
  const handleConfirmPasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      navigate(isSignUp ? "/complete-registration" : "/history", {
        replace: true,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Autentikasi belum berhasil."
      );
    }
  };

  return (
    <MobilePage
      className="justify-center pb-8"
      title={isSignUp ? "Daftar" : "Masuk"}
    >
      <div className="mb-6 flex items-center justify-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <SirenIcon aria-hidden="true" />
        </div>
        <div>
          <p className="text-h4 text-primary">SIAGA</p>
          <p className="text-muted-foreground text-xs">Bantuan darurat warga</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {isSignUp ? "Buat akun pelapor" : "Masuk ke SIAGA"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Akun baru otomatis dibuat sebagai akun pelapor."
              : "Gunakan akun pelapor untuk mengakses bantuan darurat."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="auth-form" onSubmit={handleSubmit}>
            <FieldGroup>
              {isSignUp ? (
                <Field>
                  <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
                  <Input
                    autoComplete="name"
                    id="name"
                    onChange={handleNameChange}
                    required
                    value={name}
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  autoComplete="email"
                  id="email"
                  inputMode="email"
                  onChange={handleEmailChange}
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
                <Input
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  id="password"
                  minLength={8}
                  onChange={handlePasswordChange}
                  required
                  type="password"
                  value={password}
                />
              </Field>
              {isSignUp ? (
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="confirm-password">
                    Konfirmasi kata sandi
                  </FieldLabel>
                  <Input
                    aria-invalid={Boolean(error)}
                    autoComplete="new-password"
                    id="confirm-password"
                    minLength={8}
                    onChange={handleConfirmPasswordChange}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                  <FieldError>{error}</FieldError>
                </Field>
              ) : null}
              {error && !isSignUp ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button disabled={isPending} form="auth-form" type="submit">
            {submitLabel}
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            {isSignUp ? "Sudah punya akun? " : "Belum punya akun? "}
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              to={isSignUp ? "/sign-in" : "/sign-up"}
            >
              {isSignUp ? "Masuk" : "Daftar"}
            </Link>
          </p>
          <Link
            className={buttonVariants({
              className: "w-full",
              variant: "stroke",
            })}
            to="/offline-call"
          >
            <PhoneCallIcon data-icon="inline-start" />
            Gunakan Panggilan Offline
          </Link>
        </CardFooter>
      </Card>
    </MobilePage>
  );
};
