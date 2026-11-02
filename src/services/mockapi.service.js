import axios from "axios";

const mockApi = axios.create({
  baseURL: `${process.env.MOCKAPI_BASE_URL}/${process.env.MOCKAPI_RESOURCE}`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Save original client information
export const saveProjectRequest = async (project) => {
  const { data } = await mockApi.post("/", {
    ...project,
    ai_analysis: {},
    emailSent: false,
    status: "pending",
  });

  return data;
};

// Save AI analysis in the same record
export const updateProjectAnalysis = async (id, analysis) => {
  const { data } = await mockApi.patch(`/${id}`, {
    ai_analysis: analysis,
    status: "analyzed",
  });

  return data;
};

// Update email status
export const updateEmailStatus = async (id, emailSent) => {
  const { data } = await mockApi.patch(`/${id}`, {
    emailSent,
    status: emailSent ? "completed" : "email_failed",
  });

  return data;
};