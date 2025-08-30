import { NextResponse } from "next/server";

function score(answers: Record<string, string>) {
  let s = 0;

  const stopped = answers.stoppedWorking === "Sí";

  if (stopped) s += 3;
  else s -= 2;

  if (answers.duration12mo === "Sí") s += 3;
  else return { path: "not_likely", summary: ["El SSA requiere que la condición dure al menos 12 meses."] };

  if (answers.limitation === "No puedo trabajar") s += 3;
  if (answers.limitation === "No puedo sostener tiempo completo") s += 2;
  if (answers.limitation === "Faltas frecuentes") s += 2;
  if (answers.limitation === "Necesito acomodos") s += 1;
  if (answers.limitation === "Ninguna") s -= 2;

  if (answers.ageBand === "30–49") s += 1;
  if (answers.ageBand === "50–54") s += 2;
  if (answers.ageBand === "55–59") s += 3;
  if (answers.ageBand === "60–64") s += 3;

  if (answers.workCredits5of10 === "Sí") s += 2;

  const hasCredits = answers.workCredits5of10 === "Sí";

  if (s >= 6 && stopped) {
    return {
      path: "likely_ssdi",
      summary: [
        "Tu duración médica cumple con las guías del SSA.",
        "Tus limitaciones laborales apoyan incapacidad.",
        "No estás trabajando actualmente o no superas el límite de ingresos."
      ]
    };
  }

  if (!hasCredits) {
    return {
      path: "possible_ssi",
      summary: [
        "Podrías calificar para SSI por necesidad económica y limitaciones médicas.",
        "Se requiere revisar ingresos y activos."
      ]
    };
  }

  if (answers.priorApplication && answers.priorApplication !== "No") {
    return {
      path: "appeals",
      summary: [
        "Podrías tener opciones de apelación según tu etapa previa.",
        "Los términos son estrictos; actuar pronto ayuda."
      ]
    };
  }

  return {
    path: "not_likely",
    summary: ["Según tus respuestas puede que no cumplas con las guías del SSA."]
  };
}

export async function POST(req: Request) {
  const { answers } = await req.json();
  const result = score(answers || {});
  return NextResponse.json(result);
}
