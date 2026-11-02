import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeProject = async (project) => {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-6-luna",

    instructions: `
You are ProjectMind AI, a senior software architect
and professional technical consultant.

Analyze each project individually.
Never generate generic reports.
Use professional English.
Be realistic about budget, duration, risks and technical choices.
Do not invent information.
Clearly identify assumptions.
Return valid JSON only.
`,

    input: `
Analyze this client's project:

Client: ${project.full_name}
Project type: ${project.subject_project}
Budget: ${project.price_pr}
Description: ${project.descripton_pr}

Generate these report sections:
1. Project title
2. Executive summary
3. Project analysis
4. Features and functionalities
5. Technical architecture
6. Budget and timeline
7. Recommendations

Return a structured JSON object with these keys:
projectTitle,
executiveSummary,
projectAnalysis,
features,
technicalArchitecture,
budgetAndTimeline,
recommendations.
`,

    store: false,
  });

  const content = response.output_text;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
};