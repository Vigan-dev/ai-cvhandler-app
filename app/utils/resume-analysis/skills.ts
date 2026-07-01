const skillCatalog = [
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "SQL",
  "Postgres",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "Figma",
  "Design Systems",
  "User Research",
  "Product Strategy",
  "Analytics",
  "Machine Learning",
  "Data Analysis",
  "Agile",
  "Leadership",
  "Accessibility",
  "Testing",
  "Architecture",
  "Statistics",
  "Usability",
  "Workshop Facilitation",
  "A/B Testing",
  "B2B SaaS",
  "Prototyping",
];

const skillAliases: Record<string, string[]> = {
  React: ["react", "react.js", "reactjs"],
  TypeScript: ["typescript", "ts"],
  JavaScript: ["javascript", "js", "ecmascript"],
  "Node.js": ["node.js", "nodejs", "node js"],
  Python: ["python"],
  Java: ["java"],
  "C#": ["c#", "c sharp"],
  SQL: ["sql", "structured query language"],
  Postgres: ["postgres", "postgresql"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "microsoft azure"],
  Docker: ["docker", "containers"],
  Kubernetes: ["kubernetes", "k8s"],
  Figma: ["figma"],
  "Design Systems": ["design system", "design systems"],
  "User Research": ["user research", "ux research", "customer research"],
  "Product Strategy": [
    "product strategy",
    "product vision",
    "roadmapping",
    "estrategia de producto",
    "strategie produit",
  ],
  Analytics: ["analytics", "product analytics", "web analytics", "analitica"],
  "Machine Learning": [
    "machine learning",
    "ml",
    "aprendizaje automatico",
    "apprentissage automatique",
  ],
  "Data Analysis": [
    "data analysis",
    "data analytics",
    "analisis de datos",
    "analyse de donnees",
  ],
  Agile: ["agile", "scrum", "kanban"],
  Leadership: [
    "leadership",
    "team lead",
    "mentoring",
    "managed a team",
    "liderazgo",
  ],
  Accessibility: ["accessibility", "wcag", "a11y"],
  Testing: ["testing", "unit tests", "integration tests", "test automation"],
  Architecture: ["architecture", "system design", "technical design"],
  Statistics: ["statistics", "statistical"],
  Usability: ["usability", "usability testing"],
  "Workshop Facilitation": ["workshop facilitation", "facilitated workshops"],
  "A/B Testing": ["a/b testing", "ab testing", "experimentation"],
  "B2B SaaS": ["b2b saas", "enterprise saas"],
  Prototyping: ["prototyping", "prototype", "wireframing"],
};

export function findSkills(
  text: string,
  extraSkills: string[] = [],
  customAliases: Record<string, string[]> = {},
) {
  const skills = [...new Set([...skillCatalog, ...extraSkills])];
  return skills.filter((skill) =>
    matchesSkill(text, skill, customAliases[skill]),
  );
}

export function matchesSkill(
  text: string,
  skill: string,
  customAliases: string[] = [],
) {
  const aliases = [
    ...new Set([skill, ...(skillAliases[skill] ?? []), ...customAliases]),
  ];
  return aliases.some((alias) => matchesPhrase(text, alias));
}

export function matchesPhrase(text: string, phrase: string) {
  const normalizedText = normalizeForMatching(text);
  const normalizedPhrase = normalizeForMatching(phrase);
  const escapedPhrase = escapeRegExp(normalizedPhrase).replace(
    /\s+/g,
    "\\s+",
  );
  const pattern = new RegExp(
    `(?:^|[^a-z0-9+#])${escapedPhrase}(?=$|[^a-z0-9+#])`,
    "i",
  );
  return pattern.test(normalizedText);
}

function normalizeForMatching(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
