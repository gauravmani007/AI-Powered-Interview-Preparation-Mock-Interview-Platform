const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

function extractJobTitle(jobDescription = "") {
    const cleaned = String(jobDescription).trim()

    if (!cleaned) {
        return "Interview Role"
    }

    const directMatch = cleaned.match(/[A-Z][A-Za-z0-9&+\/.-]*(?:\s+[A-Z][A-Za-z0-9&+\/.-]*)*(?:\s+(?:Engineer|Developer|Manager|Lead|Architect|Analyst|Specialist|Coordinator|Consultant|Designer|Engineer))/) 

    if (directMatch) {
        return directMatch[0].trim()
    }

    const fallback = cleaned.split(/\s+/).slice(0, 6).join(" ")
    return fallback || "Interview Role"
}

function normalizeInterviewReport(report = {}, jobDescription = "") {
    const safeReport = report && typeof report === "object" ? report : {}

    const normalizeQuestionObjects = (items, fallbackIntention = "Assess the candidate's relevant experience and decision-making ability.") => {
        if (!Array.isArray(items)) {
            return []
        }

        return items.map((item) => {
            if (typeof item === "string") {
                return {
                    question: item,
                    intention: fallbackIntention,
                    answer: "Explain your approach clearly, cite a real example, and highlight measurable outcomes."
                }
            }

            if (item && typeof item === "object") {
                return {
                    question: String(item.question || item.prompt || item.title || "Interview question"),
                    intention: String(item.intention || fallbackIntention),
                    answer: String(item.answer || item.solution || item.model_answer || item.modelAnswer || "Answer with a structured example and measurable outcomes.")
                }
            }

            return {
                question: "Interview question",
                intention: fallbackIntention,
                answer: "Answer with a structured example and measurable outcomes."
            }
        })
    }

    const normalizeSkillGaps = (items) => {
        if (!Array.isArray(items)) {
            return []
        }

        return items.map((item) => {
            if (typeof item === "string") {
                return {
                    skill: item,
                    severity: "medium"
                }
            }

            if (item && typeof item === "object") {
                return {
                    skill: String(item.skill || item.name || item.title || "Skill gap"),
                    severity: [ "low", "medium", "high" ].includes(String(item.severity || item.level || "medium").toLowerCase())
                        ? String(item.severity || item.level || "medium").toLowerCase()
                        : "medium"
                }
            }

            return {
                skill: "Skill gap",
                severity: "medium"
            }
        })
    }

    const normalizePreparationPlan = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return [
                {
                    day: 1,
                    focus: "Core technical alignment",
                    tasks: [
                        "Review the job description and map your experience to the required stack.",
                        "Practice 3–5 technical interview questions related to React, Node.js, and system design.",
                        "Refresh your resume and examples of measurable impact."
                    ]
                },
                {
                    day: 2,
                    focus: "System design and API fundamentals",
                    tasks: [
                        "Review API design patterns, trade-offs, and scalability considerations.",
                        "Practice explaining a real project architecture with data flow and trade-offs.",
                        "Prepare examples for performance optimization and debugging."
                    ]
                },
                {
                    day: 3,
                    focus: "Behavioral and leadership prep",
                    tasks: [
                        "Prepare STAR stories for teamwork, conflict resolution, and ownership.",
                        "Practice concise explanations of decisions, metrics, and business impact.",
                        "Do a final mock interview and refine your answers for clarity."
                    ]
                }
            ]
        }

        return items.map((item) => {
            if (item && typeof item === "object") {
                return {
                    day: Number.isFinite(Number(item.day)) ? Number(item.day) : 1,
                    focus: String(item.focus || item.title || "Primary focus"),
                    tasks: Array.isArray(item.tasks) ? item.tasks.map((task) => String(task)) : []
                }
            }

            return {
                day: 1,
                focus: "Primary focus",
                tasks: []
            }
        })
    }

    const rawTechnicalQuestions = (
        (Array.isArray(safeReport.technicalQuestions) && safeReport.technicalQuestions.length > 0)
            ? safeReport.technicalQuestions
            : (Array.isArray(safeReport.technical_questions) && safeReport.technical_questions.length > 0)
                ? safeReport.technical_questions
                : (Array.isArray(safeReport.interviewQuestions) && safeReport.interviewQuestions.length > 0)
                    ? safeReport.interviewQuestions
                    : (Array.isArray(safeReport.interview_questions) && safeReport.interview_questions.length > 0)
                        ? safeReport.interview_questions
                        : []
    )
    const rawBehavioralQuestions = (
        (Array.isArray(safeReport.behavioralQuestions) && safeReport.behavioralQuestions.length > 0)
            ? safeReport.behavioralQuestions
            : (Array.isArray(safeReport.behavioral_questions) && safeReport.behavioral_questions.length > 0)
                ? safeReport.behavioral_questions
                : []
    )
    const rawSkillGaps = (
        (Array.isArray(safeReport.skillGaps) && safeReport.skillGaps.length > 0)
            ? safeReport.skillGaps
            : (Array.isArray(safeReport.skill_gaps) && safeReport.skill_gaps.length > 0)
                ? safeReport.skill_gaps
                : (Array.isArray(safeReport.potentialGaps) && safeReport.potentialGaps.length > 0)
                    ? safeReport.potentialGaps
                    : (Array.isArray(safeReport.gaps_and_risks) && safeReport.gaps_and_risks.length > 0)
                        ? safeReport.gaps_and_risks
                        : []
    )
    const rawPreparationPlan = (
        (Array.isArray(safeReport.preparationPlan) && safeReport.preparationPlan.length > 0)
            ? safeReport.preparationPlan
            : (Array.isArray(safeReport.preparation_plan) && safeReport.preparation_plan.length > 0)
                ? safeReport.preparation_plan
                : (Array.isArray(safeReport.plan) && safeReport.plan.length > 0)
                    ? safeReport.plan
                    : []
    )

    const title = String(safeReport.title || safeReport.target_role || safeReport.targetPosition || safeReport.appliedPosition || safeReport.position || extractJobTitle(jobDescription)).trim() || "Interview Role"
    const numericMatchScore = Number(safeReport.matchScore ?? safeReport.match_score ?? safeReport.overallMatchScore ?? safeReport.overall_match_score ?? safeReport.fitScore ?? safeReport.fit_score ?? 0)
    const matchScoreValue = Number.isFinite(numericMatchScore) && numericMatchScore > 0 ? numericMatchScore : Number(safeReport.match_score ?? safeReport.overall_match_score ?? safeReport.fit_score ?? 0)

    return {
        title,
        matchScore: Number.isFinite(matchScoreValue) ? Math.min(100, Math.max(0, matchScoreValue)) : 0,
        technicalQuestions: normalizeQuestionObjects(rawTechnicalQuestions, "Assess the candidate's technical depth and practical problem-solving ability."),
        behavioralQuestions: normalizeQuestionObjects(rawBehavioralQuestions, "Assess communication, ownership, and collaboration strengths."),
        skillGaps: normalizeSkillGaps(rawSkillGaps),
        preparationPlan: normalizePreparationPlan(rawPreparationPlan)
    }
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    const { selfDescription = "", jobDescription = "" } = req.body
    const trimmedJobDescription = String(jobDescription).trim()
    const trimmedSelfDescription = String(selfDescription).trim()

    if (!trimmedJobDescription) {
        return res.status(400).json({
            message: "Job description is required."
        })
    }

    let resumeText = ""

    if (req.file && req.file.buffer) {
        try {
            const parsed = await pdfParse(req.file.buffer)
            resumeText = String(parsed.text || "").trim()
        } catch (error) {
            resumeText = ""
        }
    }

    if (!trimmedSelfDescription && !resumeText) {
        return res.status(400).json({
            message: "Please provide either a resume upload or a self description."
        })
    }

    let interViewReportByAi;

    try {
        interViewReportByAi = await generateInterviewReport({
            resume: resumeText || "No resume uploaded.",
            selfDescription: trimmedSelfDescription || "No self description provided.",
            jobDescription: trimmedJobDescription
        })
    } catch (error) {
        return res.status(503).json({
            message: "The AI interview generator is temporarily unavailable. Please try again in a few moments."
        })
    }

    const normalizedReport = normalizeInterviewReport(interViewReportByAi, trimmedJobDescription)

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription: trimmedSelfDescription,
        jobDescription: trimmedJobDescription,
        ...normalizedReport
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }