export type JobProfileWeights = {
  skills: number;
  experience: number;
  education: number;
  impact: number;
};

export type RequiredSkillStrictness = "flexible" | "balanced" | "strict";

export type SkillAliases = Record<string, string[]>;

export type JobProfile = {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  optionalSkills: string[];
  requiredSkillStrictness?: RequiredSkillStrictness;
  skillAliases?: SkillAliases;
  minimumExperienceYears: number;
  educationKeywords: string[];
  weights: JobProfileWeights;
  createdAt: string;
  updatedAt: string;
};

export function normalizeWeights(
  weights: JobProfileWeights,
): JobProfileWeights {
  const values = {
    skills: Math.max(0, weights.skills),
    experience: Math.max(0, weights.experience),
    education: Math.max(0, weights.education),
    impact: Math.max(0, weights.impact),
  };
  const total =
    values.skills +
    values.experience +
    values.education +
    values.impact;

  if (total === 0) {
    return { skills: 50, experience: 30, education: 10, impact: 10 };
  }

  return {
    skills: (values.skills / total) * 100,
    experience: (values.experience / total) * 100,
    education: (values.education / total) * 100,
    impact: (values.impact / total) * 100,
  };
}

export function createJobProfileId(name: string, existingIds: string[]) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "job-profile";
  let id = base;
  let suffix = 2;

  while (existingIds.includes(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

const createdAt = "2026-06-25T00:00:00.000Z";

export const defaultJobProfiles: JobProfile[] = [
  createDefaultProfile({
    id: "senior-product-designer",
    name: "Senior Product Designer",
    description:
      "Senior product design role focused on research, systems, accessibility, and cross-functional delivery.",
    requiredSkills: [
      "Figma",
      "Design Systems",
      "User Research",
      "Product Strategy",
    ],
    optionalSkills: ["Accessibility", "Prototyping", "Leadership", "Analytics"],
    requiredSkillStrictness: "balanced",
    skillAliases: {},
    minimumExperienceYears: 6,
    educationKeywords: [
      "design",
      "interaction design",
      "human-computer interaction",
    ],
    weights: { skills: 50, experience: 30, education: 10, impact: 10 },
  }),
  createDefaultProfile({
    id: "staff-frontend-engineer",
    name: "Staff Frontend Engineer",
    description:
      "Frontend architecture role emphasizing React, TypeScript, accessibility, and technical leadership.",
    requiredSkills: ["React", "TypeScript", "JavaScript", "Accessibility"],
    optionalSkills: [
      "Node.js",
      "Design Systems",
      "Leadership",
      "Testing",
      "Architecture",
    ],
    requiredSkillStrictness: "strict",
    skillAliases: {
      TypeScript: ["typed javascript"],
      Accessibility: ["wcag", "a11y"],
    },
    minimumExperienceYears: 8,
    educationKeywords: [
      "computer science",
      "software engineering",
      "information technology",
    ],
    weights: { skills: 50, experience: 35, education: 5, impact: 10 },
  }),
  createDefaultProfile({
    id: "senior-product-manager",
    name: "Senior Product Manager",
    description:
      "Product leadership role focused on strategy, analytics, discovery, and stakeholder alignment.",
    requiredSkills: [
      "Product Strategy",
      "Analytics",
      "User Research",
      "Agile",
    ],
    optionalSkills: [
      "Leadership",
      "Data Analysis",
      "A/B Testing",
      "B2B SaaS",
    ],
    requiredSkillStrictness: "balanced",
    skillAliases: {
      Analytics: ["metrics", "kpis", "product metrics"],
      Agile: ["scrum", "kanban"],
    },
    minimumExperienceYears: 6,
    educationKeywords: ["business", "mba", "product management", "economics"],
    weights: { skills: 45, experience: 35, education: 5, impact: 15 },
  }),
  createDefaultProfile({
    id: "senior-data-scientist",
    name: "Senior Data Scientist",
    description:
      "Applied data science role requiring Python, SQL, machine learning, and measurable production impact.",
    requiredSkills: ["Python", "SQL", "Machine Learning", "Data Analysis"],
    optionalSkills: ["AWS", "Docker", "Statistics", "Leadership", "Analytics"],
    requiredSkillStrictness: "strict",
    skillAliases: {
      "Machine Learning": ["ml", "predictive modeling"],
      "Data Analysis": ["data analytics", "analysis of data"],
    },
    minimumExperienceYears: 5,
    educationKeywords: [
      "data science",
      "computer science",
      "statistics",
      "mathematics",
    ],
    weights: { skills: 50, experience: 30, education: 10, impact: 10 },
  }),
  createDefaultProfile({
    id: "senior-ux-researcher",
    name: "Senior UX Researcher",
    description:
      "Research role balancing qualitative methods, quantitative insight, facilitation, and product influence.",
    requiredSkills: [
      "User Research",
      "Usability",
      "Data Analysis",
      "Product Strategy",
    ],
    optionalSkills: [
      "Analytics",
      "Workshop Facilitation",
      "A/B Testing",
      "Leadership",
    ],
    requiredSkillStrictness: "balanced",
    skillAliases: {
      Usability: ["usability testing", "user testing"],
      "Workshop Facilitation": ["facilitated workshops"],
    },
    minimumExperienceYears: 5,
    educationKeywords: [
      "psychology",
      "human-computer interaction",
      "research",
      "design",
    ],
    weights: { skills: 50, experience: 30, education: 10, impact: 10 },
  }),
  createDefaultProfile({
    id: "senior-backend-engineer",
    name: "Senior Backend Engineer",
    description:
      "Backend role focused on APIs, data systems, cloud infrastructure, testing, and distributed systems.",
    requiredSkills: ["Node.js", "SQL", "Postgres", "AWS"],
    optionalSkills: [
      "Docker",
      "Kubernetes",
      "TypeScript",
      "Testing",
      "Architecture",
    ],
    requiredSkillStrictness: "strict",
    skillAliases: {
      "Node.js": ["nodejs", "node js"],
      Postgres: ["postgresql"],
    },
    minimumExperienceYears: 6,
    educationKeywords: [
      "computer science",
      "software engineering",
      "information technology",
    ],
    weights: { skills: 50, experience: 35, education: 5, impact: 10 },
  }),
];

function createDefaultProfile(
  profile: Omit<JobProfile, "createdAt" | "updatedAt">,
): JobProfile {
  return {
    ...profile,
    createdAt,
    updatedAt: createdAt,
  };
}
