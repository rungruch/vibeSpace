import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim();

  if (!term || term.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AeroDataBox API key is not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://aerodatabox.p.rapidapi.com/flights/search/term?q=${encodeURIComponent(term)}&limit=8`,
    {
      headers: {
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      return NextResponse.json({ suggestions: [] });
    }
    return NextResponse.json({ error: "Upstream API error" }, { status: 502 });
  }

  const data = await res.json();

  // AeroDataBox returns { searchBy, count, items: [{ number: string }] }
  const items: { number: string }[] = Array.isArray(data?.items) ? data.items : [];

  const suggestions = items
    .map((item) => item.number)
    .filter(Boolean);

  return NextResponse.json({ suggestions });
}
