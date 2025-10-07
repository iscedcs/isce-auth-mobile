import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CountdownCallback, CountdownEndCallback } from "./types/auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function startFiveMinuteCountdown(
  onTick: CountdownCallback,
  onEnd?: CountdownEndCallback
) {
  let totalSeconds = 5 * 60;

  const interval = setInterval(() => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    onTick(minutes, seconds);

    if (totalSeconds === 0) {
      clearInterval(interval);
      if (onEnd) onEnd();
    }

    totalSeconds--;
  }, 1000);

  return () => clearInterval(interval);
}

export function shortenToThree(text: string): string {
  return text.slice(0, 3);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error("Copy failed", error);
    return false;
  }
}

export function isPastDate(pastDateISO: Date): boolean {
  const today = new Date();
  const pastDate = new Date(pastDateISO);

  today.setHours(0, 0, 0, 0);
  pastDate.setHours(0, 0, 0, 0);

  return today > pastDate;
}
