# RecruitAI Resume Screening

Screen PDF and DOCX resumes against a job description with deterministic matching, an optional consent-gated Gemini analysis, and an evidence-based resume coach.

## Features

- Extract selectable text from PDF files with PDF.js and DOCX files with Mammoth.
- Calculate a deterministic match score and rank candidates using required skills, experience, education, and job-description term overlap.
- Run an ATS-readiness audit over extracted text for contact details, common section headings, dates, required job terms, and observable extraction or formatting risks.
- Optionally request Gemini skill evidence, related terminology, project context, and resume-improvement suggestions.
- Review proposed resume edits beside the original text. Accepting a proposal keeps a local draft in the current view; it does not edit or save the uploaded file.
- Use the existing responsive candidate screening interface on desktop, tablet, and mobile.

## 🛠️ Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS  
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Optional AI analysis**: Google Gemini via the official `@google/genai` SDK
- **File processing**: PDF.js and Mammoth
               
## 🚀 Getting Started  

### Prerequisites

- Node.js 18 or later
- npm

### Installation

1. Clone the repository:  
   ```bash
   git clone https://github.com/yourusername/ai-resume-screening.git
   cd ai-resume-screening
   ```
2. Install dependencies. If npm reports the existing `date-fns` / `react-day-picker` peer dependency conflict, use `--legacy-peer-deps`:  
   ```bash
   npm install --legacy-peer-deps
   ```   
3. Configure the Gemini API key for server-side use. Create `.env.local` in the project root:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key
   # Optional model override; defaults to gemini-3.1-flash-lite
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```
   Keep the key out of `NEXT_PUBLIC_*` variables. `.env*` is ignored by Git.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000).

## 📖 How to Use

### 1. Define Job Requirements
- Enter the job title and description
- Add required skills
- Set minimum experience and education level

### 2. Upload Resumes
- Upload text-based PDF or DOCX files. Image-only PDFs are not OCR-processed.
- Gemini consent is unchecked by default. Screening and deterministic ranking work without consent.
- If consent is checked, extracted resume text and the selected job description are sent to Google Gemini for AI insights. The request is made server-side.

### 3. Review Results
- Candidates are ranked by the deterministic match score.
- Inspect score components, extracted candidate details, and the ATS-readiness audit.
- With consent, inspect Gemini findings and optional resume coach drafts. Review every suggestion; accepted drafts do not alter the uploaded resume.

## 📁 Project Structure

```plaintext
ai-resume-screening/
├── app/                  # Next.js app directory
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── candidate-detail.tsx
│   ├── candidate-re sults.tsx
│   ├── job-requirements-form.tsx
│   ├── resume-screening-dashboard.tsx
│   ├── resume-uploader.tsx
│   └── ui/               # UI components
├── lib/                  # Utility functions and types
│   ├── ats-readiness-audit.ts
│   ├── gemini-resume-insights.ts
│   ├── resume-analysis.ts
│   ├── resume-analyzer.ts
│   ├── resume-parser.ts
│   └── types.ts
├── public/               # Static assets
└── ...                   # Config files
```

## 🔧 Configuration   

### Tailwind Configuration
Modify the theme in `tailwind.config.js`.

### Gemini Configuration
Set `GEMINI_API_KEY` in the ignored `.env.local` file or deployment environment. The key is read by the server-only helper in `lib/gemini-resume-insights.ts`. `GEMINI_MODEL` optionally selects another supported model.

## Privacy and Limitations

- The Gemini consent checkbox is optional and unchecked by default. The server action and Gemini helper both require consent before making an API request.
- With consent, the full extracted resume text and job description are sent to Google Gemini. Resume text can contain personal information. Review Google's current API data-handling terms before using real candidate data.
- The application does not log resume text, prompts, or API keys, and does not persist uploaded resume files. Deployment, hosting, and provider retention policies are separate considerations.
- Without consent, parsing, the deterministic score, candidate ranking, and deterministic ATS audit still run; Gemini insights and coach suggestions are not generated.
- The match score is a local heuristic: required skills 60%, experience 20%, education 10%, and job-description relevance 10%. It is not a Gemini score.
- The ATS audit checks extracted text only. It cannot confirm that extraction captured the entire source document, does not reproduce a proprietary employer ATS, and cannot guarantee screening outcomes or shortlisting.
- Gemini output can be wrong. Evidence excerpts are checked against extracted text, and coach suggestions are validated against their cited excerpts. Missing facts require confirmation placeholders. Review drafts before using them; accepting a draft does not edit or save the uploaded file.
- PDF image OCR, employer-specific ATS parsing, and automatic resume rewriting are not implemented.

## Tests and Checks

Run the repository's test suite:

```bash
npm test
```

Run TypeScript validation and a production build:

```bash
npx tsc --noEmit --pretty false
npm run build
```

`npm run lint` is configured as `next lint`. On a fresh checkout without an ESLint configuration, Next.js may open an interactive setup prompt.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

## Acknowledgements

- [Google Gen AI SDK](https://github.com/googleapis/js-genai)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)
