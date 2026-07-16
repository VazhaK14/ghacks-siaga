"use client";

import { Label } from "@siaga-app/ui/components/label";
import { cn } from "@siaga-app/ui/lib/utils";
import type * as React from "react";
import { useMemo } from "react";

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("group/field-group flex w-full flex-col gap-5", className)}
      data-slot="field-group"
      {...props}
    />
  );
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group/field flex w-full flex-col gap-2 data-[invalid=true]:text-destructive",
        className
      )}
      data-slot="field"
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn("w-fit leading-snug", className)}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-left font-normal text-muted-foreground text-xs/relaxed",
        className
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

function FieldError({
  children,
  className,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: ({ message?: string } | undefined)[];
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }
    if (!errors?.length) {
      return null;
    }

    const messages = [
      ...new Set(
        errors.flatMap((error) => (error?.message ? [error.message] : []))
      ),
    ];
    if (messages.length === 1) {
      return messages[0];
    }
    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      className={cn("font-normal text-destructive text-xs", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  );
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel };
