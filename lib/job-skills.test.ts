import assert from "node:assert/strict"
import test from "node:test"
import { extractSkillsFromJobDescription, mergeJobSkills, normalizeSkill } from "./job-skills"

test("extracts technical and soft skills stated across a job description", () => {
  assert.deepEqual(
    extractSkillsFromJobDescription(
      "Required: TypeScript, React, PostgreSQL, AWS, and problem-solving. Preferred: Kubernetes and communication.",
    ),
    ["TypeScript", "React", "PostgreSQL", "AWS", "Kubernetes", "Communication", "Problem Solving"],
  )
})

test("normalizes aliases and avoids duplicate skills", () => {
  assert.equal(normalizeSkill("JS"), "JavaScript")
  assert.deepEqual(extractSkillsFromJobDescription("JS, JavaScript, and ECMAScript experience"), ["JavaScript"])
})

test("keeps Java and JavaScript distinct", () => {
  assert.deepEqual(extractSkillsFromJobDescription("JavaScript is required; Java is preferred."), [
    "JavaScript",
    "Java",
  ])
  assert.deepEqual(extractSkillsFromJobDescription("JavaScript is required."), ["JavaScript"])
})

test("does not treat ordinary words as Go or REST skills", () => {
  assert.deepEqual(extractSkillsFromJobDescription("Go to the office and take a rest."), [])
  assert.deepEqual(extractSkillsFromJobDescription("Golang and RESTful API development"), ["Go", "REST"])
})

test("keeps manual additions and removals when detected skills are re-extracted", () => {
  assert.deepEqual(mergeJobSkills(["Java", "AWS"], ["React", "react"], ["AWS"]), ["Java", "React"])
})