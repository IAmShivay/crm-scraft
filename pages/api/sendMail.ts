import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { to, subject, text, html } = req.body as EmailPayload;

    if (!to || !subject || (!text && !html)) {
      res.status(400).json({ success: false, error: "Invalid input data." });
      return;
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10), // Default to port 587
      secure: false, // Use true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      // Send the email
      const info = await transporter.sendMail({
        from: `"Your Name" <${process.env.SMTP_USER}>`, // Sender's email address
        to,
        subject,
        text,
        html,
      });

      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
