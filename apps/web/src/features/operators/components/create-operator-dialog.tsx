import { Button } from "@siaga-app/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@siaga-app/ui/components/dialog";
import { Input } from "@siaga-app/ui/components/input";
import { Label } from "@siaga-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { useCreateOperatorMutation } from "../api";
import { createOperatorSchema } from "../types";

export function CreateOperatorDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const createOperatorMutation = useCreateOperatorMutation();

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    onSubmit: ({ value, formApi }) => {
      createOperatorMutation.mutate(value, {
        onError: (error) => {
          toast.error(error.message);
        },
        onSuccess: () => {
          toast.success("Operator berhasil ditambahkan");
          formApi.reset();
          setOpen(false);
          onCreated?.();
        },
      });
    },
    validators: {
      onSubmit: createOperatorSchema,
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

  const handleNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      form.setFieldValue("name", e.target.value);
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>Tambah Operator</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Operator</DialogTitle>
          <DialogDescription>
            Buat akun operator baru untuk mengakses dashboard.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nama</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={handleNameChange}
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

          <DialogFooter>
            <form.Subscribe selector={selectFormState}>
              {({ canSubmit, isSubmitting }) => (
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
