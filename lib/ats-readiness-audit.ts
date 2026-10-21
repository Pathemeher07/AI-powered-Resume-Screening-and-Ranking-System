import type {
  AtsAuditFinding,
  AtsAuditPriority,
  AtsReadinessAudit,
  JobRequirements,
} from "@/lib/types"
import { extractSkills, normalizeSkill } from "@/lib/job-skills"

const sectionAliases: Array<[string, string[]]> = [
  ["summary", ["summary", "professional summary", "profile", "objective"]],
  ["experience", ["experience", "work experience", "professional experience", "employment history"]],
  ["education", ["education", "academic background"]],
  ["skills", ["skills", "technical skills", "core competencies"]],
  ["projects", ["projects", "selected projects", "project experience"]],
  ["certifications", ["certifications", "certificates", "licenses"]],
]

const dateRangePattern =
  /\b(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(?:present|current|(?:19|20)\d{2})\b/gi

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function containsTerm(text: string, term: string): boolean {
  const canonical = normalizeSkill(term)
  if (extractSkills(text).includes(canonical)) return true
  if (canonical === "Go" || canonical === "REST") return false
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, "iu").test(text)
}

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/[•·|]/g, " ")
    .replace(/[:\s]+$/, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
}

function hasEmail(text: string): boolean {
  return /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text)
}

function hasPhone(text: string): boolean {
  return [...text.matchAll(/\+?\d[\d().\s-]{7,}\d/g)].some((match) => {
    const digits = match[0].replace(/\D/g, "").length
    return digits >= 10 && digits <= 15
  })
}

function hasLocation(text: string): boolean {
  return /\b(?:location|based in)\s*:?\s*[^\r\n]{2,60}/i.test(text)
}

export function createAtsReadinessAudit(
  resumeText: string,
  jobRequirements: JobRequirements,
): AtsReadinessAudit {
  const text = resumeText.trim()
  const nonEmptyLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const extractedCharacters = [...text].length
  const replacementCharacters = [...text].filter((character) => character === "\uFFFD").length
  const findings: AtsAuditFinding[] = []

  const addFinding = (
    finding: Omit<AtsAuditFinding, "id">,
    action: string,
  ) => {
    const id = `${finding.area}-${findings.length + 1}`
    findings.push({ ...finding, id })
    recommendations.push({
      priority: finding.priority,
      action,
      reason: finding.reason,
      evidence: finding.evidence,
    })
  }

  const recommendations: AtsReadinessAudit["recommendations"] = []
  const quality: AtsReadinessAudit["extraction"]["quality"] =
    extractedCharacters < 150 ? "limited" :
      extractedCharacters < 350 || replacementCharacters > 0 ||
        (extractedCharacters > 1200 && nonEmptyLines.length === 1)
        ? "review_recommended"
        : "readable"

  if (extractedCharacters < 350) {
    addFinding({
      area: "extraction",
      classification: "possible_risk",
      priority: extractedCharacters < 150 ? "high" : "medium",
      title: "Brief extracted text",
      reason: "The extracted text is short, so some resume content may not have been captured or may be unusually concise.",
      evidence: `${extractedCharacters} non-whitespace characters extracted.`,
    }, "Review the original document and confirm that all resume sections are selectable and present.")
  }

  if (replacementCharacters > 0) {
    addFinding({
      area: "extraction",
      classification: "detected_problem",
      priority: "high",
      title: "Replacement characters in extracted text",
      reason: "Replacement characters indicate that some source characters did not decode cleanly.",
      evidence: `${replacementCharacters} replacement character(s) (�) found in extracted text.`,
    }, "Check the source document encoding or export a fresh text-based PDF/DOCX.")
  }

  if (extractedCharacters > 1200 && nonEmptyLines.length === 1) {
    addFinding({
      area: "formatting",
      classification: "possible_risk",
      priority: "medium",
      title: "Text appears flattened into one line",
      reason: "A long single-line extraction may have lost paragraph or section boundaries.",
      evidence: `One non-empty line contains ${extractedCharacters} characters.`,
    }, "Review the exported document's reading order and section breaks.")
  }

  const contactDetails = {
    email: hasEmail(text),
    phone: hasPhone(text),
    location: hasLocation(text),
  }
  if (!contactDetails.email) {
    addFinding({
      area: "contact",
      classification: "possible_risk",
      priority: "high",
      title: "Email address not found in extracted text",
      reason: "A contact email was not detected in the text available to this audit.",
      evidence: "No email address pattern was found in extracted text.",
    }, "Confirm that a professional email address appears as readable text in the resume.")
  }
  if (!contactDetails.phone) {
    addFinding({
      area: "contact",
      classification: "possible_risk",
      priority: "medium",
      title: "Phone number not found in extracted text",
      reason: "A phone number was not detected in the text available to this audit.",
      evidence: "No phone number with 10 to 15 digits was found in extracted text.",
    }, "Confirm that a reachable phone number is included if appropriate.")
  }

  const normalizedLines = new Set(nonEmptyLines.map(normalizeHeading))
  const detectedSections = sectionAliases
    .filter(([, aliases]) => aliases.some((alias) => normalizedLines.has(alias)))
    .map(([section]) => section)

  for (const section of ["experience", "education", "skills"]) {
    if (detectedSections.includes(section)) continue
    addFinding({
      area: "sections",
      classification: "possible_risk",
      priority: section === "experience" ? "high" : "medium",
      title: `${section[0].toUpperCase()}${section.slice(1)} heading not detected`,
      reason: `No recognizable ${section} section heading was found in the extracted text; the information may still be present under another heading.`,
      evidence: `No recognized ${section} heading found among extracted lines.`,
    }, `Use a clear ${section} heading if that information is included in the resume.`)
  }

  const dateRangesDetected = [...text.matchAll(dateRangePattern)].length
  if (!dateRangesDetected) {
    addFinding({
      area: "dates",
      classification: "possible_risk",
      priority: "medium",
      title: "No recognizable employment date ranges detected",
      reason: "Dates may help readers understand employment chronology, but none of the supported year-range patterns were found.",
      evidence: "No YYYY-YYYY or Month YYYY-Present style date range was detected.",
    }, "Add clear month/year or year-range dates to relevant roles when accurate.")
  }

  const requiredTermsNotFound = [...new Set(jobRequirements.requiredSkills.map((skill) => skill.trim()).filter(Boolean))]
    .filter((term) => !containsTerm(text, term))
  for (const term of requiredTermsNotFound) {
    addFinding({
      area: "job_terms",
      classification: "possible_risk",
      priority: "high",
      title: `Required term not found: ${term}`,
      reason: `The required term was not found in extracted text; this does not establish that the candidate lacks the skill.`,
      evidence: `“${term}” was not detected in extracted resume text.`,
    }, `If accurate, describe experience with ${term} using terminology that appears in the job description.`)
  }

  const priorityRank: Record<AtsAuditPriority, number> = { high: 0, medium: 1, low: 2 }
  recommendations.sort((first, second) => priorityRank[first.priority] - priorityRank[second.priority])

  return {
    extraction: {
      quality,
      extractedCharacters,
      nonEmptyLines: nonEmptyLines.length,
      replacementCharacters,
      completeness: "cannot_confirm_from_extracted_text_alone",
    },
    contactDetails,
    detectedSections,
    dateRangesDetected,
    requiredTermsNotFound,
    findings,
    recommendations,
    contextualNotes: [],
  }
}