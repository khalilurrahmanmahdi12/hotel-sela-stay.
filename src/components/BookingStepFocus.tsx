"use client";

import { useEffect, useRef } from "react";

type BookingStepFocusProps = {
  currentStep: 1 | 2 | 3 | 4;
};

export default function BookingStepFocus({
  currentStep,
}: BookingStepFocusProps) {
  const previousStep = useRef(currentStep);

  useEffect(() => {
    // Jangan menggeser halaman saat pertama kali dibuka.
    if (previousStep.current === currentStep) return;

    previousStep.current = currentStep;

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-booking-step="${currentStep}"]`,
      );

      if (!target) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      target.focus({ preventScroll: true });

      target.scrollIntoView({
        behavior: reduceMotion ? "instant" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentStep]);

  return null;
}