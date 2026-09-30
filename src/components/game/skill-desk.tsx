import { Button } from "@/components/ui/button";
import { sfx } from "@/game/audio";
import { CAST } from "@/game/cast";
import { computeStats } from "@/game/engine";
import { SKILL_IDS, SKILLS, creationPoints, skillMod } from "@/game/skills";
import { useGame } from "@/game/store";
import { COG_PROMPTS, travisTagsFrom, travisVerdict } from "@/game/travis-cog";
import type { SkillId } from "@/game/types";
import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";

export function SkillDesk() {
  const s = useGame((g) => g.s);
  const closeTask = useGame((g) => g.closeTask);
  const closeSkills = useGame((g) => g.closeSkills);
  const stampCog = useGame((g) => g.stampCog);
  const spendSkill = useGame((g) => g.spendSkill);
  const active = s.shift?.board.find((t) => t.id === s.shift.activeId);
  const testing = active?.kind === "cog" && !s.skillSheet;
  const open = testing || !!s.skillOpen;
  const [step, setStep] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<SkillId[]>([]);
  const [tagged, setTagged] = useState(false);

  const travisTags = useMemo(() => (tagged ? travisTagsFrom(picks) : []), [picks, tagged]);

  if (!open) return null;

  const close = () => {
    sfx.click();
    if (testing) closeTask();
    closeSkills();
  };

  const prompt = COG_PROMPTS[step];
  const rider = s.operatives[0];
  const intel = rider ? computeStats(rider).INT : 10;
  const pool = creationPoints(intel) + (s.skillBank ?? 0);

  const pick = (id: string) => {
    if (!prompt) return;
    sfx.click();
    const choice = prompt.choices.find((c) => c.id === id);
    setPicks((p) => ({ ...p, [prompt.id]: id }));
    setReply(choice?.travis ?? null);
  };

  const nextWord = () => {
    sfx.click();
    setReply(null);
    if (step >= COG_PROMPTS.length - 1) {
      const next = travisTagsFrom({ ...picks });
      setTags(next);
      setTagged(true);
      return;
    }
    setStep((n) => n + 1);
  };

  const toggle = (id: SkillId) => {
    sfx.click();
    setTags((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 3) return cur;
      return [...cur, id];
    });
  };

  const stamp = () => {
    if (tags.length !== 3) {
      sfx.hurt();
      return;
    }
    sfx.coin();
    stampCog(tags, travisTags.length === 3 ? travisTags : tags);
  };

  return (
    <>
      <div className="fixed inset-0 z-[44] hidden bg-ink/75 lg:block" aria-hidden />
      <div className="fixed inset-0 z-[45] flex flex-col bg-ink" data-cog="1">
        <header
          className="flex shrink-0 items-center justify-between gap-3 border-b border-line/60 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="min-w-0">
            <p className="font-display text-label uppercase tracking-[0.2em] text-ember">Bay 13 · cognitive</p>
            <h2 className="truncate font-display text-xl text-paper">{testing ? "Travis is sorting you" : "Skill sheet"}</h2>
          </div>
          <button type="button" className="min-h-11 shrink-0 px-2 font-display text-label uppercase tracking-[0.14em] text-moon" onClick={close}>
            Close
          </button>
        </header>

        {testing && !tagged && prompt ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex gap-3 px-4 py-4">
              <img src={CAST.travis.portrait} alt="" className="size-16 shrink-0 rounded-[var(--radius-sm)] object-cover object-top" />
              <div className="min-w-0">
                <p className="font-display text-label uppercase tracking-[0.16em] text-ember">
                  Travis · {step + 1}/{COG_PROMPTS.length}
                </p>
                <p className="mt-1 text-body leading-relaxed text-paper">{reply ?? prompt.ask}</p>
              </div>
            </div>
            <div className="mt-auto space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {reply ? (
                <Button className="w-full" variant="ember" onClick={nextWord}>
                  {step >= COG_PROMPTS.length - 1 ? "Show the tags" : "Next word"}
                </Button>
              ) : (
                prompt.choices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c.id)}
                    className="flex min-h-14 w-full flex-col items-start justify-center rounded-[var(--radius-md)] bg-raised px-3 py-2 text-left shadow-[var(--shadow-border)]"
                  >
                    <span className="font-display text-body text-paper">{c.label}</span>
                    <span className="text-secondary text-moon">“{c.say}”</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        {testing && tagged ? (
          <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-body leading-relaxed text-paper">{travisVerdict(travisTags)}</p>
            <p className="mt-3 text-secondary text-moon">
              Tag three. They start fifteen higher. Stamp, and the bench gets {pool} points from Intellect {intel}
              {(s.skillBank ?? 0) > 0 ? `, plus ${s.skillBank} you already earned` : ""}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {SKILL_IDS.map((id) => {
                const on = tags.includes(id);
                const his = travisTags.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(id)}
                    className={cn(
                      "min-h-14 rounded-[var(--radius-sm)] px-3 py-2 text-left",
                      on ? "bg-ember text-ink" : "bg-raised text-paper shadow-[var(--shadow-border)]",
                    )}
                  >
                    <span className="block font-display text-body">{SKILLS[id].name}</span>
                    <span className={cn("block text-label", on ? "text-ink/70" : "text-muted")}>
                      {his ? "Travis marked this. " : ""}
                      {SKILLS[id].short}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button className="mt-4 w-full" variant="ember" disabled={tags.length !== 3} onClick={stamp}>
              Stamp {tags.length}/3
            </Button>
          </div>
        ) : null}

        {!testing && s.skillSheet ? (
          <SheetBody
            points={s.skillSheet.points}
            values={s.skillSheet.values}
            tags={s.skillSheet.tags}
            travis={s.skillSheet.travisTags}
            onSpend={(id) => {
              const msg = spendSkill(id, 1);
              if (msg) sfx.hurt();
              else sfx.click();
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function SheetBody({
  points,
  values,
  tags,
  travis,
  onSpend,
}: {
  points: number;
  values: Record<SkillId, number>;
  tags: SkillId[];
  travis: SkillId[];
  onSpend: (id: SkillId) => void;
}) {
  return (
    <div className="ms-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <p className="font-display text-2xl tabular-nums text-ember">{points} points</p>
      <p className="mt-1 text-secondary text-moon">
        One point, one number. The die moves every twelve past 25. Tags are already in the number.
      </p>
      <ul className="mt-4 space-y-2">
        {SKILL_IDS.map((id) => {
          const n = values[id] ?? 0;
          const mod = skillMod(n);
          return (
            <li key={id} className="rounded-[var(--radius-sm)] bg-raised px-3 py-2 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-body text-paper">
                    {SKILLS[id].name}
                    <span className="ml-2 tabular-nums text-ember">{n}</span>
                    {tags.includes(id) ? <span className="ml-2 text-label uppercase tracking-[0.12em] text-ember">Tag</span> : null}
                    {travis.includes(id) && !tags.includes(id) ? (
                      <span className="ml-2 text-label uppercase tracking-[0.12em] text-muted">He said</span>
                    ) : null}
                  </p>
                  <p className="text-label text-moon">
                    {mod > 0 ? `+${mod} on the die. ` : mod < 0 ? `${mod} on the die. ` : "No bend yet. "}
                    {SKILLS[id].governs}
                  </p>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-ink">
                    <span className="block h-full bg-ember" style={{ width: `${n}%` }} />
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Spend a point on ${SKILLS[id].name}`}
                  disabled={points < 1 || n >= 100}
                  onClick={() => onSpend(id)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-ember font-display text-xl text-ink disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
