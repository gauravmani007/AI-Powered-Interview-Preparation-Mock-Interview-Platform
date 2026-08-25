const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const GEMINI_MODEL = "gemini-3.6-flash";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured.")
}

function extractJsonFromResponse(response) {
    const text = response?.text ||
        response?.candidates?.map((candidate) => candidate?.content?.parts?.map((part) => part?.text || "").join("") || "").join("") ||
        "";

    if (!text) {
        throw new Error("AI returned an empty response.")
    }

    const sanitizedText = String(text).trim();
    const withoutCodeFence = sanitizedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    try {
        return JSON.parse(withoutCodeFence)
    } catch (error) {
        const firstBrace = withoutCodeFence.indexOf("{")
        const lastBrace = withoutCodeFence.lastIndexOf("}")

        if (firstBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(withoutCodeFence.slice(firstBrace, lastBrace + 1))
        }

        throw new Error("AI returned a malformed JSON response.")
    }
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

function buildFallbackInterviewReport({ resume, selfDescription, jobDescription }) {
   const jobText = String(jobDescription || "")
   const profileText = `${resume || ""} ${selfDescription || ""}`.trim()
   const lowerJobText = jobText.toLowerCase()
   const lowerProfileText = profileText.toLowerCase()
   const keywordMap = [
       "react",
       "node.js",
       "javascript",
       "typescript",
       "api",
       "database",
       "sql",
       "testing",
       "cloud",
       "system design",
       "performance",
       "frontend",
       "backend"
   ]

   const requiredSkills = keywordMap.filter((keyword) => lowerJobText.includes(keyword))
   const matchedSkills = requiredSkills.filter((keyword) => lowerProfileText.includes(keyword))
   const missingSkills = requiredSkills.filter((keyword) => !lowerProfileText.includes(keyword))
   const matchScore = Math.min(95, Math.max(55, Math.round(58 + (matchedSkills.length * 9) - (missingSkills.length * 5))))

   const title = jobText.split(/\s+/).slice(0, 6).join(" ") || "Interview Role"

   return {
       title,
       matchScore,
       technicalQuestions: [
           {
               question: "Describe a project where you improved a web application's performance or reliability. What metrics did you track and how did you measure success?",
               intention: "Assess practical engineering depth, problem solving, and measurable impact.",
               answer: "Use a real project example, explain the bottleneck, your diagnosis process, the solution you implemented, and the measurable outcome."
           },
           {
               question: "How do you design and scale APIs or backend services that need to support growing user traffic?",
               intention: "Check architectural thinking, trade-off analysis, and system design awareness.",
               answer: "Discuss API design, request flow, validation, caching, database choices, and how you would scale based on traffic or latency requirements."
           },
           {
               question: "Walk me through a time you collaborated with product or design teams to deliver a feature under deadline.",
               intention: "Evaluate communication, ownership, and cross-functional execution.",
               answer: "Describe the challenge, your role, team coordination, risk management, and the feature outcome with measurable impact."
           }
       ],
       behavioralQuestions: [
           {
               question: "Tell me about a time you had to troubleshoot a production issue under pressure.",
               intention: "Assess calm problem-solving, ownership, and communication under stress.",
               answer: "Explain the issue, how you diagnosed it, the corrective action, and lessons learned from the incident."
           },
           {
               question: "Describe a time you improved code quality or team process without direct authority.",
               intention: "Evaluate leadership, influence, and engineering maturity.",
               answer: "Focus on the problem, the idea you proposed, how you influenced others, and the measurable improvement."
           }
       ],
       skillGaps: missingSkills.length
           ? missingSkills.slice(0, 3).map((skill) => ({
               skill: skill.replace(/\./g, "").replace(/\b\w/g, (char) => char.toUpperCase()),
               severity: "medium"
           }))
           : [{ skill: "System design depth", severity: "medium" }],
       preparationPlan: [
           {
               day: 1,
               focus: "Core technical alignment",
               tasks: [
                   "Review the exact skills from the job description and map your experience against each one.",
                   "Practice 3–5 technical questions on the required stack and architecture topics.",
                   "Prepare examples that show measurable business impact and technical decisions."
               ]
           },
           {
               day: 2,
               focus: "System design and API fundamentals",
               tasks: [
                   "Review API design patterns, scalability trade-offs, and performance bottlenecks.",
                   "Practice explaining a project architecture clearly and in a structured way.",
                   "Refresh your experience with testing, observability, and deployment workflows."
               ]
           },
           {
               day: 3,
               focus: "Behavioral and leadership prep",
               tasks: [
                   "Prepare STAR stories for conflict, ownership, and teamwork.",
                   "Practice concise answers that connect technical choices to business impact.",
                   "Do a final mock interview and tighten your explanations for clarity."
               ]
           }
       ]
   }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
   const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

   try {
       const response = await ai.models.generateContent({
           model: GEMINI_MODEL,
           contents: prompt,
           config: {
               responseMimeType: "application/json",
               responseSchema: zodToJsonSchema(interviewReportSchema),
           }
       })

       return extractJsonFromResponse(response)
   } catch (error) {
       return buildFallbackInterviewReport({ resume, selfDescription, jobDescription })
   }
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = extractJsonFromResponse(response)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }