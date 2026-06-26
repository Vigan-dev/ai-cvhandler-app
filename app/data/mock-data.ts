export type CandidateStatus = "Hire" | "Review" | "Reject";
export type CandidateStage = "New" | "Review" | "Interview" | "Rejected";
export type AnalysisConfidence = "High" | "Medium" | "Low";

export const ANALYSIS_VERSION = "local-rules-v1";

export type Candidate = {
  id: number;
  name: string;
  role: string;
  targetRole?: string;
  targetJobId?: string;
  location: string;
  email?: string;
  phone?: string;
  avatar: string;
  color: string;
  score: number;
  skills: number;
  experience: number;
  education: number;
  status: CandidateStatus;
  stage: CandidateStage;
  submitted: string;
  tags: string[];
  strengths: string[];
  weaknesses: string[];
  sourceFile?: string;
  sourceFingerprint?: string;
  summary?: string;
  experienceYears?: number;
  educationText?: string;
  notes?: string;
  analyzedAt?: string;
  sourceSize?: string;
  analysisConfidence?: AnalysisConfidence;
  analysisVersion?: string;
  scoreReasons?: string[];
  matchedRequiredSkills?: string[];
  missingRequiredSkills?: string[];
};

export const candidates: Candidate[] = [
  {
    id: 1,
    name: "Maya Chen",
    role: "Senior Product Designer",
    targetRole: "Senior Product Designer",
    location: "San Francisco, CA",
    email: "maya.chen@example.com",
    phone: "+1 (415) 555-0148",
    avatar: "MC",
    color: "violet",
    score: 94,
    skills: 96,
    experience: 91,
    education: 88,
    status: "Hire",
    stage: "Interview",
    submitted: "12 min ago",
    tags: ["Figma", "Design Systems", "Research"],
    strengths: ["Exceptional design systems experience", "Strong product thinking", "Clear stakeholder communication"],
    weaknesses: ["Limited fintech domain exposure"],
    experienceYears: 8,
    educationText: "BFA, Interaction Design",
    summary:
      "Maya is a strong match for the Senior Product Designer role, with relevant design-system leadership, product thinking, and user-research experience.",
    analyzedAt: "2026-06-24T10:48:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
  {
    id: 2,
    name: "Daniel Okafor",
    role: "Staff Frontend Engineer",
    targetRole: "Staff Frontend Engineer",
    location: "Austin, TX",
    email: "daniel.okafor@example.com",
    avatar: "DO",
    color: "blue",
    score: 91,
    skills: 94,
    experience: 93,
    education: 79,
    status: "Hire",
    stage: "Review",
    submitted: "34 min ago",
    tags: ["React", "TypeScript", "Architecture"],
    strengths: ["Deep React architecture expertise", "Proven technical leadership", "Strong accessibility background"],
    weaknesses: ["Compensation expectations may be high"],
    experienceYears: 10,
    educationText: "BSc, Computer Science",
    summary:
      "Daniel is a strong match for the Staff Frontend Engineer role, with deep React architecture, accessibility, and technical-leadership experience.",
    analyzedAt: "2026-06-24T10:26:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
  {
    id: 3,
    name: "Sofia Rivera",
    role: "Product Manager",
    targetRole: "Senior Product Manager",
    location: "New York, NY",
    email: "sofia.rivera@example.com",
    avatar: "SR",
    color: "orange",
    score: 87,
    skills: 89,
    experience: 86,
    education: 84,
    status: "Review",
    stage: "Review",
    submitted: "1 hr ago",
    tags: ["Strategy", "Analytics", "B2B SaaS"],
    strengths: ["Strong metrics-driven approach", "Excellent B2B experience", "Compelling product portfolio"],
    weaknesses: ["Limited people management experience"],
    experienceYears: 7,
    educationText: "MBA, Product Strategy",
    summary:
      "Sofia is a promising match for a senior product role, with strong B2B strategy and analytics experience, but her people-management depth needs review.",
    analyzedAt: "2026-06-24T09:00:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
  {
    id: 4,
    name: "Lucas Martin",
    role: "Data Scientist",
    targetRole: "Senior Data Scientist",
    location: "Boston, MA",
    email: "lucas.martin@example.com",
    avatar: "LM",
    color: "green",
    score: 82,
    skills: 86,
    experience: 78,
    education: 92,
    status: "Review",
    stage: "New",
    submitted: "2 hrs ago",
    tags: ["Python", "ML", "SQL"],
    strengths: ["Advanced ML foundations", "Relevant research background"],
    weaknesses: ["Less production deployment experience", "Resume lacks outcome metrics"],
    experienceYears: 5,
    educationText: "MSc, Data Science",
    summary:
      "Lucas has strong machine-learning and academic foundations, but needs further evaluation of production deployment experience.",
    analyzedAt: "2026-06-24T08:00:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
  {
    id: 5,
    name: "Amelia Wilson",
    role: "UX Researcher",
    targetRole: "Senior UX Researcher",
    location: "Remote",
    email: "amelia.wilson@example.com",
    avatar: "AW",
    color: "pink",
    score: 76,
    skills: 81,
    experience: 72,
    education: 85,
    status: "Review",
    stage: "New",
    submitted: "Yesterday",
    tags: ["Research", "Usability", "B2C"],
    strengths: ["Diverse research methodologies", "Strong qualitative synthesis"],
    weaknesses: ["Limited quantitative research", "Portfolio needs more recent work"],
    experienceYears: 5,
    educationText: "MA, Human-Computer Interaction",
    summary:
      "Amelia demonstrates broad qualitative research capability, with quantitative methods and recent portfolio depth requiring further review.",
    analyzedAt: "2026-06-23T11:00:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
  {
    id: 6,
    name: "Noah Thompson",
    role: "Backend Engineer",
    targetRole: "Senior Backend Engineer",
    location: "Chicago, IL",
    email: "noah.thompson@example.com",
    avatar: "NT",
    color: "slate",
    score: 61,
    skills: 68,
    experience: 64,
    education: 55,
    status: "Reject",
    stage: "Rejected",
    submitted: "Yesterday",
    tags: ["Node.js", "Postgres", "AWS"],
    strengths: ["Solid backend fundamentals"],
    weaknesses: ["Seniority below role requirement", "Limited distributed systems experience"],
    experienceYears: 3,
    educationText: "BSc, Software Engineering",
    summary:
      "Noah has relevant backend fundamentals, but his current seniority and distributed-systems experience do not yet meet the target role.",
    analyzedAt: "2026-06-23T09:00:00.000Z",
    analysisVersion: ANALYSIS_VERSION,
  },
];
