import { z } from "zod";
import { DEVICES } from "@/types/taxonomy";

const device = z.enum(DEVICES);
const strengths = z.enum(["talk", "chemistry", "skill", "creation", "reaction"]);
const structure = z.enum(["coop", "versus", "mind_game", "talk"]);

// 합방 멤버는 별명·방송상 역할·기기·보유 게임만 받는다. strict()라서 실명·연락처 같은 다른 항목이 오면 거부한다.
const member = z
  .object({
    name: z.string().trim().max(30),
    note: z.string().trim().max(100),
    devices: z.array(device).min(1).max(DEVICES.length),
    ownedGameIds: z.array(z.string().max(64)).max(200).optional(),
  })
  .strict();

export const profileSchema = z
  .object({
    mode: z.enum(["solo", "small", "large"]),
    strengths: z.array(strengths).max(5),
    persona: z.string().trim().max(500),
    usesCam: z.boolean(),
    audience: z.enum(["s", "m", "l"]),
    devices: z.array(device).min(1).max(DEVICES.length),
    length: z.enum(["single", "full_day", "series"]),
    timeSlot: z.enum(["day", "evening", "late_night"]),
    goal: z.enum(["acquire", "retain", "both"]),
    hasCommunity: z.boolean(),
    communityActivity: z.enum(["low", "mid", "high"]).optional(),
    allowRotation: z.boolean(),
    allowLeague: z.boolean(),
    excludedGameIds: z.array(z.string().max(64)).max(200),
    excludedGenres: z.array(z.string().trim().max(40)).max(30),
    avoidHorror: z.boolean(),
    avoidMotionSickness: z.boolean(),
    avoidSpoilers: z.boolean(),
    includeTrend: z.boolean(),
    memberCount: z.number().int().min(2).max(12).optional(),
    members: z.array(member).min(2).max(12).optional(),
    chemistryLevel: z.enum(["first", "some", "long"]).optional(),
    desiredStructures: z.array(structure).max(4).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.mode === "solo") return;
    const n = p.members?.length ?? 0;
    const [min, max] = p.mode === "small" ? [2, 5] : [6, 12];
    if (n < min || n > max) {
      ctx.addIssue({ code: "custom", path: ["members"], message: p.mode === "small" ? "membersSmall" : "membersLarge" }); // 번역 키(recoErrors.<키>)
    }
  });

export type ProfileInput = z.infer<typeof profileSchema>;

// 실제 참여 인원. 혼방은 1명, 합방은 입력한 멤버 수.
export const memberCountOf = (p: ProfileInput): number => (p.mode === "solo" ? 1 : (p.members?.length ?? 0));
