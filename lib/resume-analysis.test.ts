import assert from "node:assert/strict"
import test from "node:test"
import type { JobRequirements } from "@/lib/types"
import { analyzeResumeText, rankCandidates } from "./resume-analysis"

const requirements: JobRequirements = {
  jobTitle: "Backend Engineer",
  jobDescription: "Build reliable backend services for a cloud platform using Java and PostgreSQL.",
  requiredSkills: ["Java", "PostgreSQL", "AWS"],
  minimumExperience: 3,
  educationLevel: "Bachelor's",
}

test("uses actual resume text for name, contacts, skills, experience, and education", () => {
  const candidate = analyzeResumeText(
    "Avery Chen\nBackend Engineer\navery@example.com\n\nSkills: Java and PostgreSQL\nExperience: 4 years\nBachelor of Science",
    "resume.pdf",
    requirements,
    "resume-1",
  )
  assert.equal(candidate.name, "Avery Chen")
  assert.equal(candidate.email, "avery@example.com")
  assert.deepEqual(candidate.matchedSkills, ["Java", "PostgreSQL"])
  assert.deepEqual(candidate.missingSkills, ["AWS"])
  assert.equal(candidate.yearsOfExperience, 4)
  assert.equal(candidate.educationLevel, "Bachelor's")
  assert.ok(candidate.evidence?.some((item) => item.startsWith("Java:")))
})

test("does not count JavaScript as Java and safely falls back to the filename", () => {
  const candidate = analyzeResumeText("Skills: JavaScript and React", "Jordan Rivera.docx", requirements, "resume-2")
  assert.equal(candidate.name, "Jordan Rivera")
  assert.deepEqual(candidate.matchedSkills, [])
  assert.deepEqual(candidate.missingSkills, ["Java", "PostgreSQL", "AWS"])
})

test("matching evidence affects scores and ranking", () => {
  const strong = analyzeResumeText(
    "Avery Chen\nBackend Engineer\nJava, PostgreSQL, AWS\n5 years experience\nBachelor's degree\nCloud platform backend services",
    "avery.pdf",
    requirements,
    "strong",
  )
  const unrelated = analyzeResumeText("Morgan Lee\nGraphic Designer\nFigma, branding", "morgan.pdf", requirements, "weak")
  assert.ok(strong.matchScore > unrelated.matchScore)
  assert.deepEqual(rankCandidates([unrelated, strong]).map(({ id }) => id), ["strong", "weak"])
})

test("missing education and experience are identified as unstated, not invented", () => {
  const candidate = analyzeResumeText("Casey Example\nJava developer", "casey.pdf", requirements, "resume-3")
  assert.equal(candidate.experienceFound, false)
  assert.equal(candidate.educationFound, false)
  assert.equal(candidate.yearsOfExperience, 0)
  assert.ok(candidate.recommendations?.some((item) => item.includes("employment dates")))
})