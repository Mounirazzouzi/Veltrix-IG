
import PDFDocument from "pdfkit";

const COLORS = {
  dark: "#151923",
  darkSoft: "#222938",
  gold: "#B68C45",
  goldLight: "#E9D7B5",
  text: "#343A46",
  muted: "#78808D",
  border: "#E5E7EB",
  light: "#F5F6F8",
  white: "#FFFFFF",
};

const PAGE = {
  left: 50,
  right: 50,
  width: 495,
};

const safeText = (value, fallback = "Not specified") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeText(item, ""))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${safeText(val, "")}`)
      .join(" | ");
  }

  return fallback;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

const bottomLimit = (doc) =>
  doc.page.height - doc.page.margins.bottom - 5;

const ensureSpace = (doc, height = 60) => {
  if (doc.y + height > bottomLimit(doc)) {
    doc.addPage();
  }
};

const addText = (doc, text, options = {}) => {
  if (text === null || text === undefined || text === "") return;

  const {
    bold = false,
    size = 10,
    color = COLORS.text,
    width = PAGE.width,
    ...rest
  } = options;

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size)
    .fillColor(color)
    .text(String(text), {
      width,
      lineGap: 4,
      ...rest,
    });
};

const addParagraph = (doc, text, options = {}) => {
  if (text === null || text === undefined || text === "") return;

  const value = safeText(text, "");

  if (!value) return;

  const size = options.size || 9.5;
  const lineGap = options.lineGap ?? 4;
  const width = options.width || PAGE.width;

  doc.font("Helvetica").fontSize(size);

  const height = doc.heightOfString(value, {
    width,
    lineGap,
  });

  ensureSpace(doc, height + 15);

  addText(doc, value, {
    size,
    color: options.color || COLORS.text,
    width,
    lineGap,
  });

  doc.moveDown(0.55);
};

const addSection = (doc, number, title) => {
  ensureSpace(doc, 75);

  doc.moveDown(0.7);

  const y = doc.y;

  doc
    .roundedRect(PAGE.left, y, 35, 29, 6)
    .fill(COLORS.dark);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.goldLight)
    .text(String(number).padStart(2, "0"), PAGE.left, y + 9, {
      width: 35,
      align: "center",
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.dark)
    .text(title, PAGE.left + 47, y + 6, {
      width: PAGE.width - 47,
      lineBreak: false,
    });

  doc.y = y + 39;

  doc
    .moveTo(PAGE.left, doc.y)
    .lineTo(PAGE.left + PAGE.width, doc.y)
    .lineWidth(0.8)
    .strokeColor(COLORS.border)
    .stroke();

  doc.y += 17;
};

const addSubheading = (doc, title) => {
  ensureSpace(doc, 40);

  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(COLORS.dark)
    .text(title, {
      width: PAGE.width,
    });

  doc.moveDown(0.45);
};

const addBulletList = (doc, items) => {
  const list = asArray(items);

  if (!list.length) {
    addParagraph(doc, "No information provided.");
    return;
  }

  list.forEach((item) => {
    let value;

    if (typeof item === "string" || typeof item === "number") {
      value = String(item);
    } else if (item && typeof item === "object") {
      const name = item.name || item.title || item.category || "";
      const description = item.description || item.details || "";

      value = name
        ? `${name}${description ? `: ${description}` : ""}`
        : safeText(item);
    } else {
      value = safeText(item);
    }

    if (!value) return;

    doc.font("Helvetica").fontSize(9.5);

    const textHeight = doc.heightOfString(value, {
      width: PAGE.width - 20,
      lineGap: 3,
    });

    ensureSpace(doc, textHeight + 15);

    const y = doc.y;

    doc
      .circle(PAGE.left + 5, y + 5, 2)
      .fill(COLORS.gold);

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(COLORS.text)
      .text(value, PAGE.left + 17, y, {
        width: PAGE.width - 17,
        lineGap: 3,
      });

    doc.y += 8;
  });

  doc.moveDown(0.35);
};

const addInfoCard = (doc, label, value, x, y, width) => {
  doc
    .roundedRect(x, y, width, 65, 7)
    .fill(COLORS.light);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x + 12, y + 12, {
      width: width - 24,
      lineBreak: false,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.dark)
    .text(safeText(value, "N/A"), x + 12, y + 31, {
      width: width - 24,
      height: 27,
      ellipsis: true,
    });
};

const addCallout = (doc, title, content) => {
  if (content === null || content === undefined || content === "") {
    return;
  }

  const x = PAGE.left;
  const width = PAGE.width;
  const padding = 14;
  const contentText = safeText(content);

  doc.font("Helvetica").fontSize(9);

  const contentHeight = doc.heightOfString(contentText, {
    width: width - padding * 2,
    lineGap: 3,
  });

  const titleHeight = 14;
  const height = padding + titleHeight + 7 + contentHeight + padding;

  ensureSpace(doc, height + 12);

  const y = doc.y;

  // Draw background first.
  doc
    .roundedRect(x, y, width, height, 6)
    .fillAndStroke("#FBF8F1", COLORS.goldLight);

  // Draw title.
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.dark)
    .text(String(title), x + padding, y + padding, {
      width: width - padding * 2,
    });

  // Draw content.
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(contentText, x + padding, y + padding + titleHeight + 7, {
      width: width - padding * 2,
      lineGap: 3,
    });

  // Explicit cursor position.
  doc.y = y + height + 12;
};

const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return {
      recommended: features,
      optional: [],
    };
  }

  if (!features || typeof features !== "object") {
    return {
      recommended: [],
      optional: [],
    };
  }

  return {
    recommended: asArray(
      features.recommendedMVP || features.recommended || []
    ),
    optional: asArray(
      features.deferredOrOptional || features.optional || []
    ),
  };
};

const addKeyValue = (doc, label, value) => {
  if (value === null || value === undefined || value === "") return;

  const text = safeText(value);

  doc.font("Helvetica").fontSize(9.5);

  const height = doc.heightOfString(`${label}: ${text}`, {
    width: PAGE.width,
    lineGap: 3,
  });

  ensureSpace(doc, height + 12);

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLORS.dark)
    .text(`${label}:`, {
      continued: true,
    });

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(COLORS.text)
    .text(` ${text}`, {
      width: PAGE.width,
      lineGap: 3,
    });

  doc.moveDown(0.4);
};

const addPhaseList = (doc, phases) => {
  const list = asArray(phases);

  if (!list.length) {
    addParagraph(doc, "Timeline details to be confirmed.");
    return;
  }

  list.forEach((phase, index) => {
    const title =
      typeof phase === "string"
        ? phase
        : phase.phase || phase.name || `Phase ${index + 1}`;

    const duration =
      typeof phase === "object"
        ? phase.duration || ""
        : "";

    const description =
      typeof phase === "object"
        ? phase.description || ""
        : "";

    const heading = `${index + 1}. ${title}${
      duration ? ` — ${duration}` : ""
    }`;

    ensureSpace(doc, 40);

    addText(doc, heading, {
      bold: true,
      size: 9.5,
      color: COLORS.dark,
    });

    doc.moveDown(0.3);

    if (description) {
      addParagraph(doc, description);
    } else {
      doc.moveDown(0.4);
    }
  });
};

const addRecommendationList = (doc, recommendations) => {
  const items = asArray(recommendations);

  if (!items.length) {
    addParagraph(doc, "No recommendations provided.");
    return;
  }

  items.forEach((item, index) => {
    const title =
      typeof item === "string"
        ? `Recommendation ${index + 1}`
        : item.title || `Recommendation ${index + 1}`;

    const description =
      typeof item === "string"
        ? item
        : item.description || item.details || "";

    ensureSpace(doc, 40);

    addText(doc, `${index + 1}. ${title}`, {
      bold: true,
      size: 9.5,
      color: COLORS.dark,
    });

    doc.moveDown(0.3);

    if (description) {
      addParagraph(doc, description);
    } else {
      doc.moveDown(0.4);
    }
  });
};

const addFooter = (doc, pageNumber, totalPages) => {
  const footerY = doc.page.height - 42;

  doc
    .save()
    .moveTo(PAGE.left, footerY - 12)
    .lineTo(doc.page.width - PAGE.right, footerY - 12)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text("AZZOUZI MOUNIR", PAGE.left, footerY, {
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(`Page ${pageNumber} of ${totalPages}`, 400, footerY, {
      width: 145,
      align: "right",
      lineBreak: false,
    });

  doc.restore();
};

export const generateProjectPDF = (project = {}, analysis = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const report = analysis || {};
      const projectData = project || {};

      const projectAnalysis = report.projectAnalysis || {};
      const architecture = report.technicalArchitecture || {};
      const estimate = report.budgetAndTimeline || {};

      const features = normalizeFeatures(report.features);

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 55,
          bottom: 65,
          left: PAGE.left,
          right: PAGE.right,
        },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: safeText(
            report.projectTitle,
            "AZZOUZI MOUNIR Report"
          ),
          Author: "AZZOUZI MOUNIR",
          Subject: "Professional Project Analysis",
        },
      });

      const chunks = [];
      let finished = false;

      doc.on("data", (chunk) => chunks.push(chunk));

      doc.on("error", (error) => {
        if (!finished) {
          finished = true;
          reject(error);
        }
      });

      doc.on("end", () => {
        if (!finished) {
          finished = true;
          resolve(Buffer.concat(chunks));
        }
      });

      // =====================================================
      // 1. COVER PAGE
      // =====================================================

      doc.rect(0, 0, doc.page.width, 12).fill(COLORS.gold);

      doc
        .rect(0, 12, doc.page.width, 320)
        .fill(COLORS.dark);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(COLORS.goldLight)
        .text("AZZOUZI MOUNIR", 50, 85);

      doc
        .font("Helvetica-Bold")
        .fontSize(30)
        .fillColor(COLORS.white)
        .text("PROJECT", 50, 155);

      doc
        .font("Helvetica-Bold")
        .fontSize(30)
        .fillColor(COLORS.gold)
        .text("ANALYSIS REPORT", 50, 193);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#C5CBD5")
        .text(
          "Professional strategy, technical planning & project consultation",
          50,
          245,
          { width: 440 }
        );

      doc
        .roundedRect(50, 355, 495, 130, 9)
        .fill(COLORS.light);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text("PROJECT TITLE", 70, 377);

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(COLORS.dark)
        .text(
          safeText(
            report.projectTitle,
            projectData.subject_project || "Untitled Project"
          ),
          70,
          397,
          { width: 455 }
        );

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(
          `Prepared for: ${safeText(projectData.full_name)}`,
          70,
          450
        );

      const cardY = 515;
      const cardGap = 12;
      const cardWidth = (495 - cardGap * 2) / 3;

      addInfoCard(
        doc,
        "Project type",
        projectData.subject_project,
        50,
        cardY,
        cardWidth
      );

      addInfoCard(
        doc,
        "Client budget",
        projectData.price_pr,
        50 + cardWidth + cardGap,
        cardY,
        cardWidth
      );

      addInfoCard(
        doc,
        "Report date",
        new Date().toLocaleDateString("en-GB"),
        50 + (cardWidth + cardGap) * 2,
        cardY,
        cardWidth
      );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          "CONFIDENTIAL DOCUMENT  •  PREPARED BY AZZOUZI MOUNIR",
          50,
          715,
          {
            width: 495,
            align: "center",
          }
        );

      // =====================================================
      // 2. EXECUTIVE SUMMARY
      // =====================================================

      doc.addPage();

      addSection(doc, 1, "Executive Summary");

      addParagraph(doc, report.executiveSummary);

      addCallout(
        doc,
        "Project feasibility",
        projectAnalysis.feasibility
      );

      addCallout(
        doc,
        "Key scope question",
        projectAnalysis.keyScopeQuestion
      );

      // =====================================================
      // 3. PROJECT ANALYSIS
      // =====================================================

      addSection(doc, 2, "Project Analysis");

      addKeyValue(
        doc,
        "Target audience",
        projectAnalysis.targetAudience
      );

      addKeyValue(
        doc,
        "Business value",
        projectAnalysis.businessValue
      );

      addKeyValue(
        doc,
        "Budget assessment",
        projectAnalysis.budgetAssessment
      );

      addKeyValue(
        doc,
        "Design and content",
        projectAnalysis.designAndContent
      );

      addKeyValue(
        doc,
        "Localization and payments",
        projectAnalysis.localizationAndPayments
      );

      addSubheading(doc, "Project objectives");
      addBulletList(doc, projectAnalysis.objectives);

      addSubheading(doc, "Key assumptions");
      addBulletList(doc, projectAnalysis.assumptions);

      addSubheading(doc, "Potential risks");
      addBulletList(doc, projectAnalysis.risks);

      // =====================================================
      // 4. FEATURES
      // =====================================================

      addSection(doc, 3, "Features & Functionalities");

      addSubheading(doc, "Recommended MVP");

      addParagraph(
        doc,
        "Core features recommended for the first project release."
      );

      addBulletList(doc, features.recommended);

      addSubheading(doc, "Optional / Future Features");

      addParagraph(
        doc,
        "Additional functionalities that can be considered in future phases."
      );

      addBulletList(doc, features.optional);

      // =====================================================
      // 5. TECHNICAL ARCHITECTURE
      // =====================================================

      addSection(doc, 4, "Technical Architecture");

      addKeyValue(doc, "Recommended approach", architecture.recommendedApproach);
      addKeyValue(doc, "Frontend", architecture.frontend);
      addKeyValue(doc, "Backend", architecture.backend);
      addKeyValue(doc, "Database", architecture.database);
      addKeyValue(doc, "Store structure", architecture.storeStructure);
      addKeyValue(doc, "Design", architecture.design);
      addKeyValue(doc, "Deployment", architecture.deployment);
      addKeyValue(doc, "Operations", architecture.operations);
      addKeyValue(doc, "Justification", architecture.justification);

      addSubheading(doc, "Integrations");
      addBulletList(doc, architecture.integrations);

      addSubheading(doc, "Technical assumptions");
      addBulletList(doc, architecture.assumptions);

      // =====================================================
      // 6. BUDGET & TIMELINE
      // =====================================================

      addSection(doc, 5, "Budget & Timeline");

      addKeyValue(doc, "Client budget", projectData.price_pr);
      addKeyValue(doc, "Stated budget", estimate.statedBudget);
      addKeyValue(doc, "Estimated budget", estimate.estimatedBudget);

      addKeyValue(
        doc,
        "Estimated duration",
        estimate.estimatedDuration || estimate.estimatedTimeline
      );

      addSubheading(doc, "Budget assessment");

      addParagraph(
        doc,
        estimate.budgetAssessment || estimate.budgetNotes
      );

      addSubheading(doc, "Implementation phases");

      addPhaseList(
        doc,
        estimate.phases || estimate.indicativePhases
      );

      addCallout(
        doc,
        "Estimate disclaimer",
        estimate.estimateCaveat
      );

      // =====================================================
      // 7. RECOMMENDATIONS
      // =====================================================

      addSection(doc, 6, "Professional Recommendations");

      addRecommendationList(doc, report.recommendations);

      // =====================================================
      // 8. DEVELOPER INFORMATION
      // =====================================================

      addSection(doc, 7, "Developer Information");

      addParagraph(
        doc,
        process.env.DEVELOPER_NAME || "AZZOUZI MOUNIR Developer"
      );

      addParagraph(
        doc,
        process.env.DEVELOPER_EMAIL || ""
      );

      addParagraph(
        doc,
        process.env.PORTFOLIO_URL || ""
      );

      // =====================================================
      // 9. FOOTERS & PAGE NUMBERS
      // =====================================================

      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      // Start at 1: the cover page does not need a footer.
      for (let i = 1; i < totalPages; i++) {
        doc.switchToPage(i);
        addFooter(doc, i + 1, totalPages);
      }

      // Finish the PDF only once.
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
