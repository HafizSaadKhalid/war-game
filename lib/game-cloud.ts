import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDailyQuests } from "@/components/daily-quests";
import { getCityKey, PlayerProfile, PROFESSION_OPTIONS, RoleDistribution, restorePlayerProfile } from "@/components/player";

export type CloudAuthResult = {
  userId?: string;
  error?: string;
  unavailable?: boolean;
  confirmationRequired?: boolean;
};

function usernameEmail(username: string): string {
  const localPart = username.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return `${localPart}@players.representyourcity.invalid`;
}

export async function signUpWithSupabase(username: string, password: string): Promise<CloudAuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { unavailable: true };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: usernameEmail(username),
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };
    if (!data.session) return { userId: data.user?.id, confirmationRequired: true };
    return { userId: data.user?.id };
  } catch {
    return { unavailable: true };
  }
}

export async function signInWithSupabase(username: string, password: string): Promise<CloudAuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) return { unavailable: true };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password });
    if (error) return { error: error.message };
    return { userId: data.user?.id };
  } catch {
    return { unavailable: true };
  }
}

export async function signOutFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // Local sign-out must still work when the network is unavailable.
  }
}

export async function syncPlayerToSupabase(profile: PlayerProfile): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      username: profile.username,
      home_country: profile.country,
      country_code: profile.countryCode,
      home_state: profile.homeState,
      state_code: profile.stateCode,
      home_city: profile.city,
      home_latitude: profile.homeLatitude,
      home_longitude: profile.homeLongitude,
      role: profile.role,
      profession: profile.profession,
      profession_selected: profile.professionSelected,
      specialization: profile.specialization,
      role_yield_bonus_percent: profile.roleYieldBonusPercent,
      level: profile.level,
      xp: profile.xp,
      energy: profile.energy,
      gold: profile.gold,
      power: profile.power,
      influence: profile.influence,
      intel: profile.intel,
      target_country: profile.targetCountry,
      target_city: profile.targetCity,
      daily_quest_date: profile.dailyQuestDate,
      game_state: profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) return;

    const ledgerRows = Object.entries(profile.cityLedger).map(([key, ledger]) => {
      const separatorIndex = key.indexOf("::");
      const country = separatorIndex >= 0 ? key.slice(0, separatorIndex) : profile.country;
      const cityName = separatorIndex >= 0 ? key.slice(separatorIndex + 2) : key;
      return {
        country,
        city_name: cityName,
        defense: ledger.defense,
        treasury: ledger.treasury,
        controlling_role: ledger.controllingRole,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };
    });
    if (ledgerRows.length) await supabase.from("city_ledgers").upsert(ledgerRows, { onConflict: "country,city_name" });

    const questRows = getDailyQuests(profile.role).map((quest) => ({
      user_id: user.id,
      quest_id: quest.id,
      quest_date: profile.dailyQuestDate,
      progress: profile.dailyQuestProgress[quest.id] ?? 0,
      completed: profile.completedDailyQuests.includes(quest.id),
      updated_at: new Date().toISOString(),
    }));
    if (questRows.length) await supabase.from("user_quests").upsert(questRows, { onConflict: "user_id,quest_id,quest_date" });
  } catch {
    // Browser localStorage remains the authoritative offline cache until sync succeeds.
  }
}

export async function fetchCountryRoleDistribution(countryCode: string): Promise<RoleDistribution | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    const { data, error } = await supabase.rpc("get_country_role_distribution", { requested_country_code: countryCode });
    if (error || !data) return null;
    const distribution: RoleDistribution = {
      "Military Commander": 0,
      Industrialist: 0,
      Politician: 0,
      "Intelligence Agent": 0,
    };
    for (const row of data as { profession: string; player_count: number }[]) {
      if (PROFESSION_OPTIONS.some((option) => option.value === row.profession)) {
        distribution[row.profession as keyof RoleDistribution] = Number(row.player_count) || 0;
      }
    }
    return distribution;
  } catch {
    return null;
  }
}

export async function loadPlayerFromSupabase(): Promise<PlayerProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error || !data) return null;

    const gameState = data.game_state && typeof data.game_state === "object"
      ? data.game_state as Partial<PlayerProfile>
      : {};
    const profile = restorePlayerProfile({
      ...gameState,
      username: data.username,
      country: data.home_country,
      countryCode: data.country_code ?? gameState.countryCode,
      homeState: data.home_state ?? gameState.homeState,
      stateCode: data.state_code ?? gameState.stateCode,
      city: data.home_city,
      homeCoordinates: typeof data.home_latitude === "number" && typeof data.home_longitude === "number"
        ? { latitude: data.home_latitude, longitude: data.home_longitude }
        : null,
      role: data.role,
      profession: data.profession ?? gameState.profession,
      professionSelected: data.profession_selected ?? gameState.professionSelected,
      specialization: data.specialization ?? gameState.specialization,
      roleYieldBonusPercent: data.role_yield_bonus_percent ?? gameState.roleYieldBonusPercent,
      level: data.level,
      xp: data.xp,
      energy: data.energy,
      gold: data.gold,
      power: data.power,
      influence: data.influence,
      intel: data.intel,
      targetCountry: data.target_country,
      targetCity: data.target_city,
    });
    if (!profile) return null;

    const [{ data: ledgers }, { data: quests }] = await Promise.all([
      supabase.from("city_ledgers").select("country,city_name,defense,treasury,controlling_role"),
      supabase.from("user_quests").select("quest_id,quest_date,progress,completed").eq("user_id", user.id).eq("quest_date", profile.dailyQuestDate),
    ]);
    if (ledgers) {
      for (const row of ledgers) {
        profile.cityLedger[getCityKey(row.country, row.city_name)] = {
          defense: row.defense,
          treasury: row.treasury,
          controllingRole: row.controlling_role,
          influence: profile.cityLedger[getCityKey(row.country, row.city_name)]?.influence ?? 0,
        };
      }
    }
    if (quests) {
      profile.dailyQuestProgress = {};
      profile.completedDailyQuests = [];
      for (const quest of quests) {
        profile.dailyQuestProgress[quest.quest_id] = quest.progress;
        if (quest.completed) profile.completedDailyQuests.push(quest.quest_id);
      }
    }
    return profile;
  } catch {
    return null;
  }
}
