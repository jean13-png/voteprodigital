"use client";

import { useState, useEffect } from "react";
import { SOUTENANCE_DATE } from "@/lib/constants";

interface TimeLeft {
  jours: number;
  heures: number;
  minutes: number;
  secondes: number;
}

function calcTimeLeft(): TimeLeft {
  const diff = SOUTENANCE_DATE.getTime() - Date.now();
  if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
  return {
    jours: Math.floor(diff / (1000 * 60 * 60 * 24)),
    heures: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    secondes: Math.floor((diff / 1000) % 60),
  };
}

function Bloc({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div className="bg-[#1B2A6B] text-white rounded-lg w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center shadow-sm">
        <span className="text-lg sm:text-2xl md:text-3xl font-extrabold tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft());

  useEffect(() => {
    // Premier calcul après montage (évite l'erreur d'hydration)
    setTimeLeft(calcTimeLeft());
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isOver =
    timeLeft.jours === 0 &&
    timeLeft.heures === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.secondes === 0;

  if (isOver) {
    return (
      <p className="text-[#F5A623] font-bold text-lg">
        La soutenance a eu lieu !
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-full items-center justify-center gap-2 sm:gap-3 md:gap-4">
      <Bloc value={timeLeft.jours} label="Jours" />
      <span className="mt-3 text-lg sm:text-2xl font-bold text-white/80">:</span>
      <Bloc value={timeLeft.heures} label="Heures" />
      <span className="mt-3 text-lg sm:text-2xl font-bold text-white/80">:</span>
      <Bloc value={timeLeft.minutes} label="Minutes" />
      <span className="mt-3 text-lg sm:text-2xl font-bold text-white/80">:</span>
      <Bloc value={timeLeft.secondes} label="Secondes" />
    </div>
  );
}
