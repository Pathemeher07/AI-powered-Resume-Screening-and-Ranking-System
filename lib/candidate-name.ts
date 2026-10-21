const rejectedNameTerms = new Set([
  "academic",
  "analyst",
  "architect",
  "assistant",
  "associate",
  "administrator",
  "arts",
  "bachelor",
  "chief",
  "college",
  "contact",
  "consultant",
  "coordinator",
  "data",
  "degree",
  "designer",
  "developer",
  "director",
  "education",
  "engineer",
  "executive",
  "experience",
  "finance",
  "founder",
  "intern",
  "institute",
  "junior",
  "lead",
  "manager",
  "master",
  "marketing",
  "objective",
  "operations",
  "officer",
  "position",
  "principal",
  "product",
  "professional",
  "profile",
  "project",
  "recruiter",
  "resume",
  "school",
  "scientist",
  "skills",
  "software",
  "senior",
  "specialist",
  "staff",
  "summary",
  "technician",
  "university",
  "vice",
])

const contactOrSectionPattern = /@|https?:\/\/|www\.|\b(?:phone|mobile|email|linkedin|github|portfolio|address|experience|education|skills|summary|objective)\b/i

function isNameLikeLine(line: string): boolean {
  const trimmedLine = line.trim()
  if (!trimmedLine || trimmedLine.length > 48 || contactOrSectionPattern.test(trimmedLine)) return false
  if (/\d|[,|/\\:]/.test(trimmedLine)) return false
  if (!/^[\p{L}'’.\- ]+$/u.test(trimmedLine)) return false

  const words = trimmedLine.match(/[\p{L}][\p{L}'’-]*/gu) ?? []
  if (words.length < 2 || words.length > 4) return false
  if (words.some((word) => rejectedNameTerms.has(word.toLowerCase()))) return false

  return words.every((word) => {
    const letters = word.replace(/[’'-]/g, "")
    return letters === letters.toLocaleUpperCase() || /^\p{Lu}/u.test(letters)
  })
}

export function extractCandidateName(resumeText: string): string | undefined {
  const earlyLines = resumeText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 10)

  for (let index = 0; index < earlyLines.length; index += 1) {
    const line = earlyLines[index].replace(/^name\s*:\s*/i, "")
    const lineWords = line.match(/[\p{L}][\p{L}'’-]*/gu) ?? []
    const nextWords = earlyLines[index + 1]?.match(/[\p{L}][\p{L}'’-]*/gu) ?? []
    if (lineWords.length === 1 && nextWords.length === 1) {
      const combinedName = `${line} ${earlyLines[index + 1]}`
      if (isNameLikeLine(combinedName)) return combinedName
    }
    if (isNameLikeLine(line)) return line
  }

  return undefined
}

export function resolveCandidateName(resumeText: string, fileName?: string): string {
  const extractedName = extractCandidateName(resumeText)
  if (extractedName) return extractedName

  const filenameStem = fileName?.replace(/\.[^.]+$/, "").trim()
  return filenameStem || "Name not detected"
}

export function getCandidateDisplayName(name: string | null | undefined): string {
  const trimmedName = name?.trim()
  if (!trimmedName || /^unknown candidate$/i.test(trimmedName) || /^name not detected$/i.test(trimmedName)) {
    return "Name not detected"
  }
  return trimmedName
}