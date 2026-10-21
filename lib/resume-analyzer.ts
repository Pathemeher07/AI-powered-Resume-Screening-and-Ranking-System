"use server"
import type { JobRequirements, Candidate } from "@/lib/types"
import { analyzeResumeText, rankCandidates } from "@/lib/resume-analysis"
import { extractResumeText } from "@/lib/resume-parser"
import { addGeminiInsights } from "@/lib/gemini-resume-insights"

export async function analyzeResumes(
  files: File[],
  jobRequirements: JobRequirements,
  geminiConsent?: boolean,
): Promise<Candidate[]> {
  if (files.length === 0) throw new Error("Upload at least one resume to analyze.")
  const results = await Promise.allSettled(
    files.map(async (file, index) => {
      const resumeText = await extractResumeText(file)
      return {
        candidate: analyzeResumeText(resumeText, file.name, jobRequirements, String(index + 1)),
        resumeText,
      }
    }),
  )
  const analyzed = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])
  const candidates = analyzed.map(({ candidate }) => candidate)
  const warnings = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : `${files[index].name}: parsing failed.`]
      : [],
  )
  if (!candidates.length) throw new Error(warnings.join(" ") || "No readable resumes were found.")
  if (warnings.length) candidates.forEach((candidate) => { candidate.processingWarnings = warnings })

  await addGeminiInsights(analyzed, jobRequirements, geminiConsent === true)

  return rankCandidates(candidates)
}

