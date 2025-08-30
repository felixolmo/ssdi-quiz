import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { answers, result, lead } = await req.json();

  console.log("lead.created", JSON.stringify({ answers, result, lead }));

  const url = process.env.MAKE_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result, lead }),
      });
    } catch (e) {
      console.error("make.webhook.error", e);
    }
  } else {
    console.error("MAKE_WEBHOOK_URL is not set");
  }

  return NextResponse.json({ ok: true });
}
