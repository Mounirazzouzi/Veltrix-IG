
import PDFDocument from "pdfkit";

/* =========================================================
   Azzouzi Mounir — PDF SERVICE
   Returns a PDF Buffer.
   Page 1: Cover
   Page 2: Table of Contents
   Page 3+: Four report sections
========================================================= */

const COLORS = {
  black: "#111111",
  dark: "#191919",
  gold: "#C9A45C",
  lightGold: "#E5D1A1",
  white: "#FFFFFF",
  text: "#333333",
  muted: "#777777",
  light: "#F5F3EF",
  border: "#E5E0D6",
};

const PAGE = {
  margin: 48,
  headerY: 24,
  footerY: 775,
};

const CONTENT_WIDTH = 499;

const safe = (value, fallback = "Not specified.") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (Array.isArray(value)) {
    return value.length ? value : fallback;
  }

  return value;
};

const asText = (value, fallback = "Not specified.") => {
  const result = safe(value, fallback);

  if (Array.isArray(result)) {
    return result.map((item) => String(item)).join(", ");
  }

  if (typeof result === "object") {
    return JSON.stringify(result);
  }

  return String(result);
};

const getPageCount = (doc) => {
  return doc.bufferedPageRange().count;
};

const bottomLimit = (doc) => {
  return doc.page.height - doc.page.margins.bottom - 42;
};

/* =========================================================
   PAGE MANAGEMENT
========================================================= */

function addReportPage(doc) {
  doc.addPage();
}

/*
 * Only add a page if the requested block can fit on a fresh page.
 * If a block is larger than a complete page, PDFKit handles
 * its natural pagination instead of creating unnecessary pages.
 */
function ensureSpace(doc, height = 40) {
  const availableHeight =
    bottomLimit(doc) - doc.page.margins.top;

  if (
    height <= availableHeight &&
    doc.y + height > bottomLimit(doc)
  ) {
    addReportPage(doc);
  }
}

function addSectionTitle(doc, number, title, description) {
  ensureSpace(doc, 110);

  doc.moveDown(0.8);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.gold)
    .text(`SECTION ${number}`, PAGE.margin, doc.y);

  doc.moveDown(0.3);

  doc
    .font("Helvetica-Bold")
    .fontSize(23)
    .fillColor(COLORS.black)
    .text(title, PAGE.margin, doc.y, {
      width: CONTENT_WIDTH,
    });

  doc.moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(description || "", PAGE.margin, doc.y, {
      width: CONTENT_WIDTH,
    });

  doc.moveDown(0.5);

  const lineY = doc.y;

  doc
    .moveTo(PAGE.margin, lineY)
    .lineTo(PAGE.margin + CONTENT_WIDTH, lineY)
    .lineWidth(1.5)
    .strokeColor(COLORS.gold)
    .stroke();

  doc.y = lineY + 17;
}

function addSubheading(doc, title) {
  ensureSpace(doc, 45);

  doc.moveDown(0.35);

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.dark)
    .text(title, PAGE.margin, doc.y, {
      width: CONTENT_WIDTH,
    });

  doc.moveDown(0.4);
}

function addParagraph(doc, value, options = {}) {
  const text = asText(value, "");

  if (!text.trim()) return;

  const fontSize = options.fontSize || 9.5;
  const color = options.color || COLORS.text;
  const indent = options.indent || 0;
  const spacing = options.spacing ?? 7;

  doc.font("Helvetica").fontSize(fontSize);

  const textOptions = {
    width: CONTENT_WIDTH - indent,
    lineGap: 3,
  };

  const height = doc.heightOfString(text, textOptions);

  ensureSpace(doc, height + spacing + 5);

  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, PAGE.margin + indent, doc.y, {
      ...textOptions,
      align: "left",
    });

  doc.y += spacing;
}

function addBulletList(doc, items) {
  if (!Array.isArray(items)) return;

  items.forEach((item) => {
    const text =
      typeof item === "object" && item !== null
        ? asText(item.description || item.name || item.title)
        : asText(item);

    if (!text.trim()) return;

    doc.font("Helvetica").fontSize(9.2);

    const height = doc.heightOfString(text, {
      width: CONTENT_WIDTH - 22,
      lineGap: 2,
    });

    ensureSpace(doc, height + 13);

    const y = doc.y;

    doc
      .circle(PAGE.margin + 4, y + 5, 2)
      .fill(COLORS.gold);

    doc
      .font("Helvetica")
      .fontSize(9.2)
      .fillColor(COLORS.text)
      .text(text, PAGE.margin + 16, y, {
        width: CONTENT_WIDTH - 18,
        lineGap: 2,
      });

    doc.y += 7;
  });

  doc.moveDown(0.3);
}

function addKeyValue(doc, label, value) {
  const text = asText(value);

  doc.font("Helvetica").fontSize(9);

  const height = doc.heightOfString(text, {
    width: CONTENT_WIDTH - 145,
    lineGap: 2,
  });

  ensureSpace(doc, Math.max(height, 18) + 12);

  const y = doc.y;

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.dark)
    .text(`${label}:`, PAGE.margin, y, {
      width: 135,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(text, PAGE.margin + 140, y, {
      width: CONTENT_WIDTH - 140,
      lineGap: 2,
    });

  doc.y = y + Math.max(height, 12) + 8;
}

function addInfoCard(doc, title, description) {
  const text = asText(description);

  doc.font("Helvetica").fontSize(9);

  const textHeight = doc.heightOfString(text, {
    width: CONTENT_WIDTH - 32,
    lineGap: 3,
  });

  const height = textHeight + 43;
  const availableHeight =
    bottomLimit(doc) - doc.page.margins.top;

  if (height > availableHeight) {
    addSubheading(doc, title);
    addParagraph(doc, text);
    return;
  }

  ensureSpace(doc, height + 10);

  const x = PAGE.margin;
  const y = doc.y;

  doc
    .roundedRect(x, y, CONTENT_WIDTH, height, 5)
    .fill(COLORS.light);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.dark)
    .text(title, x + 15, y + 12, {
      width: CONTENT_WIDTH - 30,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(text, x + 15, y + 30, {
      width: CONTENT_WIDTH - 30,
      lineGap: 3,
    });

  doc.y = y + height + 12;
}

/* =========================================================
   COVER PAGE
========================================================= */

function addCoverPage(doc, project) {
  const name = asText(project?.full_name, "Project Client");
  const subject = asText(
    project?.subject_project,
    "Project Specification"
  );

  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc
    .rect(0, 0, doc.page.width, doc.page.height)
    .fill(COLORS.dark);

  doc
    .rect(0, 0, 12, doc.page.height)
    .fill(COLORS.gold);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(COLORS.gold)
    .text("Azzouzi Mounir", 55, 65);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#BBBBBB")
    .text(
      "PROJECT PLANNING & TECHNICAL DOCUMENTATION",
      55,
      86
    );

  doc
    .moveTo(55, 130)
    .lineTo(150, 130)
    .lineWidth(2)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(33)
    .fillColor(COLORS.white)
    .text("PROJECT", 55, 220);

  doc
    .font("Helvetica-Bold")
    .fontSize(33)
    .fillColor(COLORS.gold)
    .text("SPECIFICATION", 55, 262);

  doc
    .font("Helvetica")
    .fontSize(16)
    .fillColor("#DDDDDD")
    .text(subject, 57, 325, {
      width: 450,
    });

  const information = [
    ["PREPARED FOR", name],
    ["PROJECT TYPE", subject],
    ["REPORT DATE", date],
  ];

  let y = 470;

  information.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.gold)
      .text(label, 57, y);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(COLORS.white)
      .text(value, 57, y + 16, {
        width: 440,
      });

    y += 75;
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#AAAAAA")
    .text("Prepared by Azzouzi Mounir", 57, 755);

  // Create page 2.
  doc.addPage();
}

/* =========================================================
   TABLE OF CONTENTS
========================================================= */

function addContentsPage(doc) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.gold)
    .text("PROJECT DOCUMENTATION", PAGE.margin, 85);

  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(COLORS.dark)
    .text("Table of Contents", PAGE.margin, 108);

  doc
    .moveTo(PAGE.margin, 150)
    .lineTo(PAGE.margin + CONTENT_WIDTH, 150)
    .lineWidth(1.5)
    .strokeColor(COLORS.gold)
    .stroke();

  doc.y = 185;

  // Page index is zero-based.
  return doc.bufferedPageRange().start + 1;
}

function writeContentsEntries(doc, contentsPageIndex, sections) {
  const range = doc.bufferedPageRange();
  const lastPageIndex = range.start + range.count - 1;

  // Always return to the actual TOC page.
  doc.switchToPage(contentsPageIndex);

  let y = 190;

  sections.forEach((section, index) => {
    const number = String(index + 1).padStart(2, "0");

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.gold)
      .text(number, PAGE.margin, y, {
        width: 28,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.dark)
      .text(section.title, PAGE.margin + 38, y, {
        width: 370,
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(String(section.page), PAGE.margin + 430, y, {
        width: 40,
        align: "right",
      });

    y += 42;
  });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      "This document contains the project scope, business context, visual direction and proposed technical plan.",
      PAGE.margin,
      y + 15,
      {
        width: CONTENT_WIDTH,
        lineGap: 3,
      }
    );

  // Restore the last report page.
  doc.switchToPage(lastPageIndex);
}

/* =========================================================
   SECTION 1 — PROJECT PRESENTATION
========================================================= */

function addProjectPresentation(doc, data) {
  addSectionTitle(
    doc,
    1,
    "Project Presentation",
    "Project overview, objectives, requirements and expected outcomes."
  );

  addSubheading(doc, "General Presentation");
  addParagraph(doc, data.presentationGenerale);

  addSubheading(doc, "Main Objective");
  addParagraph(doc, data.objectifPrincipal);

  addSubheading(doc, "Problem Statement");
  addParagraph(doc, data.problematique);

  addSubheading(doc, "Overall Project Workflow");
  addParagraph(doc, data.fonctionnementGlobal);

  addSubheading(doc, "Client Requirements");
  addBulletList(doc, data.besoinsClient);

  addSubheading(doc, "Expected Results");
  addBulletList(doc, data.resultatsAttendus);
}

/* =========================================================
   SECTION 2 — CONTEXT & ENVIRONMENT
========================================================= */

function addContextEnvironment(doc, data) {
  addSectionTitle(
    doc,
    2,
    "Context & Environment",
    "Business environment, target audience, users and project constraints."
  );

  addSubheading(doc, "Business Context");
  addParagraph(doc, data.contexteActivite);

  addSubheading(doc, "Project Environment");
  addParagraph(doc, data.environnementProjet);

  addSubheading(doc, "Target Audience");
  addParagraph(doc, data.publicCible);

  addSubheading(doc, "Application Users");

  if (Array.isArray(data.utilisateurs)) {
    data.utilisateurs.forEach((user) => {
      addInfoCard(
        doc,
        asText(user.role, "User"),
        user.description
      );

      if (Array.isArray(user.permissions) && user.permissions.length) {
        addParagraph(doc, "Permissions:", {
          fontSize: 9,
          spacing: 3,
        });

        addBulletList(doc, user.permissions);
      }
    });
  }

  addSubheading(doc, "Project Constraints");
  addBulletList(doc, data.contraintes);

  addSubheading(doc, "Information to Be Confirmed");
  addBulletList(doc, data.informationsAConfirmer);
}

/* =========================================================
   SECTION 3 — MOCKUPS & VISUAL DESIGN
========================================================= */

function addMockupsVisualDesign(doc, data) {
  addSectionTitle(
    doc,
    3,
    "Mockups & Visual Design",
    "Visual direction, interface structure and user experience recommendations."
  );

  addSubheading(doc, "Art Direction");
  addParagraph(doc, data.directionArtistique);

  addSubheading(doc, "Graphic Style");
  addParagraph(doc, data.styleGraphique);

  addSubheading(doc, "Color Palette");

  const palette = Array.isArray(data.paletteCouleurs)
    ? data.paletteCouleurs.map((item) => {
        if (typeof item === "object" && item !== null) {
          return [
            `Color: ${asText(item.color)}`,
            `Source: ${asText(item.source)}`,
            `Recommended use: ${asText(item.recommendedUse)}`,
          ].join(" | ");
        }

        return item;
      })
    : [data.paletteCouleurs];

  addBulletList(doc, palette);

  addSubheading(doc, "Visual References");
  addBulletList(doc, data.referencesVisuelles);

  addSubheading(doc, "Main Interfaces");

  if (Array.isArray(data.interfacesPrincipales)) {
    data.interfacesPrincipales.forEach((item) => {
      addInfoCard(
        doc,
        asText(item.nom, "Interface"),
        item.description
      );

      addBulletList(doc, item.elements);
    });
  }

  addSubheading(doc, "UX Recommendations");
  addBulletList(doc, data.recommandationsUX);
}

/* =========================================================
   SECTION 4 — TECHNICAL SPECIFICATIONS
========================================================= */

function addFunctionalRequirements(doc, items) {
  addSubheading(doc, "Functional Requirements");

  if (!Array.isArray(items)) return;

  items.forEach((item) => {
    ensureSpace(doc, 65);

    const title = asText(item.nom, "Feature");
    const priority = asText(item.priorite, "Not specified");

    const y = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.dark)
      .text(title, PAGE.margin, y, {
        width: CONTENT_WIDTH - 100,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.gold)
      .text(priority.toUpperCase(), PAGE.margin + 405, y, {
        width: 94,
        align: "right",
      });

    doc.moveDown(0.4);

    addParagraph(doc, item.description, {
      fontSize: 9,
      spacing: 3,
    });

    addKeyValue(
      doc,
      "Source",
      item.origine || "recommendation"
    );

    doc.moveDown(0.3);
  });
}

function addArchitecture(doc, data) {
  addSubheading(doc, "Proposed Technical Architecture");

  const architecture = [
    ["Frontend", data.frontend],
    ["Backend", data.backend],
    ["Database", data.baseDeDonnees],
    ["Hosting", data.hebergement],
  ];

  architecture.forEach(([label, value]) => {
    addKeyValue(doc, label, value);
  });

  addSubheading(doc, "Architecture Justification");
  addParagraph(doc, data.justification);
}

/* =========================================================
   UML TABLE
========================================================= */

function addUMLTable(doc, diagrams) {
  addSubheading(doc, "UML Diagrams");

  if (!Array.isArray(diagrams) || diagrams.length === 0) {
    addParagraph(doc, "No UML diagrams were specified.");
    return;
  }

  const columns = [
    { x: PAGE.margin, width: 105, title: "UML DIAGRAM" },
    {
      x: PAGE.margin + 105,
      width: 185,
      title: "PURPOSE / DESCRIPTION",
    },
    {
      x: PAGE.margin + 290,
      width: 209,
      title: "MAIN ELEMENTS",
    },
  ];

  const drawHeader = () => {
    ensureSpace(doc, 35);

    const y = doc.y;

    doc
      .rect(PAGE.margin, y, CONTENT_WIDTH, 27)
      .fill(COLORS.dark);

    columns.forEach((column) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(COLORS.gold)
        .text(column.title, column.x + 6, y + 9, {
          width: column.width - 12,
        });
    });

    doc.y = y + 27;
  };

  drawHeader();

  diagrams.forEach((diagram) => {
    const name = asText(diagram.type, "UML Diagram");
    const description = asText(diagram.description);

    const elements = Array.isArray(diagram.elements)
      ? diagram.elements.map((item) => asText(item)).join(", ")
      : asText(diagram.elements);

    doc.font("Helvetica").fontSize(8);

    const nameHeight = doc.heightOfString(name, {
      width: 93,
      lineGap: 2,
    });

    const descriptionHeight = doc.heightOfString(description, {
      width: 173,
      lineGap: 2,
    });

    const elementsHeight = doc.heightOfString(elements, {
      width: 197,
      lineGap: 2,
    });

    const rowHeight =
      Math.max(nameHeight, descriptionHeight, elementsHeight) + 18;

    const availableHeight =
      bottomLimit(doc) - doc.page.margins.top;

    if (
      rowHeight <= availableHeight &&
      doc.y + rowHeight > bottomLimit(doc)
    ) {
      addReportPage(doc);
      drawHeader();
    }

    const y = doc.y;

    doc
      .rect(PAGE.margin, y, CONTENT_WIDTH, rowHeight)
      .fill("#FAF9F6");

    columns.forEach((column, index) => {
      const value = [name, description, elements][index];

      doc
        .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .fillColor(COLORS.text)
        .text(value, column.x + 6, y + 8, {
          width: column.width - 12,
          lineGap: 2,
        });
    });

    doc.y = y + rowHeight;
  });

  doc.moveDown(0.5);
}

/* =========================================================
   DEVELOPMENT DURATION
========================================================= */

function addDurationEstimation(doc, data) {
  addSubheading(doc, "Development Duration Estimation");

  addInfoCard(
    doc,
    "Estimated Development Duration",
    data.dureeTotale ||
      "To be confirmed after requirements analysis."
  );

  if (Array.isArray(data.phases)) {
    data.phases.forEach((phase, index) => {
      ensureSpace(doc, 55);

      const y = doc.y;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.dark)
        .text(
          `${index + 1}. ${asText(
            phase.nom,
            "Development phase"
          )}`,
          PAGE.margin,
          y,
          {
            width: 380,
          }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.gold)
        .text(
          asText(phase.dureeEstimee, "To be estimated"),
          PAGE.margin + 380,
          y,
          {
            width: 119,
            align: "right",
          }
        );

      doc.moveDown(0.5);

      addBulletList(doc, phase.taches);

      doc.moveDown(0.2);
    });
  }

  addSubheading(doc, "Estimation Justification");
  addParagraph(doc, data.justification);

  addSubheading(doc, "Factors That May Influence the Timeline");
  addBulletList(doc, data.facteursInfluence);
}

/* =========================================================
   SECTION 4 — MAIN RENDERER
========================================================= */

function addTechnicalSpecifications(doc, data) {
  addSectionTitle(
    doc,
    4,
    "Technical Specifications",
    "Functional requirements, proposed architecture, security and estimated development schedule."
  );

  addFunctionalRequirements(doc, data.fonctionnalites);

  addArchitecture(doc, data.architectureProposee || {});

  addSubheading(doc, "Security Requirements");
  addBulletList(doc, data.securite);

  addSubheading(doc, "Performance Requirements");
  addBulletList(doc, data.performance);

  addSubheading(doc, "Responsive Design & Compatibility");
  addParagraph(doc, data.responsiveEtCompatibilite);

  addSubheading(doc, "External Integrations");
  addBulletList(doc, data.integrations);

  addUMLTable(doc, data.diagrammesUML);

  addDurationEstimation(
    doc,
    data.estimationDuree || {}
  );

  addSubheading(doc, "Technical Assumptions");
  addBulletList(doc, data.hypothesesTechniques);

  ensureSpace(doc, 80);

  addInfoCard(
    doc,
    "Planning Note",
    "The development duration is an initial estimate based on the information currently available. The final schedule may change after detailed requirements validation, design approval and technical assessment."
  );
}

/* =========================================================
   HEADER & FOOTER
   Draws on existing pages only.
   Never calls addPage().
========================================================= */

function addHeaderAndFooter(doc) {
  const range = doc.bufferedPageRange();

  const totalPages = range.count;
  const reportPages = Math.max(totalPages - 1, 1);

  // Skip cover page (index 0).
  for (
    let pageIndex = range.start + 1;
    pageIndex < range.start + totalPages;
    pageIndex++
  ) {
    doc.switchToPage(pageIndex);

    const page = doc.page;
    const previousBottomMargin = page.margins.bottom;

    // Prevent footer text from triggering automatic pagination.
    page.margins.bottom = 0;

    doc.save();

    // Header.
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        "Azzouzi Mounir  |  PROJECT SPECIFICATION",
        PAGE.margin,
        PAGE.headerY,
        {
          width: CONTENT_WIDTH,
          lineBreak: false,
        }
      );

    doc
      .moveTo(PAGE.margin, 42)
      .lineTo(PAGE.margin + CONTENT_WIDTH, 42)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    // Footer separator.
    doc
      .moveTo(PAGE.margin, 760)
      .lineTo(PAGE.margin + CONTENT_WIDTH, 760)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    // Footer page number.
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `PAGE ${pageIndex - range.start} OF ${reportPages}`,
        PAGE.margin,
        PAGE.footerY,
        {
          width: CONTENT_WIDTH,
          align: "center",
          lineBreak: false,
        }
      );

    doc.restore();

    page.margins.bottom = previousBottomMargin;
  }

  // Return to the final page.
  doc.switchToPage(range.start + totalPages - 1);
}

/* =========================================================
   MAIN PDF GENERATOR
========================================================= */

export async function generateProjectPDF(project, analysis) {
  return new Promise((resolve, reject) => {
    try {
      if (!analysis || typeof analysis !== "object") {
        throw new Error("Invalid project analysis data.");
      }

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 62,
          bottom: 55,
          left: PAGE.margin,
          right: PAGE.margin,
        },
        bufferPages: true,
        compress: true,
        info: {
          Title: `Project Specification - ${asText(
            project?.subject_project,
            "Project"
          )}`,
          Author: "Azzouzi Mounir",
          Subject: "Project Planning and Technical Specification",
          Creator: "Azzouzi Mounir",
        },
      });

      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("error", (error) => {
        reject(error);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      // PAGE 1 — COVER.
      addCoverPage(doc, project);

      // PAGE 2 — TABLE OF CONTENTS.
      const contentsPageIndex = addContentsPage(doc);

      // PAGE 3 — START REPORT ON A NEW PAGE.
      doc.addPage();

      const sections = [
        {
          title: "Project Presentation",
          render: () =>
            addProjectPresentation(
              doc,
              analysis.presentationProjet || {}
            ),
        },
        {
          title: "Context & Environment",
          render: () =>
            addContextEnvironment(
              doc,
              analysis.contexteEnvironnement || {}
            ),
        },
        {
          title: "Mockups & Visual Design",
          render: () =>
            addMockupsVisualDesign(
              doc,
              analysis.maquettesVisuels || {}
            ),
        },
        {
          title: "Technical Specifications",
          render: () =>
            addTechnicalSpecifications(
              doc,
              analysis.specificitesTechniques || {}
            ),
        },
      ];

      const contents = [];

      sections.forEach((section) => {
        const pagesBefore = getPageCount(doc);

        /*
         * Physical page number minus the cover page.
         * Example: physical page 3 => report page 2.
         */
        const startPage = pagesBefore - 1;

        contents.push({
          title: section.title,
          page: startPage,
        });

        section.render();

        console.log(
          `[PDF] ${section.title}: ${pagesBefore} -> ${getPageCount(doc)} total pages`
        );
      });

      // Update TOC after all sections have been rendered.
      writeContentsEntries(
        doc,
        contentsPageIndex,
        contents
      );

      // Add header/footer to existing pages only.
      addHeaderAndFooter(doc);

      console.log(
        "[PDF] FINAL TOTAL PAGES:",
        getPageCount(doc)
      );

      // Finish PDF generation.
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default generateProjectPDF;
