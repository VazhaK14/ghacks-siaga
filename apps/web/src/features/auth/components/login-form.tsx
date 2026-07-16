import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { Input } from "@siaga-app/ui/components/input";
import { Label } from "@siaga-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { type ChangeEvent, type FormEvent, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useLoginMutation } from "../api";
import { loginSchema } from "../types";

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: ({ value }) => {
      loginMutation.mutate(value, {
        onError: (error) => {
          toast.error(error.message);
        },
        onSuccess: () => {
          toast.success("Sign in successful");
          navigate("/dashboard");
        },
      });
    },
    validators: {
      onSubmit: loginSchema,
    },
  });

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  const handleEmailChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      form.setFieldValue("email", e.target.value);
    },
    [form]
  );

  const handlePasswordChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      form.setFieldValue("password", e.target.value);
    },
    [form]
  );

  const selectFormState = useCallback(
    (state: typeof form.state) => ({
      canSubmit: state.canSubmit,
      isSubmitting: state.isSubmitting,
    }),
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Operator sign in</CardTitle>
        <CardDescription>
          Masuk dengan akun operator untuk mengakses dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={handleEmailChange}
                  type="email"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-red-500 text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={handlePasswordChange}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-red-500 text-sm" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={selectFormState}>
            {({ canSubmit, isSubmitting }) => (
              <Button
                className="w-full"
                disabled={!canSubmit || isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
