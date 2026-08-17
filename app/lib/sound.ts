"use client";

// Tamamlama sesi uisfx (github.com/romainsimon/uisfx) ile üretiliyor.
// Ses dosyası indirilmiyor — "scifi" paketi de Web Audio API ile anlık
// sentezleniyor (temiz, premium/dijital bir onay hissi için seçildi).
import { createUISFX, type UISFXPlayer } from "uisfx";

let ui: UISFXPlayer | null = null;

function getPlayer(): UISFXPlayer | null {
  if (typeof window === "undefined") return null;
  if (!ui) ui = createUISFX({ pack: "scifi", volume: 0.7 });
  return ui;
}

/** Görev/alışkanlık tamamlama anında çalınan "check" sesi — tamamlama anında
 * dopamin dokunuşu. iOS bir süre etkileşim olmadan AudioContext'i askıya
 * aldığından, her çalmadan önce unlock() ile kilidin açık olduğundan emin
 * oluyoruz — yoksa ilk çalıştan sonra sessiz kalır. */
export function playCompletionChime() {
  const player = getPlayer();
  if (!player) return;
  player
    .unlock()
    .then(() => player.play("check"))
    .catch(() => {});
}
