
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
    });

    throw error;
  }
};

export const sendProjectReport = async (project, pdfBuffer, projectTitle) => {
  return transporter.sendMail({
    from: {
      name: "Mounir Azzouzi",
      address: process.env.SMTP_USER,
    },

    to: project.email,

    replyTo: process.env.DEVELOPER_EMAIL,

    subject: `Your Project Analysis Report – ${projectTitle}`,

    text: `
Hello ${project.full_name},

Thank you for trusting Mounir Azzouzi with your project.

Your project analysis has been completed successfully.

Please find your personalized PDF report attached to this email.

If you have any questions or would like to discuss the recommendations, feel free to reply to this email.

Best regards,
${process.env.DEVELOPER_NAME}
Mounir Azzouzi
${process.env.PORTFOLIO_URL}
    `,

    html: `
      <div style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;line-height:1.7">
        <h2 style="color:#B68C45">Mounir Azzouzi</h2>
        <p>Hello ${project.full_name},</p>
        <p>Thank you for trusting us with your project.</p>
        <p>Your personalized project analysis report is ready.</p>
        <p>Please find your PDF report attached to this email.</p>
        <p>If you have any questions, simply reply to this message.</p>
        <p>Best regards,<br/>
        <strong>${process.env.DEVELOPER_NAME}</strong><br/>
        Mounir Azzouzi</p>
        <a href="${process.env.PORTFOLIO_URL}">Visit Portfolio</a>
      </div>
    `,

    attachments: [
      {
        filename: "ProjectMind-AI-Report.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
};
