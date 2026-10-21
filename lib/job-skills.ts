const skillAliases: Record<string, string[]> = {
  JavaScript: ["javascript", "js", "ecmascript"],
  TypeScript: ["typescript", "ts"],
  Java: ["java", "jdk", "j2ee"],
  Python: ["python"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "c sharp"],
  Go: ["golang"],
  Rust: ["rust"],
  PHP: ["php"],
  Ruby: ["ruby"],
  Swift: ["swift"],
  Kotlin: ["kotlin"],
  Scala: ["scala"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3"],
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs"],
  Angular: ["angular", "angular.js", "angularjs"],
  "Vue.js": ["vue", "vue.js", "vuejs"],
  "Node.js": ["node.js", "nodejs"],
  Express: ["express", "express.js"],
  Django: ["django"],
  Flask: ["flask"],
  FastAPI: ["fastapi"],
  Spring: ["spring", "spring boot"],
  ".NET": [".net", "dotnet", "asp.net"],
  "Ruby on Rails": ["ruby on rails", "rails"],
  SQL: ["sql"],
  PostgreSQL: ["postgresql", "postgres"],
  MySQL: ["mysql"],
  SQLite: ["sqlite"],
  MongoDB: ["mongodb", "mongo db"],
  Redis: ["redis"],
  Elasticsearch: ["elasticsearch", "elastic search"],
  DynamoDB: ["dynamodb"],
  Oracle: ["oracle database", "oracle db"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud platform", "google cloud"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  Terraform: ["terraform"],
  Git: ["git"],
  GitHub: ["github"],
  GitLab: ["gitlab"],
  Jenkins: ["jenkins"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous delivery"],
  Linux: ["linux"],
  GraphQL: ["graphql"],
  REST: ["rest api", "restful api"],
  Kafka: ["kafka", "apache kafka"],
  Spark: ["apache spark", "spark"],
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
  "Machine Learning": ["machine learning", "ml"],
  "Deep Learning": ["deep learning"],
  NLP: ["natural language processing", "nlp"],
  LLMs: ["large language models", "llm", "llms"],
  "Generative AI": ["generative ai", "genai"],
  OpenAI: ["openai"],
  LangChain: ["langchain"],
  Communication: ["communication", "written communication", "verbal communication"],
  Leadership: ["leadership", "team leadership"],
  Collaboration: ["collaboration", "teamwork"],
  "Project Management": ["project management"],
  "Problem Solving": ["problem solving", "problem-solving"],
  Agile: ["agile", "scrum"],
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const skillPatterns = Object.entries(skillAliases).map(([skill, aliases]) => ({
  skill,
  pattern: new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${aliases
      .slice()
      .sort((first, second) => second.length - first.length)
      .map(escapeRegExp)
      .join("|")})(?![\\p{L}\\p{N}])`,
    "iu",
  ),
}))

const aliasesToSkill = new Map<string, string>()
for (const [skill, aliases] of Object.entries(skillAliases)) {
  aliasesToSkill.set(skill.toLocaleLowerCase(), skill)
  for (const alias of aliases) aliasesToSkill.set(alias.toLocaleLowerCase(), skill)
}

export function normalizeSkill(value: string): string {
  const trimmed = value.trim()
  return aliasesToSkill.get(trimmed.toLocaleLowerCase()) ?? trimmed
}

export function extractSkills(text: string): string[] {
  return skillPatterns.filter(({ pattern }) => pattern.test(text)).map(({ skill }) => skill)
}

export function extractSkillsFromJobDescription(jobDescription: string): string[] {
  return extractSkills(jobDescription)
}

export function mergeJobSkills(detected: string[], manual: string[], removed: string[]): string[] {
  const removedKeys = new Set(removed.map((skill) => normalizeSkill(skill).toLocaleLowerCase()))
  const merged = [...detected.filter((skill) => !removedKeys.has(normalizeSkill(skill).toLocaleLowerCase())), ...manual]
  const unique = new Map<string, string>()
  for (const skill of merged) {
    const normalized = normalizeSkill(skill)
    if (normalized && !removedKeys.has(normalized.toLocaleLowerCase())) unique.set(normalized.toLocaleLowerCase(), normalized)
  }
  return [...unique.values()]
}