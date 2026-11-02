import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
import { verifyEmailConnection } from "./services/email.service.js";

verifyEmailConnection().catch(() => {
  console.error("Check your Gmail SMTP configuration.");
});

app.listen(PORT, () => {
  console.log(`Azzouzip API running on port ${PORT}`);
});