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
    <div className="flex flex-col items-center">
      <div className="bg-[#1B2A6B] text-white rounded-xl w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-extrabold tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
    <div className="flex items-start gap-3 sm:gap-4">
      <Bloc value={timeLeft.jours} label="Jours" />
      <span className="text-2xl font-bold text-[#1B2A6B] mt-4">:</span>
      <Bloc value={timeLeft.heures} label="Heures" />
      <span className="text-2xl font-bold text-[#1B2A6B] mt-4">:</span>
      <Bloc value={timeLeft.minutes} label="Minutes" />
      <span className="text-2xl font-bold text-[#1B2A6B] mt-4">:</span>
      <Bloc value={timeLeft.secondes} label="Secondes" />
    </div>
  );
}
