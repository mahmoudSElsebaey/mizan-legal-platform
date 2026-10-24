"use client";

import type { MouseEvent, ReactNode } from "react";

export function ConfirmSubmitButton({
  children,
  message,
  className,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
}) {
  function confirmAction(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <button type="submit" onClick={confirmAction} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
