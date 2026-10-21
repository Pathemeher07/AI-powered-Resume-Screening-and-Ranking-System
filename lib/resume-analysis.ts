import type { Candidate, Experience, JobRequirements } from "@/lib/types"
import { extractSkills, normalizeSkill } from "@/lib/job-skills"
import { resolveCandidateName } from "@/lib/candidate-name"
import { createAtsReadinessAudit } from "@/lib/ats-readiness-audit"

const educationRanks: Record<string, number> = {
  "High School": 1,
  "Associate's": 2,
  "Bachelor's": 3,
  "Master's": 4,
  PhD: 5,
}

const stopWords = new Set(
  "a an and are as at be by for from has have in is it of on or our the to with will you your this that their role work experience skills required preferred ability candidate team".split(
    " ",
  ),
)

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function containsSkill(text: string, skill: string): boolean {
  const canonicalSkill = normalizeSkill(skill)
  if (extractSkills(text).includes(canonicalSkill)) return true
  if (canonicalSkill === "Go" || canonicalSkill === "REST") return false
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(skill)}(?![\\p{L}\\p{N}])`, "iu").test(text)
}

function extractExperienceYears(text: string): { years: number; found: boolean } {
  const explicitYears = [...text.matchAll(/\b(\d{1,2})\+?\s+years?\b/gi)].map((match) => Number(match[1]))
  if (explicitYears.length) return { years: Math.max(...explicitYears), found: true }

  const periods: Array<[number, number]> = []
  for (const match of text.matchAll(/\b((?:19|20)\d{2})\s*(?:-|–|—|to)\s*(present|current|(?:19|20)\d{2})\b/gi)) {
    const start = Number(match[1])
    const end = /present|current/i.test(match[2]) ? new Date().getFullYear() : Number(match[2])
    if (end >= start && end <= new Date().getFullYear() + 1) periods.push([start, end])
  }
  if (!periods.length) return { years: 0, found: false }

  periods.sort(([first], [second]) => first - second)
  let totalYears = 0
  let [rangeStart, rangeEnd] = periods[0]
  for (const [start, end] of periods.slice(1)) {
    if (start <= rangeEnd) rangeEnd = Math.max(rangeEnd, end)
    else {
      totalYears += rangeEnd - rangeStart
      rangeStart = start
      rangeEnd = end
    }
  }
  return { years: totalYears + rangeEnd - rangeStart, found: true }
}

function extractEducation(text: string): { level: string; found: boolean } {
  const educationTerms: Array<[string, RegExp]> = [
    ["PhD", /\b(?:ph\.?d\.?|doctorate|doctoral)\b/i],
    ["Master's", /\b(?:master'?s?|m\.?s\.?|m\.?a\.?|mba)\b/i],
    ["Bachelor's", /\b(?:bachelor'?s?|b\.?s\.?|b\.?a\.?)\b/i],
    ["Associate's", /\bassociate'?s?\b/i],
    ["High School", /\b(?:high school diploma|ged)\b/i],
  ]
  const match = educationTerms.find(([, pattern]) => pattern.test(text))
  return match ? { level: match[0], found: true } : { level: "Not stated", found: false }
}

function extractExperienceEntries(text: string): Experience[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const entries: Experience[] = []
  const dateLine = /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:present|current|(?:19|20)\d{2})\b/i
  for (let index = 0; index < lines.length; index += 1) {
    if (!dateLine.test(lines[index])) continue
    const title = lines[index - 1] ?? ""
    const description = lines[index + 1] ?? ""
    if (!title || /^experience$/i.test(title)) continue
    entries.push({ title, company: "Not stated", period: lines[index], description })
  }
  return entries
}

function getContextTerms(text: string, excludedSkills: string[]): Set<string> {
  const skillWords = new Set(excludedSkills.flatMap((skill) => skill.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)))
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z][a-z0-9+#.-]{3,}/g)
      ?.filter((word) => !stopWords.has(word) && !skillWords.has(word)) ?? [],
  )
}

function findEvidence(text: string, skill: string): string | undefined {
  const pattern = new RegExp(`.{0,70}${escapeRegExp(skill)}.{0,90}`, "i")
  return text.match(pattern)?.[0]?.replace(/\s+/g, " ").trim()
}

export function analyzeResumeText(
  resumeText: string,
  fileName: string,
  jobRequirements: JobRequirements,
  id: string,
): Candidate {
  const text = resumeText.trim()
  const requiredSkills = [...new Set(jobRequirements.requiredSkills.map(normalizeSkill).filter(Boolean))]
  const detectedSkills = extractSkills(text)
  const matchedSkills = requiredSkills.filter((skill) => containsSkill(text, skill))
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill))
  const additionalSkills = detectedSkills.filter((skill) => !requiredSkills.includes(skill))
  const experienceData = extractExperienceYears(text)
  const educationData = extractEducation(text)
  const requiredEducationRank = educationRanks[jobRequirements.educationLevel] ?? 0
  const candidateEducationRank = educationRanks[educationData.level] ?? 0
  const experienceScore = jobRequirements.minimumExperience === 0
    ? 100
    : experienceData.found
      ? Math.min(100, (experienceData.years / jobRequirements.minimumExperience) * 100)
      : 50
  const educationScore = !requiredEducationRank
    ? 100
    : educationData.found
      ? (candidateEducationRank >= requiredEducationRank ? 100 : 0)
      : 50
  const jobTerms = getContextTerms(`${jobRequirements.jobTitle} ${jobRequirements.jobDescription}`, requiredSkills)
  const resumeTerms = getContextTerms(text, detectedSkills)
  const relevantTermCount = [...jobTerms].filter((term) => resumeTerms.has(term)).length
  const relevanceScore = jobTerms.size ? (relevantTermCount / jobTerms.size) * 100 : 0
  const skillsScore = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 0
  const scoreBreakdown = {
    requiredSkills: Math.round(skillsScore),
    experience: Math.round(experienceScore),
    education: Math.round(educationScore),
    jobRelevance: Math.round(relevanceScore),
  }
  const matchScore = Math.round(
    scoreBreakdown.requiredSkills * 0.6 +
      scoreBreakdown.experience * 0.2 +
      scoreBreakdown.education * 0.1 +
      scoreBreakdown.jobRelevance * 0.1,
  )
  const firstLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? "Not stated"
  const phone = text.match(/(?:\+?\d[\d().\s-]{7,}\d)/)?.[0]?.trim() ?? "Not stated"
  const location = text.match(/\b(?:location|based in)\s*:?\s*([^\r\n]{2,60})/i)?.[1]?.trim() ?? "Not stated"
  const title = firstLines.find((line) =>
    /\b(engineer|developer|analyst|designer|manager|scientist|architect|consultant|specialist|director)\b/i.test(line),
  ) ?? "Title not detected"
  const recommendations = [
    ...missingSkills.map((skill) => `If you have relevant experience with ${skill}, make it explicit in your resume.`),
    ...(!experienceData.found && jobRequirements.minimumExperience > 0
      ? ["Add clear employment dates so relevant experience can be assessed."]
      : []),
    ...(!educationData.found && requiredEducationRank > 0
      ? ["List relevant education or equivalent qualifications if applicable."]
      : []),
    ...(text.length < 500 ? ["The extracted resume text is brief; check that the uploaded document contains readable text."] : []),
  ]
  const evidence = matchedSkills.flatMap((skill) => {
    const context = findEvidence(text, skill)
    return context ? [`${skill}: ${context}`] : [`${skill}: stated in resume text`]
  })
  const experience = extractExperienceEntries(text)
  const candidate = {
    id,
    name: resolveCandidateName(text, fileName),
    email,
    phone,
    location,
    currentTitle: title,
    yearsOfExperience: experienceData.years,
    educationLevel: educationData.level,
    matchScore,
    matchedSkills,
    additionalSkills,
    experience,
    aiAnalysis: `Estimated JD Match Score: ${matchScore}/100. Required skills ${matchedSkills.length}/${requiredSkills.length}; experience ${experienceData.found ? `${experienceData.years} years found` : "not stated"}; education ${educationData.found ? educationData.level : "not stated"}. This is an evidence-based estimate, not a hiring decision.`,
    missingSkills,
    scoreBreakdown,
    evidence,
    recommendations,
    experienceFound: experienceData.found,
    educationFound: educationData.found,
  }

  return {
    ...candidate,
    atsReadinessAudit: createAtsReadinessAudit(text, jobRequirements),
  }
}

export function rankCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((first, second) => second.matchScore - first.matchScore)
}