import { useContext } from 'react';
import { InterviewContext } from '../interview.context.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {})
        }
    });

    const rawText = await response.text();
    let data = {};

    try {
        data = rawText ? JSON.parse(rawText) : {};
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        const serverMessage = data?.message || (rawText ? rawText.slice(0, 180) : 'Request failed');
        throw new Error(serverMessage || 'Request failed');
    }

    return data;
}

export const useInterview = () => {
    const context = useContext(InterviewContext);

    if (!context) {
        throw new Error('useInterview must be used inside an InterviewProvider');
    }

    const {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports
    } = context;

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('jobDescription', jobDescription || '');
            formData.append('selfDescription', selfDescription || '');

            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            const data = await request('/interview/', {
                method: 'POST',
                body: formData
            });

            const nextReport = data?.interviewReport || data || null;
            setReport(nextReport);
            setReports((prev) => (nextReport ? [nextReport, ...prev] : prev));

            return nextReport;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getReportById = async (interviewId) => {
        setLoading(true);

        try {
            const data = await request(`/interview/report/${interviewId}`);
            const nextReport = data.interviewReport;
            setReport(nextReport);
            return nextReport;
        } finally {
            setLoading(false);
        }
    };

    const getAllReports = async () => {
        setLoading(true);

        try {
            const data = await request('/interview/');
            const allReports = data.interviewReports || [];
            setReports(allReports);
            return allReports;
        } finally {
            setLoading(false);
        }
    };

    const getResumePdf = async (interviewReportId) => {
        const response = await fetch(`${API_BASE}/interview/resume/pdf/${interviewReportId}`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Unable to download resume PDF');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${interviewReportId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        return url;
    };

    return {
        ...context,
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getAllReports,
        getResumePdf
    };
};
