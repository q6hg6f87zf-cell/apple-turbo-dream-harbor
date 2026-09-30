import { recommendTags } from "./skills";
import type { SkillId } from "./types";

export interface CogChoice {
  id: string;
  label: string;
  /** What you said, in the bay, not a menu. */
  say: string;
  /** Travis, after. He does not cheer. */
  travis: string;
  weights: Partial<Record<SkillId, number>>;
}

export interface CogPrompt {
  id: string;
  /** Travis, before the answers. */
  ask: string;
  choices: CogChoice[];
}

/**
 * Doc Mitchell's word test, in Bay 13.
 * Eight words. Weights, not a personality quiz result screen.
 */
export const COG_PROMPTS: CogPrompt[] = [
  {
    id: "tick",
    ask: "Bay's dark. Something in the jig is ticking. First word.",
    choices: [
      {
        id: "cut",
        label: "Cut it",
        say: "Cut the wire.",
        travis: "You cut before you know the circuit. That's Explosives, or a short life. Both, some days.",
        weights: { explosives: 3, repair: 1 },
      },
      {
        id: "count",
        label: "Count the ticks",
        say: "Count them. Don't touch it.",
        travis: "Counting. Science. You might still be here at dusk. That's allowed.",
        weights: { science: 3, sneak: 1 },
      },
      {
        id: "ask",
        label: "Ask who left it",
        say: "Who left a tick in your jig?",
        travis: "You asked a question in a room with a bomb. Speech. Bold. Stupid-adjacent.",
        weights: { speech: 3, barter: 1 },
      },
    ],
  },
  {
    id: "wheel",
    ask: "Tyrone's drive wheel is chewing the left side. He won't say it hurts. It does.",
    choices: [
      {
        id: "pull",
        label: "Pull the hub",
        say: "Get the hub off. I'll hold him.",
        travis: "Hands on the hub. Repair, and a little Melee for the bolt that doesn't want to.",
        weights: { repair: 3, melee: 1 },
      },
      {
        id: "plate",
        label: "Read the plate",
        say: "There's a service plate. Read it first.",
        travis: "The plate is older than both of us. Science. Lockpick, if the screws are Kane's.",
        weights: { science: 2, lockpick: 2 },
      },
      {
        id: "still",
        label: "Tell him to hold",
        say: "Tyrone. Hold still. I'm not asking.",
        travis: "You talked to a machine like it was a patient. Medicine and Speech. He'll allow it. Once.",
        weights: { speech: 2, medicine: 2 },
      },
    ],
  },
  {
    id: "price",
    ask: "Holt names a price at the Gate. It is a lie. You both know.",
    choices: [
      {
        id: "walk",
        label: "Walk",
        say: "Keep it. I'm walking.",
        travis: "Walking off a bad price is Survival. Sneak, if you don't want him watching which road.",
        weights: { survival: 2, sneak: 2 },
      },
      {
        id: "number",
        label: "Name the real number",
        say: "That's not the number. Say the real one.",
        travis: "Barter. You didn't raise your voice. I almost respect it.",
        weights: { barter: 3, speech: 1 },
      },
      {
        id: "gun",
        label: "Put a gun on the crate",
        say: "The crate stays. The price changes.",
        travis: "Guns on a stall. Holt will remember the serial. So will Kane, eventually.",
        weights: { guns: 3, explosives: 1 },
      },
    ],
  },
  {
    id: "shepherd",
    ask: "A manifest. The word SHEPHERD is half burned. The rest is Kane's ink.",
    choices: [
      {
        id: "finish",
        label: "Finish the word",
        say: "Finish it. I want the whole line.",
        travis: "You complete other people's sentences when they tried to hide them. Science. Lockpick.",
        weights: { science: 2, lockpick: 2 },
      },
      {
        id: "burn",
        label: "Burn the rest",
        say: "Burn what's left. She doesn't get the copy.",
        travis: "Fire. Explosives if you're honest. Sneak if you pretend it was the stove.",
        weights: { explosives: 2, sneak: 2 },
      },
      {
        id: "sell",
        label: "Sell it unread",
        say: "I know a buyer who pays for half a word.",
        travis: "Unread and priced. Barter. I will not be that buyer.",
        weights: { barter: 3, speech: 1 },
      },
    ],
  },
  {
    id: "berm",
    ask: "Someone is down on the berm. The white visor is still walking.",
    choices: [
      {
        id: "drag",
        label: "Drag them in",
        say: "I drag. The visor can paint the dirt.",
        travis: "Medicine. Melee, because dragging a body is not a kindness, it's a lift.",
        weights: { medicine: 3, melee: 1 },
      },
      {
        id: "light",
        label: "Kill the visor first",
        say: "The light goes out before I touch them.",
        travis: "Guns, or Sneak if you meant the lamps and not the woman. Say which, later.",
        weights: { guns: 2, sneak: 2 },
      },
      {
        id: "talk",
        label: "Talk her off the ridge",
        say: "Lyra. You're painting a patient. Stop.",
        travis: "You used a name. Speech. If she answers, you owe her a true sentence.",
        weights: { speech: 3, barter: 1 },
      },
    ],
  },
  {
    id: "crates",
    ask: "Three crates. One ticks. You have to touch one.",
    choices: [
      {
        id: "warm",
        label: "The warm one",
        say: "Warm. That's the charge. I want it where I can see it.",
        travis: "Explosives. You walk toward the tick. Science, because you checked heat and not the stencil.",
        weights: { explosives: 3, science: 1 },
      },
      {
        id: "quiet",
        label: "The quiet one",
        say: "The quiet one. Quiet is where people hide the good steel.",
        travis: "Sneak's instinct. Lockpick's hands. Don't confuse them when the lid sticks.",
        weights: { sneak: 2, lockpick: 2 },
      },
      {
        id: "name",
        label: "The one with a name",
        say: "Someone wrote a name. I open that one.",
        travis: "A name is a handle. Speech. Sometimes Barter. Sometimes a funeral.",
        weights: { speech: 2, barter: 2 },
      },
    ],
  },
  {
    id: "guitar",
    ask: "The guitar on my wall. You keep looking at it.",
    choices: [
      {
        id: "tune",
        label: "Tune it",
        say: "It's flat. I'll tune it if you don't shoot me.",
        travis: "Repair. You touch another man's instrument like it's a bolt. I allow the bolt.",
        weights: { repair: 3, science: 1 },
      },
      {
        id: "leave",
        label: "Leave it",
        say: "It's yours. I didn't come for the song.",
        travis: "Sneak, almost. Survival, really. You didn't pick up what isn't the job.",
        weights: { survival: 2, sneak: 2 },
      },
      {
        id: "song",
        label: "Ask the song",
        say: "What song. Who laughed.",
        travis: "That is the test I give the chassis. You asked it of me. Speech. I'll remember you asked.",
        weights: { speech: 3, medicine: 1 },
      },
    ],
  },
  {
    id: "watch",
    ask: "One watch left. The board is still full. What do you take.",
    choices: [
      {
        id: "required",
        label: "The sealed line",
        say: "The one that happens to us if we sleep.",
        travis: "Survival. Repair, if the sealed line is a leak and not a gun.",
        weights: { survival: 2, repair: 2 },
      },
      {
        id: "pays",
        label: "The one that pays",
        say: "The one with caps on it. The rest can hate me at dawn.",
        travis: "Barter. Guns, if the pay is a bounty and you pretend it's a delivery.",
        weights: { barter: 3, guns: 1 },
      },
      {
        id: "kane",
        label: "The one Kane posted",
        say: "Hers. I want to know what she thinks we are.",
        travis: "Sneak if you read it and leave. Speech if you answer it. Either way she gets a file.",
        weights: { sneak: 2, speech: 2 },
      },
    ],
  },
];

export function tallyCog(picks: Record<string, string>): Partial<Record<SkillId, number>> {
  const weights: Partial<Record<SkillId, number>> = {};
  for (const prompt of COG_PROMPTS) {
    const choice = prompt.choices.find((c) => c.id === picks[prompt.id]);
    if (!choice) continue;
    for (const [id, n] of Object.entries(choice.weights) as [SkillId, number][]) {
      weights[id] = (weights[id] ?? 0) + n;
    }
  }
  return weights;
}

export function travisTagsFrom(picks: Record<string, string>): SkillId[] {
  return recommendTags(tallyCog(picks));
}

export function travisVerdict(tags: SkillId[]): string {
  const [a, b, c] = tags;
  if (!a || !b || !c) return "You didn't finish. Sit back down.";
  return `You bend toward ${cap(a)}, ${cap(b)}, and ${cap(c)}. I can stamp those. You can lie to me on the tags. The jobs will not.`;
}

function cap(id: SkillId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
