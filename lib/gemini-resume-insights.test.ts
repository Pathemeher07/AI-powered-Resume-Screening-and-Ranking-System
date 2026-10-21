import assert from "node:assert/strict"
import test from "node:test"
import type { Candidate, JobRequirements, ResumeInsights } from "@/lib/types"
import { analyzeResumeText, rankCandidates } from "./resume-analysis"
import {
  addGeminiInsights,
  getGeminiResumeInsights,
  validateGeminiResumeInsights,
} from "./gemini-resume-insights"

const requirements: JobRequirements = {
  jobTitle: "Backend Engineer",
  jobDescription: "Build backend services using TypeScript and PostgreSQL.",
  requiredSkills: ["TypeScript", "PostgreSQL"],
  minimumExperience: 3,
  educationLevel: "Bachelor's",
}

const resumeText = "Avery Chen\nBackend Engineer\nBuilt backend services using TypeScript and PostgreSQL."

const validResponse = {
  skills: [
    { skill: "TypeScript", priority: "required", status: "demonstrated", evidence: "using TypeScript", relatedTerms: [] },
    { skill: "PostgreSQL", priority: "required", status: "not_found", evidence: null, relatedTerms: [] },
  ],
  relevantProjectsAndExperience: [{ finding: "Backend service work", status: "demonstrated", evidence: "Built backend services" }],
  transferableExperience: [{ finding: "No transferable experience identified", status: "not_found", evidence: null }],
  strengths: [{ finding: "Backend service development", status: "demonstrated", evidence: "Built backend services" }],
  improvementSuggestions: [{
    suggestion: "Add measurable project outcomes.",
    evidenceStatus: "not_found",
    evidence: null,
  }],
  atsContextualNotes: [],
  coachSuggestions: [],
} satisfies ResumeInsights

function makeCandidate(id: string, text: string): Candidate {
  return analyzeResumeText(text, `${id}.pdf`, requirements, id)
}

test("does not call Gemini when consent is false", async () => {
  let calls = 0
  const insights = await getGeminiResumeInsights(resumeText, requirements, false, async () => {
    calls += 1
    return JSON.stringify(validResponse)
  })

  assert.equal(insights, null)
  assert.equal(calls, 0)
})

test("validates structured insights and resume-grounded evidence", () => {
  const insights = validateGeminiResumeInsights(validResponse, resumeText, requirements)
  assert.equal(insights.skills.find(({ skill }) => skill === "PostgreSQL")?.status, "not_found")
  assert.equal(insights.skills.find(({ skill }) => skill === "PostgreSQL")?.evidence, null)
  assert.deepEqual(insights.skills[0], validResponse.skills[0])
  assert.throws(
    () => validateGeminiResumeInsights({ ...validResponse, skills: validResponse.skills.slice(0, 1) }, resumeText, requirements),
    /omitted a required skill/,
  )
  assert.throws(
    () => validateGeminiResumeInsights({ ...validResponse, skills: [{ ...validResponse.skills[1], evidence: "no evidence" }] }, resumeText, requirements),
    /not-found skill/,
  )
})

test("recognizes equivalent terminology for preferred skills when resume evidence supports it", () => {
  const job = {
    ...requirements,
    jobDescription: `${requirements.jobDescription} Preferred: REST APIs.`,
  }
  const resume = `${resumeText}\nImplemented HTTP endpoints for internal services.`
  const response = {
    ...validResponse,
    skills: [
      ...validResponse.skills,
      {
        skill: "REST APIs",
        priority: "preferred",
        status: "demonstrated",
        evidence: "Implemented HTTP endpoints",
        relatedTerms: ["HTTP endpoints"],
      },
    ],
  }

  const insights = validateGeminiResumeInsights(response, resume, job)
  const restInsight = insights.skills.find(({ skill }) => skill === "REST APIs")
  assert.equal(restInsight?.priority, "preferred")
  assert.equal(restInsight?.status, "demonstrated")
  assert.deepEqual(restInsight?.relatedTerms, ["HTTP endpoints"])
})

test("marks ambiguous resume evidence as uncertain rather than not-found", () => {
  const resume = `${resumeText}\nSupported PostgreSQL backups with guidance from a senior engineer.`
  const response = {
    ...validResponse,
    skills: validResponse.skills.map((skill) => skill.skill === "PostgreSQL"
      ? { ...skill, status: "uncertain", evidence: "Supported PostgreSQL backups" }
      : skill),
  }

  const insights = validateGeminiResumeInsights(response, resume, requirements)
  assert.equal(insights.skills.find(({ skill }) => skill === "PostgreSQL")?.status, "uncertain")
  assert.equal(insights.skills.find(({ skill }) => skill === "PostgreSQL")?.evidence, "Supported PostgreSQL backups")
})

test("rejects invalid model JSON and response shape", async () => {
  await assert.rejects(
    getGeminiResumeInsights(resumeText, requirements, true, async () => "not json"),
    /invalid JSON/,
  )
  await assert.rejects(
    getGeminiResumeInsights(resumeText, requirements, true, async () => JSON.stringify({ ...validResponse, strengths: [{ finding: "", status: "demonstrated", evidence: "Built backend services" }] })),
    /Invalid Gemini strengths/,
  )
  assert.throws(
    () => validateGeminiResumeInsights({
      ...validResponse,
      improvementSuggestions: [{ suggestion: "Add detail.", evidenceStatus: "demonstrated", evidence: "not in resume" }],
    }, resumeText, requirements),
    /evidence/,
  )
  assert.throws(
    () => validateGeminiResumeInsights({ ...validResponse, strengths: [] }, resumeText, requirements),
    /Invalid Gemini strengths/,
  )
})

test("parses a successful Gemini JSON response into typed insights", async () => {
  const insights = await getGeminiResumeInsights(resumeText, requirements, true, async () => JSON.stringify(validResponse))
  assert.equal(insights?.skills.length, 2)
  assert.equal(insights?.relevantProjectsAndExperience[0].evidence, "Built backend services")
})

test("accepts a rewrite grounded in exact resume text", () => {
  const suggestion = {
    type: "bullet_point",
    priority: "medium",
    originalText: "Built backend services using TypeScript",
    proposedText: "Using TypeScript, built backend services.",
    rationale: "Reorders the existing wording for a clearer opening.",
    supportingEvidence: ["Built backend services using TypeScript"],
    confirmationQuestions: [],
  }
  const result = validateGeminiResumeInsights({
    ...validResponse,
    coachSuggestions: [suggestion],
  }, resumeText, requirements)

  assert.equal(result.coachSuggestions[0].originalText, suggestion.originalText)
  assert.equal(result.coachSuggestions[0].proposedText, suggestion.proposedText)
})

test("rejects fabricated metrics and claims in proposed resume text", () => {
  assert.throws(() => validateGeminiResumeInsights({
    ...validResponse,
    coachSuggestions: [{
      type: "bullet_point",
      priority: "high",
      originalText: "Built backend services using TypeScript",
      proposedText: "Built backend services using TypeScript and improved performance by 40%.",
      rationale: "Add measurable impact.",
      supportingEvidence: ["Built backend services using TypeScript"],
      confirmationQuestions: [],
    }],
  }, resumeText, requirements), /unsupported resume claims/)
})

test("requires explicit confirmation placeholders for missing facts", () => {
  const suggestion = {
    type: "missing_evidence",
    priority: "low",
    originalText: null,
    proposedText: "{{CONFIRM_0}}",
    rationale: "The resume does not state a measurable project result.",
    supportingEvidence: [],
    confirmationQuestions: ["What measurable result, if any, can you verify?"],
  }
  const result = validateGeminiResumeInsights({
    ...validResponse,
    coachSuggestions: [suggestion],
  }, resumeText, requirements)
  assert.equal(result.coachSuggestions[0].proposedText, "{{CONFIRM_0}}")
  assert.equal(result.coachSuggestions[0].confirmationQuestions.length, 1)

  assert.throws(() => validateGeminiResumeInsights({
    ...validResponse,
    coachSuggestions: [{ ...suggestion, proposedText: "Improved performance" }],
  }, resumeText, requirements), /placeholder/)
})

test("does not allow a rewrite to borrow unsupported words from unrelated resume sections", () => {
  const text = `${resumeText}\nUnrelated note: improved performance by 40%.`
  assert.throws(() => validateGeminiResumeInsights({
    ...validResponse,
    coachSuggestions: [{
      type: "bullet_point",
      priority: "high",
      originalText: "Built backend services using TypeScript",
      proposedText: "Built backend services using TypeScript and improved performance by 40%.",
      rationale: "Adds measurable outcome.",
      supportingEvidence: ["Built backend services using TypeScript"],
      confirmationQuestions: [],
    }],
  }, text, requirements), /unsupported resume claims/)
})

test("Gemini failure preserves deterministic scores and ranking", async () => {
  const strong = makeCandidate("strong", `${resumeText}\n5 years experience\nBachelor's degree`)
  const weak = makeCandidate("weak", "Morgan Lee\nGraphic Designer\nFigma and branding")
  const candidates = [strong, weak]
  const originalScores = candidates.map(({ matchScore, scoreBreakdown }) => ({
    matchScore,
    scoreBreakdown: { ...scoreBreakdown },
  }))
  const originalOrder = rankCandidates(candidates).map(({ id }) => id)

  await addGeminiInsights(
    candidates.map((candidate) => ({ candidate, resumeText })),
    requirements,
    true,
    async () => { throw new Error("provider failure") },
  )

  assert.deepEqual(rankCandidates(candidates).map(({ id }) => id), originalOrder)
  assert.deepEqual(candidates.map(({ matchScore, scoreBreakdown }) => ({
    matchScore,
    scoreBreakdown: { ...scoreBreakdown },
  })), originalScores)
  assert.ok(candidates.every((candidate) => candidate.geminiInsightsUnavailable))
  assert.ok(candidates.every((candidate) => candidate.geminiInsightsError === "Gemini request failed. Check the server terminal for Gemini Diagnostics."))
  assert.ok(candidates.every((candidate) => !candidate.geminiInsights))
  assert.ok(candidates.every((candidate) => !candidate.geminiInsights?.coachSuggestions.length))
})

test("shows an actionable message when Gemini quota is exhausted", async () => {
  const candidate = makeCandidate("quota", resumeText)

  await addGeminiInsights(
    [{ candidate, resumeText }],
    requirements,
    true,
    async () => { throw new Error('got status: 429 Too Many Requests. {"error":{"message":"quota exceeded"}}') },
  )

  assert.equal(
    candidate.geminiInsightsError,
    "Gemini rate limit or quota reached. Check your Google AI Studio quota, or wait before trying again.",
  )
})

test("successful insights attach separately without changing score or order", async () => {
  const strong = makeCandidate("strong", `${resumeText}\n5 years experience\nBachelor's degree`)
  const weak = makeCandidate("weak", "Morgan Lee\nGraphic Designer\nFigma and branding")
  const candidates = [weak, strong]
  const scores = candidates.map(({ matchScore }) => matchScore)
  const order = rankCandidates(candidates).map(({ id }) => id)

  await addGeminiInsights(
    candidates.map((candidate) => ({ candidate, resumeText })),
    requirements,
    true,
    async () => validResponse,
  )

  assert.deepEqual(candidates.map(({ matchScore }) => matchScore), scores)
  assert.deepEqual(rankCandidates(candidates).map(({ id }) => id), order)
  assert.ok(candidates.every((candidate) => candidate.geminiInsights?.strengths.length))
})

test("server enrichment does not call the provider when consent is missing", async () => {
  const candidate = makeCandidate("candidate", resumeText)
  let calls = 0

  await addGeminiInsights([{ candidate, resumeText }], requirements, undefined, async () => {
    calls += 1
    return null
  })

  assert.equal(calls, 0)
  assert.equal(candidate.geminiInsights, undefined)
})

test("tolerates whitespace differences between model evidence and multi-line resume text", () => {
  const multilineResume = "Avery Chen\nBuilt backend\nservices using\nTypeScript and PostgreSQL."
  const responseWithSingleLineEvidence = {
    ...validResponse,
    skills: [
      { skill: "TypeScript", priority: "required", status: "demonstrated", evidence: "services using TypeScript", relatedTerms: [] },
      { skill: "PostgreSQL", priority: "required", status: "not_found", evidence: null, relatedTerms: [] },
    ],
    relevantProjectsAndExperience: [{ finding: "Backend service work", status: "demonstrated", evidence: "Built backend services" }],
    atsContextualNotes: [{ finding: "Standard structure observed", status: "demonstrated", evidence: null }],
  }

  const insights = validateGeminiResumeInsights(responseWithSingleLineEvidence, multilineResume, requirements)
  assert.equal(insights.skills[0].status, "demonstrated")
  assert.equal(insights.atsContextualNotes[0].evidence, null)
})