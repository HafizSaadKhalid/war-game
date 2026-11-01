import Country from "country-state-city/lib/country";
import State from "country-state-city/lib/state";
import City from "country-state-city/lib/city";
import type { ICity, ICountry, IState } from "country-state-city/lib/interface";

export type LocationOption = { name: string; code: string };
export type HomeCoordinates = { latitude: number; longitude: number };

export function getCountries(): LocationOption[] {
  return Country.getAllCountries()
    .map((country: ICountry) => ({ name: country.name, code: country.isoCode }))
    .sort((left: LocationOption, right: LocationOption) => left.name.localeCompare(right.name));
}

export function getCountryByName(name: string): ICountry | undefined {
  return Country.getAllCountries().find((country: ICountry) => country.name === name);
}

export function getStates(countryCode: string): LocationOption[] {
  return State.getStatesOfCountry(countryCode)
    .map((state: IState) => ({ name: state.name, code: state.isoCode }))
    .sort((left: LocationOption, right: LocationOption) => left.name.localeCompare(right.name));
}

export function getCities(countryCode: string, stateCode: string): string[] {
  const stateCities = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
  const cities = stateCities.length ? stateCities : (City.getCitiesOfCountry(countryCode) ?? []);
  return Array.from(new Set(cities.map((city: ICity) => city.name))).sort((left, right) => left.localeCompare(right));
}

export function getHomeCoordinates(countryCode: string, stateCode: string, cityName: string): HomeCoordinates | null {
  const normalizedCity = cityName.trim().toLocaleLowerCase();
  if (!normalizedCity) return null;
  const cityMatches = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
  const cities = cityMatches.length ? cityMatches : (City.getCitiesOfCountry(countryCode) ?? []);
  const city = cities.find((candidate: ICity) => candidate.name.toLocaleLowerCase() === normalizedCity);
  if (city?.latitude && city.longitude) {
    return { latitude: Number(city.latitude), longitude: Number(city.longitude) };
  }
  const state = State.getStateByCodeAndCountry(stateCode, countryCode);
  if (state?.latitude && state.longitude) {
    return { latitude: Number(state.latitude), longitude: Number(state.longitude) };
  }
  const country = Country.getCountryByCode(countryCode);
  if (country?.latitude && country.longitude) {
    return { latitude: Number(country.latitude), longitude: Number(country.longitude) };
  }
  return null;
}
