import assert from "node:assert/strict"
import test from "node:test"
import type { JobRequirements } from "@/lib/types"
import { createAtsReadinessAudit } from "./ats-readiness-audit"

const requirements: JobRequirements = {
  jobTitle: "Backend Engineer",
  jobDescription: "Build backend services with Java, AWS, and PostgreSQL.",
  requiredSkills: ["Java", "AWS", "PostgreSQL"],
  minimumExperience: 3,
  educationLevel: "Bachelor's",
}

test("flags short or replacement-character extraction as evidence-based risk", () => {
  const audit = createAtsReadinessAudit("Name\nemail@example.com\n�", requirements)

  assert.equal(audit.extraction.quality, "limited")
  assert.equal(audit.extraction.completeness, "cannot_confirm_from_extracted_text_alone")
  assert.ok(audit.findings.some(({ area, title }) => area === "extraction" && title === "Brief extracted text"))
  assert.ok(audit.findings.some(({ classification, title }) => classification === "detected_problem" && title.includes("Replacement characters")))
})

test("reports common headings that are not detected without claiming their contents are absent", () => {
  const text = [
    "Taylor Morgan",
    "taylor@example.com | 555-212-7788 | Location: Portland, OR",
    "Backend engineering and platform delivery across cloud environments. Designed and maintained production services, collaborated with product teams, improved reliability, and documented operational procedures for internal users.",
    "Backend Engineer | Northwind | 2021 - 2024",
    "Delivered service improvements, mentored teammates, and coordinated releases across multiple engineering groups.",
  ].join("\n")
  const audit = createAtsReadinessAudit(text, requirements)
  const missingHeadings = audit.findings.filter(({ area }) => area === "sections")

  assert.deepEqual(missingHeadings.map(({ title }) => title), [
    "Experience heading not detected",
    "Education heading not detected",
    "Skills heading not detected",
  ])
  assert.ok(missingHeadings.every(({ classification, reason }) =>
    classification === "possible_risk" && reason.includes("may still be present"),
  ))
})

test("reports required JD terms absent from extracted text with prioritized reasons", () => {
  const text = [
    "Taylor Morgan",
    "taylor@example.com | 555-212-7788 | Location: Portland, OR",
    "SUMMARY",
    "Backend engineer with several years of experience building cloud services and supporting customer-facing applications.",
    "EXPERIENCE",
    "Backend Engineer | Northwind | 2021 - 2024",
    "EDUCATION",
    "Bachelor of Science",
    "SKILLS",
    "TypeScript, Linux, service design",
  ].join("\n")
  const audit = createAtsReadinessAudit(text, requirements)

  assert.deepEqual(audit.requiredTermsNotFound, ["Java", "AWS", "PostgreSQL"])
  assert.ok(audit.findings.filter(({ area }) => area === "job_terms").every(({ priority, reason, evidence }) =>
    priority === "high" && reason.includes("does not establish") && evidence.includes("not detected"),
  ))
  assert.ok(audit.recommendations.some(({ priority, reason, action }) =>
    priority === "high" && reason.includes("not establish") && action.includes("If accurate"),
  ))
})

test("does not warn on a clearly structured resume or match Java inside JavaScript", () => {
  const text = [
    "Taylor Morgan",
    "taylor@example.com | 555-212-7788 | Location: Portland, OR",
    "SUMMARY",
    "Backend engineer with extensive experience building cloud services, improving reliability, and collaborating across product and platform teams. Known for clear documentation, thoughtful incident response, and measurable delivery improvements.",
    "SKILLS",
    "JavaScript, AWS, PostgreSQL, Linux, service design",
    "EXPERIENCE",
    "Backend Engineer | Northwind | Jan 2021 - Present",
    "Built scalable services on AWS, maintained PostgreSQL systems, and improved operational reliability for internal products.",
    "EDUCATION",
    "Bachelor of Science in Computer Science, 2020",
  ].join("\n")
  const audit = createAtsReadinessAudit(text, requirements)

  assert.deepEqual(audit.requiredTermsNotFound, ["Java"])
  assert.ok(!audit.findings.some(({ area }) => area === "formatting" || area === "extraction"))
  assert.equal(audit.detectedSections.includes("experience"), true)
  assert.equal(audit.detectedSections.includes("skills"), true)
  assert.equal(audit.detectedSections.includes("education"), true)
  assert.ok(audit.findings.every(({ classification }) => classification !== "detected_problem"))
})