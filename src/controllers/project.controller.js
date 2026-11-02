
import { waitUntil } from "@vercel/functions";

import { projectSchema } from "../validators/project.validator.js";

import { analyzeProject } from "../services/ai.service.js";
import { generateProjectPDF } from "../services/pdf.service.js";
import { sendProjectReport } from "../services/email.service.js";

import {
  saveProjectRequest,
  updateProjectAnalysis,
  updateEmailStatus,
} from "../services/mockapi.service.js";

// Background processing
const processProjectReport = async (project, savedProject) => {
  try {
    // 1. AI analysis
    const analysis = await analyzeProject(project);

    // 2. Save AI analysis
    await updateProjectAnalysis(savedProject.id, analysis);

    // 3. Generate PDF
    const pdfBuffer = await generateProjectPDF(project, analysis);

    // 4. Send email
    await sendProjectReport(
      project,
      pdfBuffer,
      analysis.projectTitle || project.subject_project
    );

    // 5. Update email status
    await updateEmailStatus(savedProject.id, true);

    console.log(
      `Project ${savedProject.id}: report sent successfully.`
    );

  } catch (error) {
    console.error(
      `Project ${savedProject.id}: background processing failed:`,
      error
    );

    try {
      await updateEmailStatus(savedProject.id, false);
    } catch (updateError) {
      console.error(
        "Failed to update email status:",
        updateError.message
      );
    }
  }
};

export const analyzeAndSendProject = async (req, res) => {
  // 1. Validate
  const validation = projectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Please check the submitted project information.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const project = validation.data;

  try {
    // 2. Save request first
    const savedProject = await saveProjectRequest(project);

    if (!savedProject?.id) {
      throw new Error("Project could not be saved correctly.");
    }

    // 3. Register background task with Vercel
    waitUntil(
      processProjectReport(project, savedProject)
    );

    // 4. Respond immediately after saving
    return res.status(201).json({
      success: true,
      message: "Your message has been received successfully.",
      data: {
        id: savedProject.id,
        status: "received",
      },
    });

  } catch (error) {
    console.error("Project submission error:", error);

    return res.status(500).json({
      success: false,
      message: "We could not receive your message. Please try again later.",
    });
  }
};
