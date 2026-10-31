export type PlayerRole = "Commander" | "Politician";

export type PlayerProfile = {
  username: string;
  country: string;
  city: string;
  role: PlayerRole;
  gold: number;
  level: number;
};

export const PLAYER_STORAGE_KEY = "represent-your-city-player";

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Peshawar", "Quetta"],
  India: ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai"],
  "Sri Lanka": ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo"],
  Malaysia: ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Kota Kinabalu"],
};