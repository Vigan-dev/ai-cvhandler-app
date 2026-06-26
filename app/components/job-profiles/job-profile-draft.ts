import type { JobProfile, RequiredSkillStrictness } from "../../data/job-profiles";
import { normalizeWeights } from "../../hooks/use-job-profiles";

export type JobDraft = {
  name: string;
  description: string;
  requiredSkills: string;
  optionalSkills: string;
  requiredSkillStrictness: RequiredSkillStrictness;
  skillAliases: string;
  minimumExperienceYears: number;
  educationKeywords: string;
  previewText: string;
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  impactWeight: number;
};

export function toJobDraft(profile: JobProfile): JobDraft {
  return {
    name: profile.name,
    description: profile.description,
    requiredSkills: profile.requiredSkills.join(", "),
    optionalSkills: profile.optionalSkills.join(", "),
    requiredSkillStrictness: profile.requiredSkillStrictness ?? "balanced",
    skillAliases: formatAliases(profile.skillAliases),
    minimumExperienceYears: profile.minimumExperienceYears,
    educationKeywords: profile.educationKeywords.join(", "),
    previewText: createPreviewText(profile),
    skillsWeight: Math.round(profile.weights.skills),
    experienceWeight: Math.round(profile.weights.experience),
    educationWeight: Math.round(profile.weights.education),
    impactWeight: Math.round(profile.weights.impact),
  };
}

export function buildProfileFromDraft(
  profile: JobProfile,
  draft: JobDraft,
): JobProfile {
  return {
    ...profile,
    name: draft.name.trim(),
    description: draft.description.trim(),
    requiredSkills: parseJobProfileList(draft.requiredSkills),
    optionalSkills: parseJobProfileList(draft.optionalSkills),
    requiredSkillStrictness: draft.requiredSkillStrictness,
    skillAliases: parseAliases(draft.skillAliases),
    minimumExperienceYears: Math.max(
      0,
      Math.round(draft.minimumExperienceYears),
    ),
    educationKeywords: parseJobProfileList(draft.educationKeywords),
    weights: normalizeWeights({
      skills: draft.skillsWeight,
      experience: draft.experienceWeight,
      education: draft.educationWeight,
      impact: draft.impactWeight,
    }),
  };
}

export function parseJobProfileList(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parseAliases(value: string) {
  return Object.fromEntries(
    value
      .split(/\n/)
      .map((line) => {
        const [skill, aliases] = line.split(":");
        return [skill?.trim(), parseJobProfileList(aliases ?? "")] as const;
      })
      .filter(([skill, aliases]) => skill && aliases.length > 0),
  );
}

function formatAliases(aliases: JobProfile["skillAliases"]) {
  if (!aliases) return "";
  return Object.entries(aliases)
    .map(([skill, values]) => `${skill}: ${values.join(", ")}`)
    .join("\n");
}

function createPreviewText(profile: JobProfile) {
  return `${profile.name} Candidate
${profile.name}
candidate@example.com
Remote
${Math.max(profile.minimumExperienceYears, 1)} years of experience delivering role-relevant work.
Required skills: ${profile.requiredSkills.join(", ")}.
Optional skills: ${profile.optionalSkills.slice(0, 4).join(", ")}.
Improved outcomes by 35% and led cross-functional delivery.
Education: ${profile.educationKeywords[0] ?? "Relevant degree"} from Example University.`;
}
