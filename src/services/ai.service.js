
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const parseProjectDescription = (description) => {
  if (!description) return {};

  if (typeof description === "object") {
    return description;
  }

  try {
    return JSON.parse(description);
  } catch {
    return {
      presentation: description,
    };
  }
};

const normalizeAnalysis = (analysis) => ({
  projectTitle: analysis.projectTitle || "Project Specification",

  presentationProjet: {
    presentationGenerale:
      analysis.presentationProjet?.presentationGenerale || "To be specified",

    objectifPrincipal:
      analysis.presentationProjet?.objectifPrincipal || "To be specified",

    problematique:
      analysis.presentationProjet?.problematique || "To be specified",

    fonctionnementGlobal:
      analysis.presentationProjet?.fonctionnementGlobal || "To be specified",

    besoinsClient:
      analysis.presentationProjet?.besoinsClient || [],

    resultatsAttendus:
      analysis.presentationProjet?.resultatsAttendus || [],
  },

  contexteEnvironnement: {
    contexteActivite:
      analysis.contexteEnvironnement?.contexteActivite || "To be specified",

    environnementProjet:
      analysis.contexteEnvironnement?.environnementProjet || "To be specified",

    publicCible:
      analysis.contexteEnvironnement?.publicCible || "To be specified",

    utilisateurs:
      analysis.contexteEnvironnement?.utilisateurs || [],

    contraintes:
      analysis.contexteEnvironnement?.contraintes || [],

    informationsAConfirmer:
      analysis.contexteEnvironnement?.informationsAConfirmer || [],
  },

  maquettesVisuels: {
    directionArtistique:
      analysis.maquettesVisuels?.directionArtistique || "To be specified",

    styleGraphique:
      analysis.maquettesVisuels?.styleGraphique || "To be specified",

    paletteCouleurs:
      analysis.maquettesVisuels?.paletteCouleurs || [],

    referencesVisuelles:
      analysis.maquettesVisuels?.referencesVisuelles || [],

    interfacesPrincipales:
      analysis.maquettesVisuels?.interfacesPrincipales || [],

    recommandationsUX:
      analysis.maquettesVisuels?.recommandationsUX || [],
  },

  specificitesTechniques: {
    fonctionnalites:
      analysis.specificitesTechniques?.fonctionnalites || [],

    architectureProposee: {
      frontend:
        analysis.specificitesTechniques?.architectureProposee?.frontend ||
        "To be determined",

      backend:
        analysis.specificitesTechniques?.architectureProposee?.backend ||
        "To be determined",

      baseDeDonnees:
        analysis.specificitesTechniques?.architectureProposee?.baseDeDonnees ||
        "To be determined",

      hebergement:
        analysis.specificitesTechniques?.architectureProposee?.hebergement ||
        "To be determined",

      justification:
        analysis.specificitesTechniques?.architectureProposee?.justification ||
        "To be specified",
    },

    securite:
      analysis.specificitesTechniques?.securite || [],

    performance:
      analysis.specificitesTechniques?.performance || [],

    responsiveEtCompatibilite:
      analysis.specificitesTechniques?.responsiveEtCompatibilite || [],

    integrations:
      analysis.specificitesTechniques?.integrations || [],

    diagrammesUML:
      analysis.specificitesTechniques?.diagrammesUML || [],

    estimationDuree: {
      dureeTotale:
        analysis.specificitesTechniques?.estimationDuree?.dureeTotale ||
        "To be estimated",

      phases:
        analysis.specificitesTechniques?.estimationDuree?.phases || [],

      justification:
        analysis.specificitesTechniques?.estimationDuree?.justification ||
        "To be specified",

      facteursInfluence:
        analysis.specificitesTechniques?.estimationDuree?.facteursInfluence ||
        [],
    },

    hypothesesTechniques:
      analysis.specificitesTechniques?.hypothesesTechniques || [],
  },
});

export const analyzeProject = async (project) => {
  if (!process.env.OPENAI_MODEL) {
    throw new Error("OPENAI_MODEL is missing from environment variables.");
  }

  const questionnaire = parseProjectDescription(
    project.descripton_pr
  );

  const projectInformation = {
    client: {
      name: project.full_name,
      email: project.email,
      phone: project.phone || "Not provided",
    },

    projectType: project.subject_project,

    clientDescription: questionnaire,
  };

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL,

    instructions: `
You are ProjectMind AI, a senior software architect,
business analyst, UI/UX consultant and technical project manager.

YOUR TASK:
Create a complete, professional and detailed Software Requirements
Specification (SRS) / Project Specification document.

LANGUAGE:
Write the entire report in professional English.
All section titles, descriptions, recommendations and technical
explanations must be in English.

IMPORTANT ANALYSIS RULES:

1. Analyze every project individually.
2. Understand the complete application the client wants to build.
3. Explain the main objective of the application in detail.
4. Describe how the application should work from beginning to end.
5. Identify the different user roles and their responsibilities.
6. Identify the functional requirements and organize them clearly.
7. Separate requirements explicitly provided by the client from
   technical recommendations proposed by you.
8. Never invent client requirements or claim that an unconfirmed
   feature was requested.
9. If information is missing, write "To be specified".
10. Make realistic technical recommendations according to the
    actual project requirements.
11. Estimate the development duration based on complexity,
    functionality, integrations and technical constraints.
12. Provide a realistic duration breakdown by development phase.
13. Explain the assumptions behind the duration estimate.
14. Do not estimate or mention project budgets, prices, costs,
    financial amounts or hourly rates.
15. Do not include a delivery deadline unless the client explicitly
    provided one.
16. Include UML diagrams only when they provide real value.
17. Avoid generic descriptions. Be specific and detailed.
18. Return valid JSON only. Do not use Markdown or code fences.

DOCUMENT STRUCTURE:

SECTION 1: PROJECT PRESENTATION

Include:
- General project presentation.
- Main objective of the application.
- Problem the application intends to solve.
- Overall application workflow.
- Client needs and expectations.
- Expected results.

The objective must explain the application as a complete product:
what it does, who uses it, its main purpose and how users interact
with its main functionalities.

SECTION 2: CONTEXT AND ENVIRONMENT

Include:
- Business and activity context.
- Project environment.
- Target audience.
- User roles and permissions.
- Functional and organizational constraints.
- Missing information that needs client confirmation.

SECTION 3: MOCKUPS AND VISUAL DESIGN

Include:
- Proposed artistic direction.
- Visual identity and design style.
- Suggested color palette when appropriate.
- Visual references provided by the client.
- Main application screens and their content.
- UX and usability recommendations.

Never claim that a mockup exists if the client did not provide one.
Clearly label your visual suggestions as recommendations.

SECTION 4: TECHNICAL SPECIFICATIONS

Include:
- Detailed functional requirements.
- Proposed frontend architecture.
- Proposed backend architecture.
- Database recommendations.
- Hosting and deployment recommendations.
- Security requirements.
- Performance requirements.
- Responsive design and browser compatibility.
- External integrations and APIs.
- Relevant UML diagrams.
- Technical assumptions.
- Development duration estimation.

DURATION ESTIMATION:

Estimate the total development duration realistically.

Break it down into relevant phases, for example:
- Requirements analysis and planning.
- UI/UX design.
- Frontend development.
- Backend development.
- Database and API integration.
- Testing and bug fixing.
- Deployment and delivery.

For each phase provide:
- Phase name.
- Estimated duration.
- Main tasks.

Use days or weeks, not financial amounts.

The total duration must be consistent with the phase estimates.
Explain that this is a preliminary technical estimate and may change
after requirements validation.

OUTPUT JSON STRUCTURE:

{
  "projectTitle": "",
  "presentationProjet": {
    "presentationGenerale": "",
    "objectifPrincipal": "",
    "problematique": "",
    "fonctionnementGlobal": "",
    "besoinsClient": [],
    "resultatsAttendus": []
  },
  "contexteEnvironnement": {
    "contexteActivite": "",
    "environnementProjet": "",
    "publicCible": "",
    "utilisateurs": [
      {
        "role": "",
        "description": "",
        "permissions": []
      }
    ],
    "contraintes": [],
    "informationsAConfirmer": []
  },
  "maquettesVisuels": {
    "directionArtistique": "",
    "styleGraphique": "",
    "paletteCouleurs": [],
    "referencesVisuelles": [],
    "interfacesPrincipales": [
      {
        "nom": "",
        "description": "",
        "elements": []
      }
    ],
    "recommandationsUX": []
  },
  "specificitesTechniques": {
    "fonctionnalites": [
      {
        "nom": "",
        "description": "",
        "priorite": "High, Medium or Low",
        "origine": "Client requirement or AI recommendation"
      }
    ],
    "architectureProposee": {
      "frontend": "",
      "backend": "",
      "baseDeDonnees": "",
      "hebergement": "",
      "justification": ""
    },
    "securite": [],
    "performance": [],
    "responsiveEtCompatibilite": [],
    "integrations": [],
    "diagrammesUML": [
      {
        "type": "",
        "description": "",
        "elements": []
      }
    ],
    "estimationDuree": {
      "dureeTotale": "",
      "phases": [
        {
          "nom": "",
          "dureeEstimee": "",
          "taches": []
        }
      ],
      "justification": "",
      "facteursInfluence": []
    },
    "hypothesesTechniques": []
  }
}

Ensure that all four sections are detailed, coherent and specific
to the submitted project.
`,

    input: `
Analyze the following client project information:

${JSON.stringify(projectInformation, null, 2)}
`,

    store: false,
  });

  const content = response.output_text;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  let analysis;

  try {
    analysis = JSON.parse(content);
  } catch (error) {
    console.error("Invalid AI JSON response:", content);
    throw new Error("OpenAI returned invalid JSON.");
  }

  return normalizeAnalysis(analysis);
};
