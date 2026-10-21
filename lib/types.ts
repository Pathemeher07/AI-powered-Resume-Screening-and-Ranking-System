export interface JobRequirements {
  jobTitle: string
  jobDescription: string
  requiredSkills: string[]
  minimumExperience: number
  educationLevel: string
}

export interface Experience {
  title: string
  company: string
  period: string
  description: string
}

export type ResumeEvidenceStatus = "demonstrated" | "uncertain" | "not_found"

export interface ResumeEvidence {
  finding: string
  status: ResumeEvidenceStatus
  evidence: string | null
}

export interface ResumeSkillInsight {
  skill: string
  priority: "required" | "preferred"
  status: ResumeEvidenceStatus
  evidence: string | null
  relatedTerms: string[]
}

export interface ResumeImprovementSuggestion {
  suggestion: string
  evidenceStatus: ResumeEvidenceStatus
  evidence: string | null
}

export type ResumeCoachSuggestionType = "bullet_point" | "project_emphasis" | "skill_description" | "missing_evidence"

export interface ResumeCoachSuggestion {
  id: string
  type: ResumeCoachSuggestionType
  priority: AtsAuditPriority
  originalText: string | null
  proposedText: string
  rationale: string
  supportingEvidence: string[]
  confirmationQuestions: string[]
}

export interface ResumeInsights {
  skills: ResumeSkillInsight[]
  relevantProjectsAndExperience: ResumeEvidence[]
  transferableExperience: ResumeEvidence[]
  strengths: ResumeEvidence[]
  improvementSuggestions: ResumeImprovementSuggestion[]
  atsContextualNotes: ResumeEvidence[]
  coachSuggestions: ResumeCoachSuggestion[]
}

export type AtsAuditPriority = "high" | "medium" | "low"
export type AtsAuditClassification = "detected_problem" | "possible_risk"

export interface AtsAuditFinding {
  id: string
  area: "extraction" | "contact" | "sections" | "dates" | "job_terms" | "formatting"
  classification: AtsAuditClassification
  priority: AtsAuditPriority
  title: string
  reason: string
  evidence: string
}

export interface AtsAuditRecommendation {
  priority: AtsAuditPriority
  action: string
  reason: string
  evidence: string
}

export interface AtsReadinessAudit {
  extraction: {
    quality: "readable" | "review_recommended" | "limited"
    extractedCharacters: number
    nonEmptyLines: number
    replacementCharacters: number
    completeness: "cannot_confirm_from_extracted_text_alone"
  }
  contactDetails: {
    email: boolean
    phone: boolean
    location: boolean
  }
  detectedSections: string[]
  dateRangesDetected: number
  requiredTermsNotFound: string[]
  findings: AtsAuditFinding[]
  recommendations: AtsAuditRecommendation[]
  contextualNotes: ResumeEvidence[]
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  currentTitle: string
  yearsOfExperience: number
  educationLevel: string
  matchScore: number
  matchedSkills: string[]
  additionalSkills: string[]
  experience: Experience[]
  aiAnalysis: string
  geminiInsights?: ResumeInsights
  geminiInsightsUnavailable?: boolean
  geminiInsightsError?: string
  atsReadinessAudit?: AtsReadinessAudit
  missingSkills?: string[]
  scoreBreakdown?: {
    requiredSkills: number
    experience: number
    education: number
    jobRelevance: number
  }
  evidence?: string[]
  recommendations?: string[]
  experienceFound?: boolean
  educationFound?: boolean
  processingWarnings?: string[]
}
