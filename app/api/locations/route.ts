import { NextRequest, NextResponse } from "next/server";
import { getCities, getCountries, getCountryByName, getHomeCoordinates, getStates } from "@/components/location-data";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryName = searchParams.get("countryName") ?? "";
  const countryCode = searchParams.get("countryCode") ?? getCountryByName(countryName)?.isoCode ?? "";
  const stateCode = searchParams.get("stateCode") ?? "";
  const city = searchParams.get("city") ?? "";

  if (!countryCode) return NextResponse.json({ countries: getCountries() });

  return NextResponse.json({
    states: getStates(countryCode),
    cities: getCities(countryCode, stateCode).slice(0, 250),
    coordinates: city ? getHomeCoordinates(countryCode, stateCode, city) : null,
  });
}
