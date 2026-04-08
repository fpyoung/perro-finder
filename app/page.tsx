"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

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

type DogForm = {
  name: string;
  breed: string;
  color: string;
  photoUrl: string;
  usualLocation: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
};

const STORAGE_KEY = "perroFinderData";

const initialDogForm: DogForm = {
  name: "",
  breed: "",
  color: "",
  photoUrl: "",
  usualLocation: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
};

function loadData(): { dogs: Dog[]; encounters: Encounter[] } {
  if (typeof window === "undefined") {
    return { dogs: [], encounters: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { dogs: [], encounters: [] };
  }

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

function generatePin() {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrDogId = searchParams.get("dogId")?.trim() || "";
  const [initialData] = useState(() => loadData());
  const [dogs, setDogs] = useState<Dog[]>(initialData.dogs);
  const [encounters] = useState<Encounter[]>(initialData.encounters);
  const [form, setForm] = useState<DogForm>(initialDogForm);
  const [registerResult, setRegisterResult] = useState<{
    dogId: string;
    pin: string;
  } | null>(null);
  const [photoStatus, setPhotoStatus] = useState("");

  const selectedDog = useMemo(
    () => dogs.find((dog) => dog.id.toLowerCase() === qrDogId.toLowerCase()) || null,
    [dogs, qrDogId],
  );

  useEffect(() => {
    if (qrDogId && selectedDog) {
      router.replace(`/dog?dogId=${encodeURIComponent(qrDogId)}`);
    }
  }, [qrDogId, selectedDog, router]);

  function updateFormField<K extends keyof DogForm>(key: K, value: DogForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPhotoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateFormField("photoUrl", reader.result);
        setPhotoStatus("Foto cargada desde camara/galeria");
      }
    };
    reader.onerror = () => {
      setPhotoStatus("No se pudo leer la foto. Usa URL como alternativa.");
    };
    reader.readAsDataURL(file);
  }

  function onRegisterDog(e: FormEvent) {
    e.preventDefault();
    if (!qrDogId) return;
    if (
      !form.name ||
      !form.breed ||
      !form.color ||
      !form.photoUrl ||
      !form.usualLocation ||
      !form.ownerName ||
      !form.ownerPhone ||
      !form.ownerEmail
    ) {
      setRegisterResult(null);
      return;
    }

    const pin = generatePin();
    const now = new Date().toISOString();

    const newDog: Dog = {
      id: qrDogId,
      pin,
      name: form.name.trim(),
      breed: form.breed.trim(),
      color: form.color.trim(),
      photoUrl: form.photoUrl.trim(),
      usualLocation: form.usualLocation.trim(),
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim(),
      ownerEmail: form.ownerEmail.trim(),
      encountersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const nextDogs = [newDog, ...dogs];
    setDogs(nextDogs);
    saveData(nextDogs, encounters);
    setRegisterResult({ dogId: qrDogId, pin });
    setForm(initialDogForm);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        <header className="brand-hero rounded-2xl px-5 py-6 text-white shadow-lg card-animated">
          <Image
            src="/virbac.png"
            alt="Virbac"
            width={220}
            height={100}
            priority
            className="mx-auto h-auto w-48 sm:w-56"
          />
        </header>
        {!qrDogId && (
          <section className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm card-animated">
            <p className="text-sm text-slate-700">
              Escanea un QR para abrir esta vista con <span className="font-mono">?dogId=...</span>.
            </p>
          </section>
        )}

        {!!qrDogId && !selectedDog && (
          <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm card-animated">
            <h2 className="text-xl font-bold text-slate-800">QR virgen: registrar perro</h2>
            <p className="mt-1 text-sm text-slate-600">
              ID detectado: <span className="font-mono font-semibold">{qrDogId}</span>
            </p>
            <form className="mt-4 grid gap-3" onSubmit={onRegisterDog}>
              <input className="input-field" placeholder="Nombre del perro" value={form.name} onChange={(e) => updateFormField("name", e.target.value)} />
              <input className="input-field" placeholder="Raza" value={form.breed} onChange={(e) => updateFormField("breed", e.target.value)} />
              <input className="input-field" placeholder="Color" value={form.color} onChange={(e) => updateFormField("color", e.target.value)} />
              <input className="input-field" placeholder="Foto (URL opcional)" value={form.photoUrl} onChange={(e) => updateFormField("photoUrl", e.target.value)} />
              <label className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                Sacar/cargar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="mt-2 block w-full text-xs"
                  onChange={onPhotoFileChange}
                />
              </label>
              {photoStatus && <p className="text-sm text-emerald-700">{photoStatus}</p>}
              <input className="input-field" placeholder="Ubicacion habitual" value={form.usualLocation} onChange={(e) => updateFormField("usualLocation", e.target.value)} />
              <input className="input-field" placeholder="Nombre del dueno" value={form.ownerName} onChange={(e) => updateFormField("ownerName", e.target.value)} />
              <input className="input-field" placeholder="Telefono del dueno" value={form.ownerPhone} onChange={(e) => updateFormField("ownerPhone", e.target.value)} />
              <input className="input-field" placeholder="Email del dueno" value={form.ownerEmail} onChange={(e) => updateFormField("ownerEmail", e.target.value)} />
              <button type="submit" className="btn-primary mt-1 soft-pulse">Guardar perro</button>
            </form>

            {registerResult && (
              <div className="mt-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Registro exitoso</p>
                <p className="mt-2 text-sm text-slate-700">ID QR: <span className="font-mono font-bold">{registerResult.dogId}</span></p>
                <p className="mt-2 text-3xl font-extrabold tracking-widest text-emerald-700">PIN: {registerResult.pin}</p>
                <p className="mt-2 text-sm text-slate-700">
                  URL asociada:{" "}
                  <span className="font-mono font-semibold">{`/dog?dogId=${registerResult.dogId}`}</span>
                </p>
              </div>
            )}
          </section>
        )}

        {!!qrDogId && selectedDog && (
          <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm card-animated">
            <p className="text-sm text-slate-700">Redirigiendo al flujo &quot;encontre perro&quot;...</p>
          </section>
        )}
      </main>
    </div>
  );
}
