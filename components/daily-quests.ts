import { PlayerRole } from "@/components/player";

export type QuestAction =
  | "work"
  | "train"
  | "fortify"
  | "inject"
  | "campaign"
  | "influence"
  | "intel"
  | "sabotage"
  | "patrol"
  | "market"
  | "address"
  | "scout";

export type DailyQuest = {
  id: string;
  title: string;
  description: string;
  action: QuestAction;
  goal: number;
  actionLabel: string;
  rewardGold: number;
  rewardXp: number;
};

const QUESTS_BY_ROLE: Record<PlayerRole, DailyQuest[]> = {
  Commander: [
    { id: "train-three", title: "Combat readiness", description: "Complete three training operations.", action: "train", goal: 3, actionLabel: "Train", rewardGold: 50, rewardXp: 45 },
    { id: "fortify-city", title: "Fortify city defense", description: "Spend 30 Gold to reinforce your target city.", action: "fortify", goal: 1, actionLabel: "Fortify · 30 G", rewardGold: 55, rewardXp: 50 },
    { id: "commander-patrol", title: "Secure the perimeter", description: "Complete a city patrol operation.", action: "patrol", goal: 1, actionLabel: "Run patrol", rewardGold: 40, rewardXp: 35 },
  ],
  Businessman: [
    { id: "work-three", title: "Build the local economy", description: "Work for your city three times.", action: "work", goal: 3, actionLabel: "Work", rewardGold: 55, rewardXp: 45 },
    { id: "inject-treasury", title: "Inject 50 Gold", description: "Invest 50 Gold into your target city treasury.", action: "inject", goal: 50, actionLabel: "Invest · 25 G", rewardGold: 65, rewardXp: 50 },
    { id: "market-survey", title: "Market survey", description: "Complete a market intelligence report.", action: "market", goal: 1, actionLabel: "Survey market", rewardGold: 40, rewardXp: 35 },
  ],
  Politician: [
    { id: "campaign-votes", title: "Campaign for votes", description: "Launch a city campaign and earn support.", action: "campaign", goal: 1, actionLabel: "Campaign", rewardGold: 45, rewardXp: 45 },
    { id: "boost-influence", title: "Boost city influence", description: "Invest 20 Gold to grow city influence by 15.", action: "influence", goal: 1, actionLabel: "Lobby · 20 G", rewardGold: 55, rewardXp: 50 },
    { id: "public-address", title: "Address the council", description: "Deliver a public address in your target city.", action: "address", goal: 1, actionLabel: "Give address", rewardGold: 40, rewardXp: 35 },
  ],
  Spy: [
    { id: "gather-intel", title: "Gather enemy intel", description: "Collect 30 intel on a city outside your home city.", action: "intel", goal: 30, actionLabel: "Gather · 10 Intel", rewardGold: 55, rewardXp: 50 },
    { id: "execute-sabotage", title: "Execute sabotage", description: "Disrupt defenses in a non-home target city.", action: "sabotage", goal: 1, actionLabel: "Sabotage", rewardGold: 65, rewardXp: 55 },
    { id: "covert-scout", title: "Covert surveillance", description: "Scout a city outside your home territory.", action: "scout", goal: 1, actionLabel: "Scout target", rewardGold: 40, rewardXp: 35 },
  ],
};

export function getDailyQuests(role: PlayerRole): DailyQuest[] {
  return QUESTS_BY_ROLE[role];
}