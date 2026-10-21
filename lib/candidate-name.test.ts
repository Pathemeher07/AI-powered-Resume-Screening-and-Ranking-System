import assert from "node:assert/strict"
import test from "node:test"
import { extractCandidateName, getCandidateDisplayName, resolveCandidateName } from "./candidate-name"

test("extracts a clear name at the beginning of a resume", () => {
  assert.equal(extractCandidateName("Avery Chen\nSoftware Engineer\navery.chen@example.com"), "Avery Chen")
})

test("extracts a name on its own line above contact information", () => {
  assert.equal(extractCandidateName("\nPriya Nair\n\npriya.nair@example.com\n555-0100"), "Priya Nair")
  assert.equal(extractCandidateName("Name: Priya Nair\npriya.nair@example.com"), "Priya Nair")
})

test("combines a name split across separate lines", () => {
  assert.equal(extractCandidateName("Jordan\nRivera\nEmail: jordan@example.com"), "Jordan Rivera")
})

test("falls back to the original filename stem when no name is detectable", () => {
  assert.equal(resolveCandidateName("SUMMARY\nSoftware Engineer\nBachelor of Science", "resume-final.docx"), "resume-final")
})

test("does not mistake a first-line job title for a name", () => {
  assert.equal(extractCandidateName("Senior Software Engineer\nAvery Chen\navery@example.com"), "Avery Chen")
  assert.equal(extractCandidateName("Product Designer\nAvery Chen\navery@example.com"), "Avery Chen")
})

test("does not mistake a university or degree for a name", () => {
  assert.equal(extractCandidateName("Bachelor of Science\nHarvard University\nAvery Chen\navery@example.com"), "Avery Chen")
})

test("uses the same display name for all candidate result views", () => {
  const candidateName = resolveCandidateName("Morgan Lee\nEmail: morgan@example.com", "resume.pdf")
  assert.equal(getCandidateDisplayName(candidateName), "Morgan Lee")
  assert.equal(getCandidateDisplayName("Unknown candidate"), "Name not detected")
})

test("uses the explicit unavailable label when neither text nor filename identifies a name", () => {
  assert.equal(resolveCandidateName("SKILLS\nEDUCATION"), "Name not detected")
})