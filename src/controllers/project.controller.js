
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

// =====================================================
// BACKGROUND PROCESSING
// =====================================================

const processProjectReport = async (project, savedProject) => {
  try {
    // 1. AI analysis
    console.log(`[PROJECT ${savedProject.id}] Starting AI analysis...`);

    const analysis = await analyzeProject(project);

    if (!analysis || typeof analysis !== "object") {
      throw new Error("AI analysis returned invalid data.");
    }

    console.log(`[PROJECT ${savedProject.id}] AI analysis completed.`);

    // 2. Save AI analysis in MockAPI
    await updateProjectAnalysis(savedProject.id, analysis);

    console.log(`[PROJECT ${savedProject.id}] Analysis saved.`);

    // 3. Generate PDF Buffer
    console.log(`[PROJECT ${savedProject.id}] Generating PDF...`);

    const pdfBuffer = await generateProjectPDF(project, analysis);

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error("Generated PDF is empty or invalid.");
    }

    console.log(
      `[PROJECT ${savedProject.id}] PDF generated: ${pdfBuffer.length} bytes.`
    );

    // 4. Send PDF by email
    await sendProjectReport(
      project,
      pdfBuffer,
      project.subject_project || "Your Project"
    );

    console.log(`[PROJECT ${savedProject.id}] Email sent successfully.`);

    // 5. Update email status
    await updateEmailStatus(savedProject.id, true);

    console.log(
      `[PROJECT ${savedProject.id}] Processing completed successfully.`
    );

  } catch (error) {
    console.error(
      `[PROJECT ${savedProject.id}] Background processing failed:`,
      error?.stack || error
    );

    // Mark email as failed
    try {
      await updateEmailStatus(savedProject.id, false);

      console.log(
        `[PROJECT ${savedProject.id}] Email status updated to false.`
      );
    } catch (updateError) {
      console.error(
        `[PROJECT ${savedProject.id}] Failed to update email status:`,
        updateError
      );
    }
  }
};

// =====================================================
// SUBMIT PROJECT
// =====================================================

export const analyzeAndSendProject = async (req, res) => {
  // 1. Validate request
  const validation = projectSchema.safeParse(req.body);

  if (!validation.success) {
    console.log("========== VALIDATION ERRORS ==========");

    console.log(
      JSON.stringify(
        validation.error.flatten().fieldErrors,
        null,
        2
      )
    );

    return res.status(400).json({
      success: false,
      message: "Please check the submitted project information.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const project = validation.data;

  try {
    // 2. Save project request in MockAPI
    console.log("Saving project request...");

    const savedProject = await saveProjectRequest(project);

    if (!savedProject?.id) {
      throw new Error("Project could not be saved correctly.");
    }

    console.log(
      `Project ${savedProject.id} saved successfully.`
    );

    // 3. Start background processing
    const backgroundTask = processProjectReport(
      project,
      savedProject
    );

    waitUntil(backgroundTask);

    // 4. Return immediate response
    return res.status(201).json({
      success: true,
      message: "Your project request has been received successfully.",
      data: {
        id: savedProject.id,
        status: "received",
      },
    });

  } catch (error) {
    console.error(
      "Project submission error:",
      error?.stack || error
    );

    return res.status(500).json({
      success: false,
      message: "We could not receive your message. Please try again later.",
    });
  }
};
