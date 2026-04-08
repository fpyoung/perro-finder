"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Dog = {
  id: string;
  pin: string;
  name: string;
  breed: string;
  color: string;
  photoUrl: string;
  usualLocation: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  encountersCount: number;
  createdAt: string;
  updatedAt: string;
};

type Encounter = {
  id: string;
  dogId: string;
  message: string;
  timestamp: string;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
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

function saveData(dogs: Dog[], encounters: Encounter[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ dogs, encounters }));
}

function normalizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function DogPageContent() {
  const searchParams = useSearchParams();
  const qrDogId = searchParams.get("dogId")?.trim() || "";
  const [initialData] = useState(() => loadData());
  const [dogs, setDogs] = useState<Dog[]>(initialData.dogs);
  const [encounters, setEncounters] = useState<Encounter[]>(initialData.encounters);
  const [contactMessage, setContactMessage] = useState("Hola, encontre a tu perro.");
  const [contactStatus, setContactStatus] = useState("");

  const selectedDog = useMemo(
    () => dogs.find((dog) => dog.id.toLowerCase() === qrDogId.toLowerCase()) || null,
    [dogs, qrDogId],
  );

  async function onSendWhatsApp(e: FormEvent) {
    e.preventDefault();
    if (!selectedDog) return;
    setContactStatus("Preparando mensaje...");

    let locationLabel = "Ubicacion no compartida";
    let lat: number | undefined;
    let lng: number | undefined;
    let accuracy: number | undefined;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocalizacion no disponible"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
      accuracy = position.coords.accuracy;
      locationLabel = `https://maps.google.com/?q=${lat},${lng}`;
    } catch {
      locationLabel = "Ubicacion no compartida";
    }

    const message = `${contactMessage.trim()} Estoy en: ${locationLabel}`;
    const phone = normalizePhoneForWhatsApp(selectedDog.ownerPhone);
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    const encounter: Encounter = {
      id: `enc-${Date.now()}`,
      dogId: selectedDog.id,
      message,
      timestamp: new Date().toISOString(),
      locationLabel,
      lat,
      lng,
      accuracy,
    };

    const nextEncounters = [encounter, ...encounters];
    const nextDogs = dogs.map((dog) =>
      dog.id === selectedDog.id
        ? {
            ...dog,
            encountersCount: dog.encountersCount + 1,
            updatedAt: new Date().toISOString(),
          }
        : dog,
    );

    setDogs(nextDogs);
    setEncounters(nextEncounters);
    saveData(nextDogs, nextEncounters);
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setContactStatus("WhatsApp abierto. Encuentro guardado.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-4 py-6 sm:px-6">
      <header className="brand-hero rounded-2xl p-5 text-white shadow-lg card-animated">
        <Image
          src="/virbac.png"
          alt="Virbac"
          width={220}
          height={100}
          priority
          className="h-auto w-40 sm:w-52"
        />
        <p className="mt-2 text-sm opacity-95">Flujo encontre perro</p>
        <div className="mt-2 h-1 w-24 rounded-full bg-red-500/95" />
      </header>

      {!qrDogId && (
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm card-animated">
          <p className="text-sm text-slate-700">
            Falta `dogId` en la URL. Usa formato:
            <span className="ml-1 font-mono">/dog?dogId=dog-12345</span>
          </p>
        </section>
      )}

      {!!qrDogId && !selectedDog && (
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm card-animated">
          <p className="text-red-700">Perro no registrado para este QR.</p>
          <p className="mt-2 text-sm text-slate-700">
            Si es un collar nuevo, registra en{" "}
            <Link href={`/?dogId=${qrDogId}`} className="font-mono font-semibold text-cyan-700 underline">
              {`/?dogId=${qrDogId}`}
            </Link>
          </p>
        </section>
      )}

      {!!selectedDog && (
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm card-animated">
          <h2 className="text-xl font-bold text-slate-800">Detalle del perro</h2>
          <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <img
              src={selectedDog.photoUrl}
              alt={selectedDog.name}
              className="h-56 w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://placehold.co/800x500/e2e8f0/334155?text=Foto+no+disponible";
              }}
            />
            <div className="p-4">
              <h3 className="text-2xl font-bold">{selectedDog.name}</h3>
              <p className="mt-1 text-slate-700">
                {selectedDog.breed} - {selectedDog.color}
              </p>
              <p className="mt-1 text-sm text-slate-500">Encuentros: {selectedDog.encountersCount}</p>
            </div>
          </article>

          <form className="mt-4 grid gap-3" onSubmit={onSendWhatsApp}>
            <textarea
              className="input-field min-h-24"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
            />
            {contactStatus && <p className="text-sm text-emerald-700">{contactStatus}</p>}
            <button type="submit" className="btn-primary">
              Abrir WhatsApp
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

export default function DogPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen w-full max-w-3xl bg-slate-50 px-4 py-6 sm:px-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-700">Cargando...</p>
          </section>
        </main>
      }
    >
      <DogPageContent />
    </Suspense>
  );
}
