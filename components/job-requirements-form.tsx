"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { X, Briefcase, GraduationCap, ListChecks } from "lucide-react"
import type { JobRequirements } from "@/lib/types"
import { extractSkillsFromJobDescription, mergeJobSkills, normalizeSkill } from "@/lib/job-skills"
import { motion } from "framer-motion"

interface JobRequirementsFormProps {
  onSubmit: (requirements: JobRequirements) => void
}

export function JobRequirementsForm({ onSubmit }: JobRequirementsFormProps) {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [experienceYears, setExperienceYears] = useState(3)
  const [skillInput, setSkillInput] = useState("")
  const [detectedSkills, setDetectedSkills] = useState<string[]>([])
  const [manualSkills, setManualSkills] = useState<string[]>([])
  const [removedSkills, setRemovedSkills] = useState<string[]>([])
  const [educationLevel, setEducationLevel] = useState("Bachelor's")
  const [validationMessage, setValidationMessage] = useState("")

  const skills = mergeJobSkills(detectedSkills, manualSkills, removedSkills)

  const addSkill = () => {
    const skill = normalizeSkill(skillInput)
    if (!skill) return
    if (detectedSkills.includes(skill)) setRemovedSkills(removedSkills.filter((item) => item !== skill))
    else if (!manualSkills.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) {
      setManualSkills([...manualSkills, skill])
    }
    setSkillInput("")
  }

  const removeSkill = (skill: string) => {
    setManualSkills(manualSkills.filter((item) => item !== skill))
    if (detectedSkills.includes(skill) && !removedSkills.includes(skill)) {
      setRemovedSkills([...removedSkills, skill])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobTitle.trim() || !jobDescription.trim() || skills.length === 0) {
      setValidationMessage(
        !jobTitle.trim()
          ? "Enter a job title."
          : !jobDescription.trim()
            ? "Enter a job description."
            : "Add or detect at least one required skill.",
      )
      return
    }

    setValidationMessage("")
    const requirements: JobRequirements = {
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      requiredSkills: skills,
      minimumExperience: experienceYears,
      educationLevel,
    }

    onSubmit(requirements)
  }

  return (
    <Card className="w-full overflow-hidden border border-slate-800 bg-[#101a2b] text-slate-100 shadow-xl">
      <form onSubmit={handleSubmit}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Job Requirements</CardTitle>
          <CardDescription className="text-slate-400">Define the role and review skills detected from its description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <Label htmlFor="jobTitle" className="text-base">
                Job Title
              </Label>
            </div>
            <Input
              id="jobTitle"
              placeholder="e.g. Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
              className="border-slate-700 bg-[#0b1424] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Enter the full job description..."
              rows={5}
              value={jobDescription}
              onChange={(e) => {
                const description = e.target.value
                setJobDescription(description)
                setDetectedSkills(extractSkillsFromJobDescription(description))
              }}
              required
              className="border-slate-700 bg-[#0b1424] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-400"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-purple-500" />
              <Label className="text-base">Required Skills</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g. React, Python, Project Management)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                className="border-slate-700 bg-[#0b1424] text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-400"
              />
              <Button
                type="button"
                onClick={addSkill}
                className="bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-200 hover:bg-sky-400/20"
                  >
                    {skill}
                    <button type="button" aria-label={`Remove ${skill}`} onClick={() => removeSkill(skill)} className="rounded-sm text-sky-200 hover:text-white"><X className="h-3 w-3" /></button>
                  </Badge>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Skills detected from the job description can be edited before continuing.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-pink-500" />
                <Label htmlFor="experience" className="text-base">
                  Minimum Years of Experience: {experienceYears}
                </Label>
              </div>
            </div>
            <Slider
              id="experience"
              min={0}
              max={15}
              step={1}
              value={[experienceYears]}
              onValueChange={(value) => setExperienceYears(value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Entry Level</span>
              <span>Mid Level</span>
              <span>Senior Level</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              <Label htmlFor="education" className="text-base">
                Minimum Education Level
              </Label>
            </div>
            <select
              id="education"
              className="w-full rounded-md border border-slate-700 bg-[#0b1424] p-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
            >
              <option value="High School">High School</option>
              <option value="Associate's">Associate's Degree</option>
              <option value="Bachelor's">Bachelor's Degree</option>
              <option value="Master's">Master's Degree</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-3">
            {validationMessage && <p role="alert" className="text-sm text-red-500">{validationMessage}</p>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md"
            >
              Continue to Resume Upload
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

