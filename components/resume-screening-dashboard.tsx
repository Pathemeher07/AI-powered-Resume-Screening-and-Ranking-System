"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { JobRequirementsForm } from "@/components/job-requirements-form"
import { ResumeUploader } from "@/components/resume-uploader"
import { CandidateResults } from "@/components/candidate-results"
import { analyzeResumes } from "@/lib/resume-analyzer"
import type { JobRequirements, Candidate } from "@/lib/types"
import { Activity, Bell, BriefcaseBusiness, ChartNoAxesCombined, FileUp, LayoutDashboard, Search, Users } from "lucide-react"

export function ResumeScreeningDashboard() {
  const [jobRequirements, setJobRequirements] = useState<JobRequirements | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("requirements")
  const [searchTerm, setSearchTerm] = useState("")
  const [analysisError, setAnalysisError] = useState("")
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleJobRequirementsSubmit = (requirements: JobRequirements) => {
    setJobRequirements(requirements)
    setCandidates([])
    setAnalysisError("")
    setActiveTab("upload")
  }

  const handleResumesUpload = async (files: File[], geminiConsent: boolean) => {
    if (!jobRequirements) return

    setIsAnalyzing(true)
    setAnalysisError("")

    try {
      const results = await analyzeResumes(files, jobRequirements, geminiConsent)
      setCandidates(results)
      setLastAnalysis(new Date())
      setActiveTab("results")
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Resume analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const averageScore = candidates.length
    ? Math.round(candidates.reduce((total, candidate) => total + candidate.matchScore, 0) / candidates.length)
    : null
  const strongMatches = candidates.filter((candidate) => candidate.matchScore >= 70).length
  const highestScore = candidates.length ? Math.max(...candidates.map((candidate) => candidate.matchScore)) : null
  const topCandidates = [...candidates].sort((first, second) => second.matchScore - first.matchScore).slice(0, 3)
  const setWorkflowTab = (tab: string) => {
    if (tab === "upload" && !jobRequirements) return
    if (tab === "results" && !candidates.length) return
    setActiveTab(tab)
  }

  return (
    <div className="recruitai-shell min-h-screen bg-[#080f1d] text-slate-100">
      <div className="min-h-screen lg:pl-[260px]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-800/80 bg-[#0b1424] px-5 py-6 lg:flex">
          <a href="#dashboard" className="mb-10 flex items-center gap-3 px-2 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-lg font-bold">R</span>
            <span><span className="block text-lg font-semibold tracking-wide">RecruitAI</span><span className="block text-xs text-slate-500">Hiring workspace</span></span>
          </a>
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</div>
          <nav className="space-y-1" aria-label="Screening workflow">
            {[
              { value: "requirements", label: "Dashboard", icon: LayoutDashboard, enabled: true },
              { value: "requirements", label: "Job requirements", icon: BriefcaseBusiness, enabled: true },
              { value: "upload", label: "Resume upload", icon: FileUp, enabled: Boolean(jobRequirements) },
              { value: "results", label: "Candidate results", icon: Users, enabled: candidates.length > 0 },
            ].map(({ value, label, icon: Icon, enabled }) => (
              <button
                key={label}
                type="button"
                onClick={() => setWorkflowTab(value)}
                disabled={!enabled}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${(label === "Dashboard" ? activeTab === "requirements" && !jobRequirements : label === "Job requirements" ? activeTab === "requirements" && Boolean(jobRequirements) : activeTab === value) ? "bg-sky-400/10 text-sky-300" : "text-slate-400 hover:bg-slate-800/70 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-slate-800 bg-[#101b2d] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-300">Workspace status</p>
              <span className="h-2 w-2 rounded-full bg-teal-400" aria-label="Ready" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Resume analysis is ready. Files are processed for this session only.</p>
          </div>
        </aside>

        <main id="dashboard" className="mx-auto min-w-0 max-w-[1600px] px-4 pb-8 sm:px-7 lg:px-8">
          <header className="sticky top-0 z-30 -mx-4 mb-6 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#080f1d]/95 px-4 py-3 backdrop-blur sm:-mx-7 sm:px-7 lg:-mx-8 lg:px-8">
            <div className="min-w-[170px]">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-sky-300">RecruitAI <span className="text-slate-600">/</span> Screening</p>
              <h1 className="mt-0.5 text-xl font-semibold leading-6 text-white">Candidate screening</h1>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-initial">
              <label className="relative min-w-0 flex-1 sm:w-[290px] sm:flex-initial">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  aria-label="Search candidates"
                  placeholder="Search candidates or skills"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    if (candidates.length) setActiveTab("results")
                  }}
                  className="h-10 w-full rounded-lg border border-slate-700/90 bg-[#101a2b] pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
                />
              </label>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-800 text-slate-300 transition-colors hover:bg-slate-800"
                >
                  <Bell className="h-4 w-4" />
                </button>
                {showNotifications && <div role="status" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-700 bg-[#101a2b] p-4 text-sm shadow-2xl"><p className="font-medium text-slate-100">Notifications</p><p className="mt-2 text-xs leading-5 text-slate-400">No new notifications for this session.</p></div>}
              </div>
              <div className="hidden items-center gap-2.5 border-l border-slate-800 pl-3 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-sky-400/25 bg-sky-400/10 text-xs font-semibold text-sky-200">HM</span>
                <span className="whitespace-nowrap"><span className="block text-xs font-medium leading-4 text-slate-200">Hiring manager</span><span className="block text-[10px] leading-4 text-slate-500">RecruitAI workspace</span></span>
              </div>
            </div>
          </header>

          <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Screening statistics">
            {[
              { label: "Candidates screened", value: candidates.length, icon: Users, color: "text-sky-300" },
              { label: "Average JD match", value: averageScore === null ? "--" : `${averageScore}%`, icon: ChartNoAxesCombined, color: "text-violet-300" },
              { label: "Strong matches · 70%+", value: strongMatches, icon: Activity, color: "text-teal-300" },
              { label: "Highest JD match", value: highestScore === null ? "--" : `${highestScore}%`, icon: BriefcaseBusiness, color: "text-indigo-300" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-slate-800/90 bg-[#101a2b] px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400 sm:text-xs"><span>{label}</span><Icon className={`h-4 w-4 ${color}`} /></div>
                <div className="mt-2 text-[26px] font-semibold leading-8 tabular-nums text-white">{value}</div>
              </div>
            ))}
          </section>

          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section className="min-w-0">
              <Tabs value={activeTab} onValueChange={setWorkflowTab} className="w-full">
                <nav aria-label="Screening steps" className="mb-4 flex items-center rounded-xl border border-slate-800/90 bg-[#101a2b] px-3 py-2 sm:px-5">
                  {[
                    { value: "requirements", label: "Job Requirements", complete: Boolean(jobRequirements) },
                    { value: "upload", label: "Resume Upload", complete: candidates.length > 0 },
                    { value: "results", label: "Results", complete: candidates.length > 0 },
                  ].map((step, index) => {
                    const active = activeTab === step.value
                    const enabled = index === 0 || (index === 1 && Boolean(jobRequirements)) || (index === 2 && candidates.length > 0)
                    return <div key={step.value} className="flex min-w-0 flex-1 items-center last:flex-none">
                      <button type="button" onClick={() => setWorkflowTab(step.value)} disabled={!enabled} aria-current={active ? "step" : undefined} className="flex min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2.5">
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${active ? "border-sky-300 bg-sky-400 text-slate-950" : step.complete ? "border-teal-400/50 bg-teal-400/10 text-teal-300" : "border-slate-700 bg-[#0b1424] text-slate-500"}`}>{index + 1}</span>
                        <span className={`truncate text-[11px] font-medium sm:text-xs ${active ? "text-white" : "text-slate-400"}`}>{step.label}</span>
                      </button>
                      {index < 2 && <span aria-hidden="true" className={`mx-2 h-px min-w-3 flex-1 sm:mx-4 ${step.complete ? "bg-teal-400/50" : "bg-slate-700"}`} />}
                    </div>
                  })}
                </nav>
                <TabsContent forceMount value="requirements" className="mt-0 data-[state=inactive]:hidden"><JobRequirementsForm onSubmit={handleJobRequirementsSubmit} /></TabsContent>
                <TabsContent forceMount value="upload" className="mt-0 data-[state=inactive]:hidden">
                  <ResumeUploader onUpload={handleResumesUpload} isLoading={isAnalyzing} error={analysisError} />
                </TabsContent>
                <TabsContent forceMount value="results" className="mt-0 data-[state=inactive]:hidden">
                  {jobRequirements && <CandidateResults candidates={candidates} jobRequirements={jobRequirements} searchTerm={searchTerm} />}
                </TabsContent>
              </Tabs>
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border border-slate-800 bg-[#101a2b] p-4">
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Quick stats</h2><ChartNoAxesCombined className="h-4 w-4 text-sky-300" /></div>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Required skills</dt><dd className="text-slate-200">{jobRequirements?.requiredSkills.length ?? 0}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Minimum experience</dt><dd className="text-slate-200">{jobRequirements ? `${jobRequirements.minimumExperience} years` : "Not set"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Minimum education</dt><dd className="text-right text-slate-200">{jobRequirements?.educationLevel ?? "Not set"}</dd></div>
                </dl>
                {jobRequirements && <p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-400">{jobRequirements.jobTitle}</p>}
              </section>

              <section className="rounded-xl border border-slate-800 bg-[#101a2b] p-4">
                <h2 className="text-sm font-semibold text-white">Top candidates</h2>
                {topCandidates.length ? (
                  <ol className="mt-3 space-y-1">
                    {topCandidates.map((candidate, index) => (
                      <li key={candidate.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(candidate.name)
                            setActiveTab("results")
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-slate-800/70"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sky-400/20 bg-sky-400/10 text-[10px] font-semibold text-sky-200">
                            {candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{candidate.name}</span>
                          <span className="rounded-md bg-teal-400/10 px-2 py-1 text-xs font-semibold tabular-nums text-teal-300">{candidate.matchScore}%</span>
                          <span className="sr-only">Rank {index + 1}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-3 text-xs leading-5 text-slate-500">Candidate rankings appear after resumes are analyzed.</p>}
              </section>

              <section className="rounded-xl border border-slate-800 bg-[#101a2b] p-4">
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-violet-300" /><h2 className="text-sm font-semibold text-white">Recent activity</h2></div>
                {lastAnalysis ? <p className="mt-3 text-xs leading-5 text-slate-300">Analyzed {candidates.length} resume{candidates.length === 1 ? "" : "s"} at {lastAnalysis.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p> : <p className="mt-3 text-xs leading-5 text-slate-500">No screening activity in this session yet.</p>}
              </section>
              <p className="px-1 text-[11px] leading-5 text-slate-500">Scores are estimates based on extracted resume text and the selected job requirements, not an official ATS result.</p>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

