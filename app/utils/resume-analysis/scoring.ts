import {
  normalizeWeights,
  type JobProfile,
} from "../../data/job-profiles.ts";
import type {
  AnalysisConfidence,
  Candidate,
  CandidateStatus,
} from "../../data/mock-data.ts";
import { ANALYSIS_VERSION as CURRENT_ANALYSIS_VERSION } from "../../data/mock-data.ts";
import { normalizeText } from "../resume-extractors/shared.ts";
import { findSkills, matchesPhrase, matchesSkill } from "./skills.ts";

const MAX_TEXT_LENGTH = 80_000;

export function analyzeResumeText(
  text: string,
  sourceFile: string,
  sourceSize: string,
  jobProfile: JobProfile,
  id: number,
): Candidate {
  const normalized = normalizeText(text).slice(0, MAX_TEXT_LENGTH);
  if (normalized.length < 80) {
    throw new Error("Not enough readable text was found in this CV");
  }

  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const name = findName(lines, sourceFile);
  const role = findRole(lines, jobProfile.name);
  const email = normalized.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const phone = normalized.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}/)?.[0];
  const location = findLocation(lines);
  const experienceYears = findExperienceYears(normalized);
  const strictness = getStrictnessConfig(jobProfile.requiredSkillStrictness);
  const jobSkillAliases = jobProfile.skillAliases ?? {};
  const jobSkills = [...jobProfile.requiredSkills, ...jobProfile.optionalSkills];
  const tags = findSkills(normalized, jobSkills, jobSkillAliases);
  const educationText = findEducation(normalized);
  const matchedRequiredSkills = jobProfile.requiredSkills.filter((skill) =>
    matchesSkill(normalized, skill, jobSkillAliases[skill]),
  );
  const missingRequiredSkills = jobProfile.requiredSkills.filter(
    (skill) => !matchedRequiredSkills.includes(skill),
  );
  const matchedOptionalSkills = jobProfile.optionalSkills.filter((skill) =>
    matchesSkill(normalized, skill, jobSkillAliases[skill]),
  );
  const requiredRatio = ratio(
    matchedRequiredSkills.length,
    jobProfile.requiredSkills.length,
    1,
  );
  const optionalRatio = ratio(
    matchedOptionalSkills.length,
    jobProfile.optionalSkills.length,
    1,
  );
  const skills = Math.round(
    clamp(
      requiredRatio * strictness.requiredScoreWeight +
        optionalRatio * strictness.optionalScoreWeight +
        Math.min(tags.length, 10) -
        missingRequiredSkills.length * strictness.missingSkillPenalty,
      0,
      100,
    ),
  );
  const experience =
    experienceYears > 0
      ? Math.round(
          clamp(
            ratio(
              experienceYears,
              Math.max(1, jobProfile.minimumExperienceYears),
              1,
            ) *
              85 +
              Math.min(countImpactSignals(normalized) * 3, 15),
            0,
            100,
          ),
        )
      : 35;
  const educationKeywordMatches = jobProfile.educationKeywords.filter(
    (keyword) => matchesPhrase(normalized, keyword),
  );
  const education =
    jobProfile.educationKeywords.length === 0
      ? educationText
        ? 85
        : 65
      : educationKeywordMatches.length > 0
        ? 95
        : educationText
          ? 60
          : 25;
  const impactSignalCount = countImpactSignals(normalized);
  const impact = Math.round(clamp(impactSignalCount * 12.5, 0, 100));
  const weights = normalizeWeights(jobProfile.weights);
  const score = Math.round(
    (skills * weights.skills +
      experience * weights.experience +
      education * weights.education +
      impact * weights.impact) /
      100,
  );
  const status: CandidateStatus =
    score >= 80 && requiredRatio >= strictness.hireRequiredRatio
      ? "Hire"
      : score >= 58 && requiredRatio >= strictness.reviewRequiredRatio
        ? "Review"
        : "Reject";
  const analysisConfidence = getAnalysisConfidence({
    email,
    experienceYears,
    educationText,
    detectedSkillCount: tags.length,
    textLength: normalized.length,
  });

  const strengths = [
    matchedRequiredSkills.length
      ? `Matches ${matchedRequiredSkills.length} of ${jobProfile.requiredSkills.length} required skills for ${jobProfile.name}`
      : "Relevant transferable experience was detected",
    experienceYears > 0
      ? `${experienceYears}+ years of experience referenced`
      : "Practical experience is described in the CV",
    impactSignalCount > 0
      ? `Includes ${impactSignalCount} measurable outcome or delivery signals`
      : "Background is clearly structured",
  ];

  const weaknesses = [
    missingRequiredSkills.length > 0
      ? `Missing explicit evidence for: ${missingRequiredSkills.join(", ")}`
      : "",
    !educationText ? "Education details were not clearly identified" : "",
    impactSignalCount === 0
      ? "Few measurable outcomes were found"
      : "",
  ].filter(Boolean);
  const scoreReasons = [
    `Skills: ${skills}/100 from ${matchedRequiredSkills.length}/${jobProfile.requiredSkills.length} required and ${matchedOptionalSkills.length}/${jobProfile.optionalSkills.length} optional matches. Required-skill strictness: ${jobProfile.requiredSkillStrictness ?? "balanced"}.`,
    experienceYears > 0
      ? `Experience: ${experience}/100 from ${experienceYears} referenced years against a ${jobProfile.minimumExperienceYears}-year target.`
      : "Experience: duration could not be determined reliably.",
    educationText
      ? `Education: ${education}/100 from detected education details.`
      : "Education: no clear education details were detected.",
    `Impact: ${impact}/100 from ${impactSignalCount} measurable outcome signals.`,
  ];

  return {
    id,
    name,
    role,
    targetRole: jobProfile.name,
    targetJobId: jobProfile.id,
    location,
    email,
    phone,
    avatar: getInitials(name),
    color: "violet",
    score,
    skills,
    experience,
    education,
    status,
    stage: status === "Reject" ? "Rejected" : "New",
    submitted: "Just now",
    tags: tags.slice(0, 6),
    strengths,
    weaknesses: weaknesses.length
      ? weaknesses
      : ["Review role-specific expectations during the interview"],
    sourceFile,
    sourceSize,
    experienceYears,
    educationText,
    notes: "",
    analyzedAt: new Date().toISOString(),
    analysisConfidence,
    analysisVersion: CURRENT_ANALYSIS_VERSION,
    scoreReasons,
    matchedRequiredSkills,
    missingRequiredSkills,
    summary: `${name} shows a ${score >= 80 ? "strong" : score >= 58 ? "moderate" : "limited"} match for ${jobProfile.name}. The local analysis found ${matchedRequiredSkills.length} required skills and ${experienceYears || "an undetermined number of"} years of referenced experience.`,
  };
}

function getStrictnessConfig(strictness: JobProfile["requiredSkillStrictness"]) {
  if (strictness === "flexible") {
    return {
      hireRequiredRatio: 0.5,
      reviewRequiredRatio: 0.25,
      requiredScoreWeight: 70,
      optionalScoreWeight: 20,
      missingSkillPenalty: 0,
    };
  }
  if (strictness === "strict") {
    return {
      hireRequiredRatio: 0.85,
      reviewRequiredRatio: 0.6,
      requiredScoreWeight: 90,
      optionalScoreWeight: 8,
      missingSkillPenalty: 12,
    };
  }
  return {
    hireRequiredRatio: 0.65,
    reviewRequiredRatio: 0.35,
    requiredScoreWeight: 80,
    optionalScoreWeight: 15,
    missingSkillPenalty: 5,
  };
}

function findName(lines: string[], sourceFile: string) {
  const candidate = lines.find(
    (line) =>
      line.length >= 3 &&
      line.length <= 60 &&
      /^\p{L}[\p{L} .'-]+$/u.test(line) &&
      !/(resume|curriculum|vitae|profile|summary|experience)/i.test(line),
  );
  if (candidate) return titleCase(candidate);

  return titleCase(
    sourceFile
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(cv|resume)\b/gi, ""),
  );
}

function findRole(lines: string[], fallback: string) {
  return (
    lines.find(
      (line) =>
        line.length <= 80 &&
        /(engineer|designer|manager|scientist|developer|researcher|analyst|architect|specialist|director|ingeniero|ingénieur|entwickler|développeur|desarrollador|diseñador|chercheur|forscher|daten|producto|produit)/i.test(
          line,
        ),
    ) ?? fallback
  );
}

function findLocation(lines: string[]) {
  return (
    lines.find(
      (line) =>
        line.length <= 70 &&
        (/\b(remote|hybrid|remoto|remotely|à distance|hybride)\b/i.test(line) ||
          /\b[A-Za-z .'-]+,\s*[A-Z]{2}\b/.test(line)),
    ) ?? "Location not specified"
  );
}

function findExperienceYears(text: string) {
  const explicit = Array.from(
    text.matchAll(
      /(\d{1,2})\+?\s+(?:years?|yrs?|años|ans|jahre)(?:\s+(?:of|de|d'|an))?\s+(?:experience|experiencia|expérience|erfahrung)?/gi,
    ),
    (match) => Number(match[1]),
  );
  if (explicit.length) return Math.max(...explicit);

  const years = Array.from(
    text.matchAll(/\b(19|20)\d{2}\b/g),
    (match) => Number(match[0]),
  ).filter((year) => year <= new Date().getFullYear());
  if (years.length >= 2) {
    return Math.min(40, Math.max(...years) - Math.min(...years));
  }
  return 0;
}

function findEducation(text: string) {
  const match = text.match(
    /(?:bachelor|master|phd|doctorate|university|college|universidad|université|universität|hochschule|licenciatura|maestr[ií]a|diplom|b\.?sc|m\.?sc|mba)[^\n]{0,100}/i,
  );
  return match?.[0];
}

function countImpactSignals(text: string) {
  return Math.min(
    8,
    (text.match(/\b\d+(?:\.\d+)?%|\b\d+[kKmM]\+?\b|\b(increased|reduced|improved|grew|saved|led|launched|delivered)\b/gi) ?? [])
      .length,
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function ratio(value: number, target: number, maximum: number) {
  if (target <= 0) return maximum;
  return Math.min(maximum, value / target);
}

function getAnalysisConfidence(input: {
  email?: string;
  experienceYears: number;
  educationText?: string;
  detectedSkillCount: number;
  textLength: number;
}): AnalysisConfidence {
  const signals =
    Number(Boolean(input.email)) +
    Number(input.experienceYears > 0) +
    Number(Boolean(input.educationText)) +
    Number(input.detectedSkillCount >= 3) +
    Number(input.textLength >= 500);

  if (signals >= 4) return "High";
  if (signals >= 2) return "Medium";
  return "Low";
}
