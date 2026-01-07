import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to, resetLink) {
  try {
    const { data, error } = await resend.emails.send({
      from: "URTEXT <onboarding@resend.dev>", // Use this for testing, your domain later
      to,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset for your URTEXT account.</p>
          <a href="${resetLink}" style="display: inline-block; background: #2389e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Reset Password
          </a>
          <p>This link expires in 10 minutes.</p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Email error:", error);
      throw error;
    }

    console.log("Email sent:", data);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
