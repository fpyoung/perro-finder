"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

type Dog = {
  id: string;
  breed: string;
  usualLocation: string;
};

type Encounter = {
  dogId: string;
  locationLabel?: string;
};

const STORAGE_KEY = "perroFinderData";

function loadData(): { dogs: Dog[]; encounters: Encounter[] } {
  if (typeof window === "undefined") return { dogs: [], encounters: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { dogs: [], encounters: [] };
  try {
    const parsed = JSON.parse(raw) as { dogs?: Dog[]; encounters?: Encounter[] };
    return {
      dogs: Array.isArray(parsed.dogs) ? parsed.dogs : [],
      encounters: Array.isArray(parsed.encounters) ? parsed.encounters : [],
    };
  } catch {
    return { dogs: [], encounters: [] };
  }
}

export default function DashboardPage() {
  const [initialData] = useState(() => loadData());
  const dogs = initialData.dogs;
  const encounters = initialData.encounters;

  const dogMap = useMemo(() => {
    const map = new Map<string, Dog>();
    dogs.forEach((dog) => map.set(dog.id, dog));
    return map;
  }, [dogs]);

  const breedCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    dogs.forEach((dog) => {
      const key = dog.breed?.trim() || "Sin raza";
      acc[key] = (acc[key] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [dogs]);

  const foundBreedCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    encounters.forEach((encounter) => {
      const key = dogMap.get(encounter.dogId)?.breed?.trim() || "Sin raza";
      acc[key] = (acc[key] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [encounters, dogMap]);

  const hotZones = useMemo(() => {
    const acc: Record<string, number> = {};
    if (encounters.length === 0) {
      dogs.forEach((dog) => {
        const key = dog.usualLocation?.trim() || "Sin zona";
        acc[key] = (acc[key] || 0) + 1;
      });
    } else {
      encounters.forEach((encounter) => {
        const key =
          encounter.locationLabel ||
          dogMap.get(encounter.dogId)?.usualLocation ||
          "Sin zona";
        acc[key] = (acc[key] || 0) + 1;
      });
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [dogs, encounters, dogMap]);

  const topBreedCount = breedCounts[0]?.[1] || 1;
  const topFoundBreedCount = foundBreedCounts[0]?.[1] || 1;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-4 py-6 sm:px-6">
      <header className="brand-hero rounded-2xl p-5 text-white shadow-lg card-animated">
        <p className="text-xs uppercase tracking-[0.2em] opacity-90">Vista comercial</p>
        <Image
          src="/virbac.png"
          alt="Virbac"
          width={220}
          height={100}
          priority
          className="mt-2 h-auto w-40 sm:w-52"
        />
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Dashboard laboratorios</h1>
        <p className="mt-2 text-sm opacity-95">Inteligencia de mercado basada en escaneos QR</p>
        <div className="mt-2 h-1 w-28 rounded-full bg-red-500/95" />
        <div className="mt-3">
          <Link href="/" className="inline-flex rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold">
            Volver al flujo QR
          </Link>
        </div>
      </header>

      <section className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm card-animated">
            <p className="text-sm text-slate-500">Total de perros registrados</p>
            <p className="mt-1 text-3xl font-extrabold text-cyan-700">{dogs.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm card-animated">
            <p className="text-sm text-slate-500">Numero de encuentros</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">{encounters.length}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm card-animated">
          <h2 className="text-lg font-bold">Razas mas comunes</h2>
          <div className="mt-3 space-y-2">
            {breedCounts.length === 0 && <p className="text-sm text-slate-500">Aun no hay datos.</p>}
            {breedCounts.slice(0, 6).map(([breed, count]) => (
              <div key={breed}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{breed}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded bg-slate-100">
                  <div
                    className="h-2 rounded bg-cyan-500"
                    style={{ width: `${Math.max((count / topBreedCount) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm card-animated">
          <h2 className="text-lg font-bold">Razas mas encontradas</h2>
          <div className="mt-3 space-y-2">
            {foundBreedCounts.length === 0 && <p className="text-sm text-slate-500">Aun sin encuentros.</p>}
            {foundBreedCounts.slice(0, 6).map(([breed, count]) => (
              <div key={`found-${breed}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{breed}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded bg-slate-100">
                  <div
                    className="h-2 rounded bg-emerald-500"
                    style={{ width: `${Math.max((count / topFoundBreedCount) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm card-animated">
          <h2 className="text-lg font-bold">Zonas calientes</h2>
          <ul className="mt-2 space-y-2">
            {hotZones.length === 0 && <li className="text-sm text-slate-500">Sin ubicaciones registradas.</li>}
            {hotZones.slice(0, 8).map(([zone, count]) => (
              <li key={zone} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate pr-2">{zone}</span>
                <span className="font-bold">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h2 className="text-lg font-bold text-amber-900">Datos disponibles para marcas</h2>
          <p className="mt-2 text-sm text-amber-800">
            Promo ejemplo: &quot;Campana segmentada por raza y zona caliente con cupon de alimento terapeutico&quot;.
          </p>
        </div>
      </section>
    </main>
  );
}
