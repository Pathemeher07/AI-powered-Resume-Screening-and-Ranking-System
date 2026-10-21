import mammoth from "mammoth"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { WorkerMessageHandler } from "pdfjs-dist/legacy/build/pdf.worker.mjs"

export const MAX_RESUME_BYTES = 10 * 1024 * 1024

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split(".").pop()
  if (extension !== "pdf" && extension !== "docx") {
    throw new Error(`${file.name}: use a PDF or DOCX resume.`)
  }
  if (file.size === 0) throw new Error(`${file.name}: the file is empty.`)
  if (file.size > MAX_RESUME_BYTES) throw new Error(`${file.name}: files must be 10 MB or smaller.`)

  const expectedType = extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (file.type && file.type !== expectedType && file.type !== "application/octet-stream") {
    throw new Error(`${file.name}: the file content type does not match its extension.`)
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer())
    let text = ""
    if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(data) })
      text = result.value
    } else {
      if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-") {
        throw new Error("The file does not have a valid PDF signature.")
      }
      Object.assign(globalThis, { pdfjsWorker: { WorkerMessageHandler } })
      const pdf = await getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise
      try {
        const pages: string[] = []
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber)
          const content = await page.getTextContent()
          const lines = new Map<number, string[]>()
          for (const item of content.items) {
            if (!("str" in item) || !("transform" in item)) continue
            const y = Math.round(item.transform[5])
            lines.set(y, [...(lines.get(y) ?? []), item.str])
          }
          pages.push(
            [...lines.entries()]
              .sort(([firstY], [secondY]) => secondY - firstY)
              .map(([, words]) => words.join(" ").trim())
              .filter(Boolean)
              .join("\n"),
          )
        }
        text = pages.join("\n")
      } finally {
        await pdf.destroy()
      }
    }

    if (!text.trim()) {
      throw new Error("No readable text was found. The file may be image-only, encrypted, or empty.")
    }
    return text.trim()
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown parsing error"
    throw new Error(`${file.name}: could not read this resume. ${detail}`)
  }
}