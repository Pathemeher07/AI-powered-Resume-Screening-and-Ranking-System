"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Mail, Phone, MapPin, Briefcase, GraduationCap, CheckCircle, XCircle, Star } from "lucide-react"
import type { Candidate, JobRequirements } from "@/lib/types"
import { getCandidateDisplayName } from "@/lib/candidate-name"

interface CandidateDetailProps {
  candidate: Candidate
  jobRequirements: JobRequirements
}

export function CandidateDetail({ candidate, jobRequirements }: CandidateDetailProps) {
  const [coachConfirmations, setCoachConfirmations] = useState<Record<string, Record<number, string>>>({})
  const [acceptedCoachDrafts, setAcceptedCoachDrafts] = useState<Record<string, string>>({})
  const missingSkills = candidate.missingSkills ?? jobRequirements.requiredSkills.filter((skill) => !candidate.matchedSkills.includes(skill))

  const experienceMatch = candidate.experienceFound === false ? null : candidate.yearsOfExperience >= jobRequirements.minimumExperience

  const educationRank = {
    "High School": 1,
    "Associate's": 2,
    "Bachelor's": 3,
    "Master's": 4,
    PhD: 5,
  }

  const requiredEducationRank = educationRank[jobRequirements.educationLevel as keyof typeof educationRank] || 0
  const candidateEducationRank = educationRank[candidate.educationLevel as keyof typeof educationRank] || 0
  const educationMatch = candidate.educationFound === false ? null : candidateEducationRank >= requiredEducationRank

  return (
    <Card className="overflow-hidden border border-slate-800 bg-[#101a2b] text-slate-100 shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{getCandidateDisplayName(candidate.name)}</CardTitle>
          <Button variant="outline" size="sm" disabled title="Uploaded resume files are not retained after analysis" className="border-slate-700 bg-transparent text-slate-400">
            <Download className="h-4 w-4 mr-2" />
            Resume
          </Button>
        </div>
        <div className="mt-1 text-sm text-slate-400">{candidate.currentTitle}</div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex min-w-0 items-center gap-1 text-sky-300">
            <Mail className="h-4 w-4" />
            <span className="break-all">{candidate.email}</span>
          </div>
          <div className="flex items-center gap-1 text-violet-300">
            <Phone className="h-4 w-4" />
            <span>{candidate.phone}</span>
          </div>
          <div className="flex items-center gap-1 text-teal-300">
            <MapPin className="h-4 w-4" />
            <span>{candidate.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="match">
          <TabsList className="grid w-full grid-cols-4 rounded-lg border border-slate-800 bg-[#0b1424] p-1">
            <TabsTrigger
              value="match"
              className="rounded-md text-xs text-slate-400 data-[state=active]:bg-sky-400/15 data-[state=active]:text-sky-200 sm:text-sm"
            >
              Match
            </TabsTrigger>
            <TabsTrigger
              value="experience"
              className="rounded-md text-xs text-slate-400 data-[state=active]:bg-violet-400/15 data-[state=active]:text-violet-200 sm:text-sm"
            >
              Experience
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="rounded-md text-xs text-slate-400 data-[state=active]:bg-teal-400/15 data-[state=active]:text-teal-200 sm:text-sm"
            >
              Skills
            </TabsTrigger>
            <TabsTrigger value="readiness" className="rounded-md text-xs text-slate-400 data-[state=active]:bg-indigo-400/15 data-[state=active]:text-indigo-200 sm:text-sm">JD Ready</TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="pt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4 text-sky-300" />
                Estimated JD Match Score
              </h3>
              <div className="flex items-center gap-2">
                <div className="h-3 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-4 rounded-full ${
                      candidate.matchScore > 85
                        ? "bg-teal-400"
                        : "bg-sky-400"
                    }`}
                    style={{ width: `${Math.round(candidate.matchScore)}%` }}
                  ></div>
                </div>
                <span className={`font-bold ${candidate.matchScore > 85 ? "text-pink-600" : "text-indigo-600"}`}>
                  {Math.round(candidate.matchScore)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-200">Score components</h3>
              <p className="text-xs leading-5 text-slate-500">Skills 60%, experience 20%, education 10%, and JD relevance 10%. Unstated experience or education is neutral, not a negative finding.</p>

              {candidate.scoreBreakdown && Object.entries(candidate.scoreBreakdown).map(([component, score]) => {
                const weights: Record<string, number> = { requiredSkills: 60, experience: 20, education: 10, jobRelevance: 10 }
                return <div key={component} className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0b1424] p-3 text-sm">
                  <span className="capitalize text-slate-400">{component === "jobRelevance" ? "Job description relevance" : component === "requiredSkills" ? "Required skills" : component}</span>
                  <span className="font-medium text-slate-200">{score}% signal · {weights[component]}% weight</span>
                </div>
              })}

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0b1424] p-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  <span>Experience ({jobRequirements.minimumExperience}+ years)</span>
                </div>
                <div className="flex items-center gap-1">
                  {experienceMatch === null ? (
                    <span className="text-amber-300">Not stated</span>
                  ) : experienceMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-teal-300">{candidate.yearsOfExperience} years</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-rose-300">{candidate.yearsOfExperience} years</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0b1424] p-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <span>Education ({jobRequirements.educationLevel})</span>
                </div>
                <div className="flex items-center gap-1">
                  {educationMatch === null ? (
                    <span className="text-amber-300">Not stated</span>
                  ) : educationMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-teal-300">{candidate.educationLevel}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-rose-300">{candidate.educationLevel}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-[#0b1424] p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-pink-500" />
                  <span>Skills ({jobRequirements.requiredSkills.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`font-medium ${
                      candidate.matchedSkills.length === jobRequirements.requiredSkills.length
                        ? "text-teal-300"
                        : "text-amber-300"
                    }`}
                  >
                    {candidate.matchedSkills.length}/{jobRequirements.requiredSkills.length} matched
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0b1424] p-4">
              <h3 className="text-sm font-medium flex items-center gap-1">
                <Star className="h-4 w-4 text-sky-300" />
                Evidence summary
              </h3>
              <p className="text-sm">{candidate.aiAnalysis}</p>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="pt-4 space-y-4">
            {candidate.experience.length ? candidate.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-purple-300 pl-4 pb-4 relative">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400"></div>
                <div className="font-medium text-sky-200">{exp.title}</div>
                <div className="text-sm font-medium text-violet-200">{exp.company}</div>
                <div className="text-xs text-slate-500">{exp.period}</div>
                <p className="text-sm mt-2">{exp.description}</p>
              </div>
            )) : <p className="text-sm text-slate-400">No employment history could be reliably extracted from the resume text.</p>}
          </TabsContent>

          <TabsContent value="skills" className="pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.matchedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="border border-teal-400/20 bg-teal-400/10 text-teal-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {candidate.matchedSkills.length === 0 && (
                    <p className="text-sm text-muted-foreground">No matched skills found</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill) => (
                    <Badge key={skill} variant="outline" className="border-amber-400/30 text-amber-200">
                      {skill}
                    </Badge>
                  ))}
                  {missingSkills.length === 0 && <p className="text-sm text-teal-300">No required skills missing from extracted text.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 text-indigo-500" />
                  Additional Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.additionalSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="border border-sky-400/20 bg-sky-400/10 text-sky-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="readiness" className="space-y-4 pt-4">
            {candidate.atsReadinessAudit && (
              <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
                <h3 className="text-sm font-medium text-slate-100">ATS readiness audit</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Text status: {candidate.atsReadinessAudit.extraction.quality.replace("_", " ")} · {candidate.atsReadinessAudit.extraction.extractedCharacters} characters · {candidate.atsReadinessAudit.extraction.nonEmptyLines} lines · completeness cannot be confirmed from extracted text alone.
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-3">
                  <div><dt className="text-slate-500">Email</dt><dd>{candidate.atsReadinessAudit.contactDetails.email ? "Detected" : "Not detected"}</dd></div>
                  <div><dt className="text-slate-500">Phone</dt><dd>{candidate.atsReadinessAudit.contactDetails.phone ? "Detected" : "Not detected"}</dd></div>
                  <div><dt className="text-slate-500">Location</dt><dd>{candidate.atsReadinessAudit.contactDetails.location ? "Detected" : "Not detected"}</dd></div>
                  <div><dt className="text-slate-500">Date ranges</dt><dd>{candidate.atsReadinessAudit.dateRangesDetected}</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500">Sections detected</dt><dd>{candidate.atsReadinessAudit.detectedSections.join(", ") || "None of the common headings detected"}</dd></div>
                </dl>
                {candidate.atsReadinessAudit.findings.length ? (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-200">Findings</h4>
                    <ul className="mt-2 space-y-2">
                      {candidate.atsReadinessAudit.findings.map((finding) => (
                        <li key={finding.id} className="border-l-2 border-amber-400/60 pl-3 text-xs">
                          <p className="font-medium text-slate-200">{finding.title} · {finding.classification.replace("_", " ")} · {finding.priority} priority</p>
                          <p className="mt-1 text-slate-400">{finding.reason}</p>
                          <p className="mt-1 text-slate-500">Evidence: {finding.evidence}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-teal-300">No structural or required-term concerns detected by these checks.</p>
                )}
                {candidate.atsReadinessAudit.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-200">Prioritized improvements</h4>
                    <ol className="mt-2 space-y-2">
                      {candidate.atsReadinessAudit.recommendations.map((recommendation, index) => (
                        <li key={`${recommendation.action}-${index}`} className="text-xs text-slate-300">
                          <span className="font-medium text-slate-200">{recommendation.priority}:</span> {recommendation.action}
                          <span className="block text-slate-500">Reason: {recommendation.reason}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {candidate.atsReadinessAudit.contextualNotes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-200">Gemini context</h4>
                    <ul className="mt-2 space-y-2">
                      {candidate.atsReadinessAudit.contextualNotes.map((note, index) => (
                        <li key={`${note.finding}-${index}`} className="text-xs text-slate-300">
                          {note.finding} · {note.status.replace("_", " ")}
                          <span className="block text-slate-500">Evidence: {note.evidence ? `“${note.evidence}”` : "Not found in resume."}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-4 text-xs leading-5 text-slate-500">This audit checks extracted text and common resume signals. It does not reproduce any employer's proprietary ATS or guarantee shortlisting.</p>
              </section>
            )}
            {(candidate.geminiInsights || candidate.geminiInsightsUnavailable) && (
              <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
                <h3 className="text-sm font-medium text-slate-100">Gemini AI insights</h3>
                {candidate.geminiInsights ? (
                  <div className="mt-3 space-y-3 text-sm text-slate-300">
                    <p className="text-xs text-slate-500">“Not found” means the resume did not provide evidence; it does not mean the candidate lacks the skill or experience.</p>
                    <div>
                      <h4 className="font-medium text-slate-200">Skill evidence</h4>
                      <ul className="mt-1 space-y-1">
                        {candidate.geminiInsights.skills.map(({ skill, priority, status, evidence, relatedTerms }, index) => (
                          <li key={`${skill}-${index}`}>
                            <span className="font-medium">{skill}</span> · {priority} · {status.replace("_", " ")}
                            <span className="block text-xs text-slate-400">Evidence: {evidence ? `“${evidence}”` : "Not found in resume."}</span>
                            {relatedTerms.length > 0 && <span className="block text-xs text-slate-400">Related terms: {relatedTerms.join(", ")}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">Relevant projects and experience</h4>
                      <ul className="mt-1 space-y-1">
                        {candidate.geminiInsights.relevantProjectsAndExperience.map(({ finding, status, evidence }, index) => (
                          <li key={`${finding}-${index}`}><span className="font-medium">{finding}</span> · {status.replace("_", " ")}<span className="block text-xs text-slate-400">Evidence: {evidence ? `“${evidence}”` : "Not found in resume."}</span></li>
                        ))}
                        {!candidate.geminiInsights.relevantProjectsAndExperience.length && <li className="text-slate-500">No directly relevant experience identified.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">Transferable experience</h4>
                      <ul className="mt-1 space-y-1">
                        {candidate.geminiInsights.transferableExperience.map(({ finding, status, evidence }, index) => (
                          <li key={`${finding}-${index}`}>{finding} · {status.replace("_", " ")}<span className="block text-xs text-slate-400">Evidence: {evidence ? `“${evidence}”` : "Not found in resume."}</span></li>
                        ))}
                        {!candidate.geminiInsights.transferableExperience.length && <li className="text-slate-500">No transferable experience identified.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">Strengths</h4>
                      <ul className="mt-1 space-y-1">
                        {candidate.geminiInsights.strengths.map(({ finding, status, evidence }, index) => (
                          <li key={`${finding}-${index}`}>{finding} · {status.replace("_", " ")}<span className="block text-xs text-slate-400">Evidence: {evidence ? `“${evidence}”` : "Not found in resume."}</span></li>
                        ))}
                        {!candidate.geminiInsights.strengths.length && <li className="text-slate-500">No evidenced strengths identified.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">Improvement suggestions</h4>
                      <ul className="mt-1 space-y-1">
                        {candidate.geminiInsights.improvementSuggestions.map(({ suggestion, evidenceStatus, evidence }, index) => (
                          <li key={`${suggestion}-${index}`}>{suggestion} · {evidenceStatus.replace("_", " ")}<span className="block text-xs text-slate-400">Evidence: {evidence ? `“${evidence}”` : "Not found in resume."}</span></li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-slate-500">AI-generated insights are separate from the deterministic match score and should be reviewed for accuracy.</p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-amber-200">Gemini insights are unavailable. Your deterministic screening results are unchanged.</p>
                    {candidate.geminiInsightsError && <p className="text-xs leading-5 text-amber-100/80">{candidate.geminiInsightsError}</p>}
                  </div>
                )}
              </section>
            )}
            {candidate.geminiInsights && (
              <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
                <h3 className="text-sm font-medium text-slate-100">Resume improvement coach</h3>
                <p className="mt-1 text-xs text-slate-500">Drafts are separate from your resume. Accepting keeps a local draft here; it does not edit or save the uploaded file.</p>
                {candidate.geminiInsights.coachSuggestions.length ? (
                  <ul className="mt-3 space-y-4">
                    {candidate.geminiInsights.coachSuggestions.map((suggestion) => {
                      const draftKey = `${candidate.id}:${suggestion.id}`
                      const answers = coachConfirmations[draftKey] ?? {}
                      const acceptedDraft = acceptedCoachDrafts[draftKey]
                      const proposedPreview = suggestion.confirmationQuestions.reduce(
                        (text, _question, index) => text.replaceAll(`{{CONFIRM_${index}}}`, answers[index]?.trim() || `{{CONFIRM_${index}}}`),
                        suggestion.proposedText,
                      )
                      const needsConfirmation = suggestion.confirmationQuestions.some((_, index) => !answers[index]?.trim())
                      return (
                        <li key={suggestion.id} className="rounded-md border border-slate-800 p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium capitalize text-slate-200">{suggestion.type.replaceAll("_", " ")}</span>
                            <Badge variant="outline" className="border-sky-400/25 text-sky-200">{suggestion.priority} priority</Badge>
                          </div>
                          <p className="mb-3 text-xs text-slate-400">{suggestion.rationale}</p>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="min-w-0 rounded-md border border-slate-800 bg-[#101a2b] p-3">
                              <h4 className="text-xs font-semibold text-slate-300">Original</h4>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-5 text-slate-400">{suggestion.originalText ?? "No source text: information requires your confirmation."}</pre>
                            </div>
                            <div className="min-w-0 rounded-md border border-sky-400/20 bg-sky-400/[0.04] p-3">
                              <h4 className="text-xs font-semibold text-slate-200">Proposed draft</h4>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-5 text-slate-300">{proposedPreview}</pre>
                            </div>
                          </div>
                          {suggestion.supportingEvidence.length > 0 && <p className="mt-2 text-xs text-slate-500">Resume evidence: {suggestion.supportingEvidence.map((evidence) => `“${evidence}”`).join(" · ")}</p>}
                          {suggestion.confirmationQuestions.map((question, index) => (
                            <label key={`${suggestion.id}-${index}`} className="mt-3 block text-xs text-slate-300">
                              {question}
                              <input
                                value={answers[index] ?? ""}
                                onChange={(event) => {
                                  setCoachConfirmations((current) => ({
                                    ...current,
                                    [draftKey]: { ...current[draftKey], [index]: event.target.value },
                                  }))
                                  setAcceptedCoachDrafts((current) => ({ ...current, [draftKey]: "" }))
                                }}
                                className="mt-1 h-9 w-full rounded-md border border-slate-700 bg-[#101a2b] px-3 text-sm text-slate-100 outline-none focus:border-sky-400"
                              />
                            </label>
                          ))}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              size="sm"
                              disabled={needsConfirmation}
                              onClick={() => setAcceptedCoachDrafts((current) => ({ ...current, [draftKey]: proposedPreview }))}
                              className="bg-sky-500 text-slate-950 hover:bg-sky-400"
                            >
                              {acceptedDraft ? "Update accepted draft" : "Accept draft"}
                            </Button>
                            {acceptedDraft && <span className="text-xs text-teal-300">Accepted copy (not applied to resume): {acceptedDraft}</span>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">No safe, evidence-grounded rewrite suggestions were identified.</p>
                )}
              </section>
            )}
            <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
              <h3 className="text-sm font-medium text-slate-100">Evidence found in resume</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {(candidate.evidence ?? []).map((item) => <li key={item} className="border-l-2 border-teal-400/60 pl-3">{item}</li>)}
                {!candidate.evidence?.length && <li className="text-slate-500">No matched required-skill evidence was extracted.</li>}
              </ul>
            </section>
            <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
              <h3 className="text-sm font-medium text-slate-100">Resume readiness checks</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Readable text extracted: {candidate.aiAnalysis ? "Yes" : "No"}</li>
                <li>Experience dates detected: {candidate.experienceFound ? "Yes" : "Not stated"}</li>
                <li>Education detected: {candidate.educationFound ? "Yes" : "Not stated"}</li>
                <li>Required skill coverage: {candidate.matchedSkills.length}/{jobRequirements.requiredSkills.length}</li>
              </ul>
            </section>
            <section className="rounded-lg border border-slate-800 bg-[#0b1424] p-4">
              <h3 className="text-sm font-medium text-slate-100">Suggestions</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {(candidate.recommendations ?? []).map((item) => <li key={item}>{item}</li>)}
                {!candidate.recommendations?.length && <li>No specific improvement suggestions from the extracted evidence.</li>}
              </ul>
            </section>
            <p className="text-xs leading-5 text-slate-500">A missing item means it was not found in extracted text; it does not establish that the candidate lacks the qualification. This is not an official ATS decision.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
