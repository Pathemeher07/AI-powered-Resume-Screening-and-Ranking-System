import assert from "node:assert/strict"
import test from "node:test"
import { extractResumeText } from "./resume-parser"

function createTextPdf(text: string): string {
  const stream = `BT /F1 12 Tf 20 150 Td (${text}) Tj ET`
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
  }
  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += `${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createDocx(entries: Record<string, string>): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let localOffset = 0
  for (const [path, content] of Object.entries(entries)) {
    const pathBytes = Buffer.from(path)
    const data = Buffer.from(content)
    const checksum = crc32(data)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(data.length, 18)
    localHeader.writeUInt32LE(data.length, 22)
    localHeader.writeUInt16LE(pathBytes.length, 26)
    localParts.push(localHeader, pathBytes, data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(data.length, 20)
    centralHeader.writeUInt32LE(data.length, 24)
    centralHeader.writeUInt16LE(pathBytes.length, 28)
    centralHeader.writeUInt32LE(localOffset, 42)
    centralParts.push(centralHeader, pathBytes)
    localOffset += localHeader.length + pathBytes.length + data.length
  }
  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.alloc(22)
  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(Object.keys(entries).length, 8)
  endRecord.writeUInt16LE(Object.keys(entries).length, 10)
  endRecord.writeUInt32LE(centralDirectory.length, 12)
  endRecord.writeUInt32LE(localOffset, 16)
  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

test("extracts actual text from a valid PDF resume", async () => {
  const file = new File([createTextPdf("Avery Chen")], "Avery Chen.pdf", { type: "application/pdf" })
  assert.match(await extractResumeText(file), /Avery Chen/)
})

test("rejects empty, unsupported, and unreadable files with actionable errors", async () => {
  await assert.rejects(extractResumeText(new File([], "empty.pdf", { type: "application/pdf" })), /file is empty/)
  await assert.rejects(extractResumeText(new File(["text"], "resume.txt", { type: "text/plain" })), /PDF or DOCX/)
  await assert.rejects(
    extractResumeText(new File(["not a pdf"], "broken.pdf", { type: "application/pdf" })),
    /valid PDF signature/,
  )
})

test("extracts actual text from a valid DOCX resume", async () => {
  const docx = createDocx({
    "[Content_Types].xml": "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/></Types>",
    "_rels/.rels": "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/></Relationships>",
    "word/document.xml": "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>Avery Chen</w:t></w:r></w:p></w:body></w:document>",
  })
  const file = new File([new Uint8Array(docx)], "Avery Chen.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  assert.match(await extractResumeText(file), /Avery Chen/)
})