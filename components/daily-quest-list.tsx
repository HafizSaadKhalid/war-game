"use client";

import { getDailyQuests, QuestAction } from "@/components/daily-quests";
import { PlayerProfile } from "@/components/player";

type DailyQuestListProps = {
  player: PlayerProfile;
  canWork: boolean;
  canTrain: boolean;
  canTargetEnemy: boolean;
  onAction: (action: QuestAction) => void;
};

export default function DailyQuestList({ player, canWork, canTrain, canTargetEnemy, onAction }: DailyQuestListProps) {
  const quests = getDailyQuests(player.role);

  return (
    <section aria-labelledby="quests-heading" className="tactical-panel">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="tactical-kicker">Role operations / refresh daily</p><h2 id="quests-heading" className="mt-1 font-display text-2xl">Daily quests</h2></div>
        <span className="border border-line px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-muted">{player.role} track · +XP / +Gold</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {quests.map((quest, index) => {
          const progress = Math.min(quest.goal, player.dailyQuestProgress[quest.id] ?? 0);
          const complete = player.completedDailyQuests.includes(quest.id);
          const actionLocked = (quest.action === "work" && !canWork)
            || (quest.action === "train" && !canTrain)
            || (["intel", "sabotage", "scout"].includes(quest.action) && !canTargetEnemy);
          return <article key={quest.id} className={`quest-card ${complete ? "quest-card-complete" : ""}`}>
            <div className="flex items-start justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted">Objective {String(index + 1).padStart(2, "0")}</span><span className="text-[9px] uppercase tracking-[0.1em] text-economy">{complete ? "Secured" : `+${quest.rewardXp} XP · +${quest.rewardGold} G`}</span></div>
            <h3 className="mt-3 text-sm font-semibold">{quest.title}</h3>
            <p className="mt-1 min-h-9 text-xs leading-5 text-muted">{quest.description}</p>
            <div className="mt-4 flex items-center justify-between text-[10px]"><span className="text-muted">Progress</span><span className="text-paper">{progress} / {quest.goal}</span></div>
            <div className="quest-progress mt-2"><span style={{ width: `${(progress / quest.goal) * 100}%` }} /></div>
            <button type="button" className={`quest-action mt-4 w-full ${["fortify", "sabotage"].includes(quest.action) ? "tactical-action" : ""}`} disabled={complete || actionLocked} onClick={() => onAction(quest.action)}>{complete ? "Reward collected" : actionLocked ? "Select an available target" : quest.action === "work" || quest.action === "train" ? `${quest.actionLabel} · progress` : quest.actionLabel}</button>
          </article>;
        })}
      </div>
    </section>
  );
}
