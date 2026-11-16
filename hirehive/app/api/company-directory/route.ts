
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const QUERY = `
[out:json][timeout:20];
(
  nwr["office"="it"](33.45,72.75,33.85,73.25);
  nwr["office"="software"](33.45,72.75,33.85,73.25);
  nwr["craft"="software"](33.45,72.75,33.85,73.25);
);
out center tags;
`;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function normalizeCompanyName(value: string) {
  return normalize(value)
    .replace(
      /(privatelimited|pvtlimited|pvtltd|privateltd|limited|ltd|incorporated|inc|llc|llp)+$/g,
      ""
    );
}

function getCity(tags: Record<string, string>, lat: number) {
  const cityInfo = [
    tags["addr:city"],
    tags["addr:district"],
    tags["addr:suburb"],
    tags["addr:full"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (cityInfo.includes("rawalpindi")) return "Rawalpindi";
  if (cityInfo.includes("islamabad")) return "Islamabad";

  return lat >= 33.62 ? "Islamabad" : "Rawalpindi";
}

function getAddress(tags: Record<string, string>) {
  if (tags["addr:full"]) return tags["addr:full"];

  return [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
  ]
    .filter(Boolean)
    .join(", ") || "Address not available";
}

async function fetchCompanies() {
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "HireHive-University-FYP/1.0",
        },
        body: new URLSearchParams({ data: QUERY }).toString(),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });

      const raw = await response.text();

      if (!response.ok) {
        errors.push(`${endpoint}: HTTP ${response.status} - ${raw.slice(0, 300)}`);
        continue;
      }

      const result = JSON.parse(raw);

      if (result.remark) {
        errors.push(`${endpoint}: ${result.remark}`);
        continue;
      }

      if (!Array.isArray(result.elements)) {
        errors.push(`${endpoint}: Invalid response`);
        continue;
      }

      return result.elements as OsmElement[];
    } catch (error) {
      errors.push(
        `${endpoint}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  console.error("Overpass API errors:", errors);
  throw new Error("All Overpass servers failed. Check terminal logs.");
}

const getCachedCompanies = unstable_cache(
  async () => fetchCompanies(),
  ["hirehive-company-directory"],
  {
    revalidate: 3600,
  }
);

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not signed in." },
        { status: 401 }
      );
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { data: accounts, error } = await db()
      .from("accounts")
      .select("name")
      .eq("role", "company");

    if (error) throw new Error(error.message);

    const registeredNames = new Set(
  (accounts ?? [])
    .map((account) => normalizeCompanyName(account.name ?? ""))
    .filter(Boolean)
);

    const elements = await getCachedCompanies();
    const unique = new Map<string, object>();

    for (const element of elements) {
      const tags = element.tags ?? {};
      const name = tags.name?.trim();

      if (!name) continue;

      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;

      if (lat === undefined || lon === undefined) continue;

      const city = getCity(tags, lat);
      const key = `${normalizeCompanyName(name)}-${city}`;

      if (unique.has(key)) continue;

      const osmType = element.type;
      const osmId = element.id;

      unique.set(key, {
        id: `${osmType}-${osmId}`,
        name,
        city,
        address: getAddress(tags),
        website: tags.website ?? tags["contact:website"] ?? "",
        phone: tags.phone ?? tags["contact:phone"] ?? "",
        field: "IT / Software / Technology",
       registered: registeredNames.has(normalizeCompanyName(name)),
        source: `https://www.openstreetmap.org/${osmType}/${osmId}`,
      });
    }

    return NextResponse.json({
      companies: Array.from(unique.values()),
      source: "OpenStreetMap",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load companies.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
