"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Download, User, BarChart3, ArrowUpDown, Sparkles } from "lucide-react"
import type { Candidate, JobRequirements } from "@/lib/types"
import { getCandidateDisplayName } from "@/lib/candidate-name"
import { CandidateDetail } from "@/components/candidate-detail"
import { motion, AnimatePresence } from "framer-motion"

interface CandidateResultsProps {
  candidates: Candidate[]
  jobRequirements: JobRequirements
  searchTerm: string
}

export function CandidateResults({ candidates, jobRequirements, searchTerm }: CandidateResultsProps) {
  const [sortBy, setSortBy] = useState<"score" | "experience" | "education">("score")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)

  const exportCandidates = () => {
    const csvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const rows = [
      ["Name", "Current Title", "Match Score"],
      ...sortedCandidates.map((candidate) => [
        getCandidateDisplayName(candidate.name),
        candidate.currentTitle,
        `${Math.round(candidate.matchScore)}%`,
      ]),
    ]
    const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n")
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = "candidates.csv"
    link.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const sortedCandidates = [...candidates]
    .filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.matchedSkills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === "score") {
        comparison = a.matchScore - b.matchScore
      } else if (sortBy === "experience") {
        comparison = a.yearsOfExperience - b.yearsOfExperience
      } else if (sortBy === "education") {
        const educationRank = {
          "High School": 1,
          "Associate's": 2,
          "Bachelor's": 3,
          "Master's": 4,
          PhD: 5,
        }
        comparison =
          (educationRank[a.educationLevel as keyof typeof educationRank] || 0) -
          (educationRank[b.educationLevel as keyof typeof educationRank] || 0)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  const selectedCandidate = sortedCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? sortedCandidates[0] ?? null

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(330px,0.88fr)]">
      <div className="min-w-0">
        <Card className="overflow-hidden border border-slate-800 bg-[#101a2b] text-slate-100 shadow-xl">
          <CardHeader className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  Candidate Rankings
                </CardTitle>
                <CardDescription className="mt-1 text-slate-400">
                  {sortedCandidates.length} of {candidates.length} candidates · {jobRequirements.jobTitle}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCandidates}
                className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "score") {
                    toggleSortOrder()
                  } else {
                    setSortBy("score")
                    setSortOrder("desc")
                  }
                }}
                className={`flex items-center gap-1 ${
                  sortBy === "score"
                    ? "bg-sky-400/15 text-sky-200 hover:bg-sky-400/25"
                    : "border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Match Score
                {sortBy === "score" && <ArrowUpDown className="h-3 w-3 ml-1" />}
              </Button>

              <Button
                variant={sortBy === "experience" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "experience") {
                    toggleSortOrder()
                  } else {
                    setSortBy("experience")
                    setSortOrder("desc")
                  }
                }}
                className={`flex items-center gap-1 ${
                  sortBy === "experience"
                    ? "bg-violet-400/15 text-violet-200 hover:bg-violet-400/25"
                    : "border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Experience
                {sortBy === "experience" && <ArrowUpDown className="h-3 w-3 ml-1" />}
              </Button>

              <Button
                variant={sortBy === "education" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "education") {
                    toggleSortOrder()
                  } else {
                    setSortBy("education")
                    setSortOrder("desc")
                  }
                }}
                className={`flex items-center gap-1 ${
                  sortBy === "education"
                    ? "bg-teal-400/15 text-teal-200 hover:bg-teal-400/25"
                    : "border-slate-700 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                Education
                {sortBy === "education" && <ArrowUpDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {candidates[0]?.processingWarnings?.length ? (
              <div role="status" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                Some resumes could not be analyzed: {candidates[0].processingWarnings.join(" ")}
              </div>
            ) : null}
            <div className="space-y-3">
              {sortedCandidates.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">{candidates.length ? "No candidates match your search criteria." : "No resumes have been analyzed yet."}</div>
              ) : (
                <AnimatePresence>
                  {sortedCandidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedCandidate?.id === candidate.id
                            ? "border-sky-400/50 bg-sky-400/[0.07] shadow-md"
                            : "border-slate-800 bg-[#0b1424] hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                        onClick={() => setSelectedCandidateId(candidate.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedCandidateId(candidate.id)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedCandidate?.id === candidate.id}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xs font-semibold ${candidate.matchScore >= 70 ? "border-teal-400/25 bg-teal-400/10 text-teal-200" : "border-sky-400/25 bg-sky-400/10 text-sky-200"}`}>
                                  {/^(?:name not detected|unknown candidate)$/i.test(candidate.name.trim())
                                    ? <User className="h-4 w-4" />
                                    : candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold text-slate-100">{getCandidateDisplayName(candidate.name)}</h3>
                                  <p className="mt-1 text-xs leading-5 text-slate-400">
                                    {candidate.currentTitle} <span className="text-slate-600">·</span> {candidate.experienceFound === false ? "Experience not stated" : `${candidate.yearsOfExperience} years`} <span className="text-slate-600">·</span> {candidate.educationLevel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`rounded-lg px-2.5 py-1 text-lg font-semibold tabular-nums ${candidate.matchScore >= 70 ? "bg-teal-400/10 text-teal-300" : "bg-sky-400/10 text-sky-200"}`}
                            >
                              {Math.round(candidate.matchScore)}%
                            </div>
                            <div className="mt-1 text-[10px] text-slate-500">Est. JD match</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Required skills</span>
                            <span>
                              {candidate.matchedSkills.length}/{jobRequirements.requiredSkills.length}
                            </span>
                          </div>
                          <Progress
                            value={jobRequirements.requiredSkills.length ? (candidate.matchedSkills.length / jobRequirements.requiredSkills.length) * 100 : 0}
                            className="h-1.5 bg-slate-800"
                            indicatorClassName={`${
                              candidate.matchScore > 85
                                ? "bg-teal-400"
                                : "bg-sky-400"
                            }`}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {candidate.matchedSkills.map((skill) => (
                            <Badge
                              key={skill}
                              className="border border-sky-400/20 bg-sky-400/10 text-sky-200 hover:bg-sky-400/20"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {candidate.additionalSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="border-slate-700 text-slate-300">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.additionalSkills.length > 3 && (
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                              +{candidate.additionalSkills.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <p className="mt-3 text-xs text-slate-500">{candidate.evidence?.length ?? 0} evidence item{candidate.evidence?.length === 1 ? "" : "s"} · score is an estimate</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-104px)] xl:self-start xl:overflow-y-auto xl:pr-1">
        <AnimatePresence mode="wait">
          {selectedCandidate ? (
            <motion.div
              key="candidate-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <CandidateDetail candidate={selectedCandidate} jobRequirements={jobRequirements} />
            </motion.div>
          ) : (
            <motion.div key="no-candidate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="flex h-full min-h-72 items-center justify-center border border-slate-800 bg-[#101a2b] p-6 text-center text-slate-100 shadow-xl">
                <div className="text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-sky-400/10">
                    <User className="h-7 w-7 text-sky-300" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Candidate Selected</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Candidate evidence and score breakdown appear here.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

