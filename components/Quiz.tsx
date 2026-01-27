"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { z } from "zod";
import Image from "next/image";

type Q = {
  id: string;
  label: string;
  type: "choice" | "text";
  options?: string[];
};

const QUESTIONS: Q[] = [
  { id: "stoppedWorking", label: "¿Has dejado de trabajar o planeas dejar de trabajar pronto?", type: "choice", options: ["Sí", "No"] },
  { id: "duration12mo", label: "¿Tu condición ha durado o durará 12 meses o más?", type: "choice", options: ["Sí", "No"] },
  { id: "limitation", label: "¿Cómo limita tu condición tu capacidad de trabajar?", type: "choice", options: ["No puedo trabajar", "No puedo sostener tiempo completo", "Faltas frecuentes", "Necesito acomodos", "Ninguna"] },
  { id: "ageBand", label: "¿Cuál es tu rango de edad?", type: "choice", options: ["18–29", "30–49", "50–54", "55–59", "60–64"] },
  { id: "workCredits5of10", label: "¿Has pagado impuestos del Seguro Social ~5 de los últimos 10 años?", type: "choice", options: ["Sí", "No", "No estoy seguro/a"] },
  { id: "priorApplication", label: "¿Has solicitado antes?", type: "choice", options: ["No", "Denegado en inicial", "Denegado en reconsideración", "Denegado en vista", "Denegado en Consejo de Apelaciones"] },
  { id: "zip", label: "Código postal", type: "text" }
];

const LeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  bestTime: z.string().min(1),
  consent: z.boolean().refine((v) => v === true)
});

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ path: string; summary: string[] } | null>(null);
  const [lead, setLead] = useState({ firstName: "", lastName: "", email: "", phone: "", bestTime: "Mañana", consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);

  const current = QUESTIONS[step];
  const progress = useMemo(() => Math.round((step / QUESTIONS.length) * 100), [step]);

  useEffect(() => {
    const h = document.documentElement.scrollHeight || document.body.scrollHeight;
    try {
      window.parent.postMessage({ type: "QUIZ_HEIGHT", height: h }, "*");
    } catch {}
  }, [step, result, done]);

  function onSelect(value: string) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  function onText(value: string) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  async function next() {
    if (!answers[current.id]) return;

    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function submitLead() {
    if (submittingRef.current || done) return;

    const parse = LeadSchema.safeParse(lead);
    if (!parse.success) return;

    if (!result) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result, lead })
      });

      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function resultTitle(path: string) {
    if (path === "likely_ssdi") return "Es probable que califiques para SSDI";
    if (path === "possible_ssi") return "Podrías calificar para SSI";
    if (path === "appeals") return "Podrías tener opciones de apelación";
    return "Es posible que no cumplas con las guías del SSA";
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden bg-white">
          <div className="px-6 py-6 border-b">
            <h1 className="text-2xl font-semibold text-[#306f98]">{resultTitle(result.path)}</h1>
            <p className="mt-2 text-sm text-neutral-600">Basado en tus respuestas. No constituye asesoría legal.</p>
          </div>

          <div className="px-6 py-6 space-y-4">
            <ul className="space-y-2">
              {result.summary.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>

            {!done ? (
              <div className="mt-6 rounded-2xl border p-6 space-y-4">
                <h2 className="text-lg font-medium text-[#306f98]">Obtén tu evaluación de caso gratis</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="rounded-xl border px-4 py-3"
                    placeholder="Nombre"
                    value={lead.firstName}
                    onChange={(e) => setLead({ ...lead, firstName: e.target.value })}
                  />
                  <input
                    className="rounded-xl border px-4 py-3"
                    placeholder="Apellido"
                    value={lead.lastName}
                    onChange={(e) => setLead({ ...lead, lastName: e.target.value })}
                  />
                  <input
                    className="rounded-xl border px-4 py-3 md:col-span-2"
                    placeholder="Correo electrónico"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  />
                  <input
                    className="rounded-xl border px-4 py-3"
                    placeholder="Teléfono"
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  />

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-neutral-700">Mejor hora para contactarte</div>
                    <select
                      className="w-full rounded-xl border px-4 py-3"
                      value={lead.bestTime}
                      onChange={(e) => setLead({ ...lead, bestTime: e.target.value })}
                    >
                      <option>Mañana</option>
                      <option>Tarde</option>
                      <option>Noche</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={lead.consent} onChange={(e) => setLead({ ...lead, consent: e.target.checked })} />
                  <span>Acepto ser contactada/o por teléfono, correo o SMS.</span>
                </label>

                <button
                  disabled={submitting}
                  onClick={submitLead}
                  className={`w-full rounded-xl px-6 py-4 text-white ${submitting ? "bg-[#306f98]/60 cursor-not-allowed" : "bg-[#306f98]"}`}
                >
                  {submitting ? "Enviando..." : "Solicitar evaluación gratuita"}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border p-8 text-center">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
                  <span className="text-xl">✅</span>
                </div>
                <div className="text-lg font-medium text-[#306f98]">¡Listo! Recibimos tu solicitud.</div>
                <div className="mt-1 text-sm text-neutral-600">
                  Te enviaremos los próximos pasos a <span className="font-medium">{lead.email}</span>. Un especialista se comunicará contigo pronto.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl shadow-xl ring-1 ring-black/5 overflow-hidden bg-white">
        <div className="relative p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-[#306f98]">Pregunta {step + 1} de {QUESTIONS.length}</div>
            <div className="h-14 w-14 rounded-full ring-2 ring-[#306f98] overflow-hidden bg-[#306f98]/10">
              <Image src="/quiz-avatar.png" alt="Asesora" width={56} height={56} className="object-cover w-full h-full" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
                  i <= step ? "bg-[#306f98] text-white" : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="absolute inset-x-0 -bottom-[1px] h-1 bg-[#306f98]" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-center text-[#306f98]">{current.label}</h1>

          {current.type === "choice" && (
            <div className="mt-8 grid gap-4">
              {current.options!.map((opt) => {
                const active = answers[current.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => onSelect(opt)}
                    className={`rounded-full px-6 py-4 border-2 text-lg transition ${
                      active ? "border-[#306f98] bg-[#306f98]/10" : "border-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "text" && (
            <div className="mt-8">
              <input
                className="w-full rounded-xl border px-4 py-3 text-lg"
                placeholder="Escribe tu respuesta"
                value={answers[current.id] || ""}
                onChange={(e) => onText(e.target.value)}
              />
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button onClick={back} className="rounded-xl border px-5 py-3">
              Atrás
            </button>
            <button
              onClick={next}
              disabled={!answers[current.id] || submitting}
              className="rounded-xl bg-[#306f98] px-6 py-3 text-white"
            >
              {step === QUESTIONS.length - 1 ? "Ver resultados" : "Continuar"}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-[#306f98]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">💵</span>
            <span>Completa la evaluación para recibir tus próximos pasos.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

