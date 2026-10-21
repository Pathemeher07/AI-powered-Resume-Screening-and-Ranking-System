"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUp, X, FileText, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ResumeUploaderProps {
  onUpload: (files: File[], geminiConsent: boolean) => void
  isLoading: boolean
  error?: string
}

const MAX_RESUME_BYTES = 10 * 1024 * 1024
const MAX_TOTAL_BYTES = 25 * 1024 * 1024

export function ResumeUploader({ onUpload, isLoading, error: analysisError }: ResumeUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState("")
  const [geminiConsent, setGeminiConsent] = useState(false)

  const addFiles = (incomingFiles: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []
    let totalBytes = files.reduce((total, file) => total + file.size, 0)
    for (const file of incomingFiles) {
      const extension = file.name.toLowerCase().split(".").pop()
      if (extension !== "pdf" && extension !== "docx") {
        errors.push(`${file.name}: use a PDF or DOCX resume.`)
      } else if (file.size === 0) {
        errors.push(`${file.name}: the file is empty.`)
      } else if (file.size > MAX_RESUME_BYTES) {
        errors.push(`${file.name}: files must be 10 MB or smaller.`)
      } else if (totalBytes + file.size > MAX_TOTAL_BYTES) {
        errors.push(`${file.name}: the total upload must be 25 MB or smaller.`)
      } else if (
        file.type &&
        file.type !== "application/octet-stream" &&
        file.type !== (extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      ) {
        errors.push(`${file.name}: the file content type does not match its extension.`)
      } else {
        validFiles.push(file)
        totalBytes += file.size
      }
    }
    setFileError(errors.join(" "))
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
      return [...current, ...validFiles.filter((file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`))]
    })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files.length > 0) addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
      e.target.value = ""
    }
  }

  const removeFile = (file: File) => {
    setFiles((current) => current.filter((item) => item !== file))
  }

  const handleSubmit = () => {
    if (files.length > 0) {
      onUpload(files, geminiConsent)
    }
  }

  return (
    <Card className="w-full overflow-hidden border border-slate-800 bg-[#101a2b] text-slate-100 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Upload Resumes</CardTitle>
        <CardDescription className="text-slate-400">Upload PDF or DOCX resume files for analysis (10 MB maximum each).</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-300 ${
            dragActive
              ? "border-sky-400 bg-sky-400/10"
              : "border-slate-700 hover:border-sky-500 hover:bg-slate-800/50"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <motion.div
            animate={{
              y: dragActive ? -10 : 0,
              scale: dragActive ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-sky-400/10 rounded-xl flex items-center justify-center">
              <FileUp className="h-8 w-8 text-sky-300" />
            </div>
            <p className="mt-2 text-base text-slate-300 font-medium">
              Drag and drop resume files, or{" "}
              <button
                type="button"
                className="text-sky-300 hover:text-sky-200 hover:underline font-semibold"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports: PDF, DOCX</p>
          </motion.div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-4 overflow-hidden"
            >
              <h3 className="text-sm font-medium flex items-center gap-2 text-slate-200">
                <FileText className="h-4 w-4 text-sky-300" />
                Uploaded Files ({files.length})
              </h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {files.map((file, index) => (
                  <motion.li
                    key={file.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-[#0b1424] rounded-md border border-slate-800"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-sky-300" />
                      </div>
                      <span className="text-sm truncate max-w-[250px] text-slate-200">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex items-start gap-3 rounded-md border border-slate-800 bg-[#0b1424] p-3">
          <Checkbox
            id="gemini-consent"
            checked={geminiConsent}
            onCheckedChange={(checked) => setGeminiConsent(checked === true)}
            className="mt-0.5 border-slate-600 data-[state=checked]:bg-sky-500 data-[state=checked]:text-slate-950"
          />
          <label htmlFor="gemini-consent" className="cursor-pointer text-xs leading-5 text-slate-300">
            I consent to sending extracted resume text and the job description to Google Gemini for AI-powered analysis. This is optional; screening works without it.
          </label>
        </div>

        {(fileError || analysisError) && <p role="alert" className="mt-4 text-sm text-red-300">{analysisError || fileError}</p>}
        {isLoading && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0b1424] p-3 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin text-sky-300" />{geminiConsent ? "Parsing resumes and waiting for Gemini insights. Gemini can take up to 20 seconds to respond..." : "Parsing resumes and comparing extracted evidence..."}</motion.div>}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || isLoading}
          className="w-full bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            "Analyze Resumes"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
