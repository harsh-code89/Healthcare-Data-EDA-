/**
 * Netlify Function: send-welcome-email
 * Triggered after a new user signs up.
 * Sends a branded welcome + email confirmation email via Resend.
 *
 * POST /api/send-welcome-email
 * Body: { email, name, confirmationUrl }
 *
 * Security: RESEND_API_KEY is a server-side secret, never sent to client.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "CareOS <no-reply@careoshealth.com>";
const APP_URL = process.env.APP_URL || "https://careoshealth.netlify.app";

/** Escape HTML to prevent XSS in email templates */
function escapeHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Build the HTML email template */
function buildWelcomeEmail(name, confirmationUrl) {
  const safeName = escapeHtml(name);
  const firstName = safeName.split(" ")[0] || "there";
  const safeUrl = encodeURI(confirmationUrl); // Ensure URL is safe

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to CareOS — Confirm your email</title>
  <style>
    /* Base reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }

    /* Main wrapper */
    .email-wrapper { width: 100%; background-color: #f1f5f9; padding: 40px 16px; }

    /* Card */
    .email-card { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }

    /* Header */
    .email-header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 36px 40px 32px; text-align: center; }
    .email-logo { display: inline-flex; align-items: center; gap: 10px; }
    .email-logo-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: inline-block; text-align: center; line-height: 40px; font-size: 20px; }
    .email-logo-text { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
    .email-tagline { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 6px; }

    /* Body */
    .email-body { padding: 40px; }
    .email-greeting { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 16px; line-height: 1.3; }
    .email-text { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 24px; }
    .email-text strong { color: #1e293b; font-weight: 600; }

    /* Divider */
    .email-divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }

    /* CTA section */
    .email-cta-section { text-align: center; margin: 32px 0; }
    .email-cta-label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
    .email-cta-btn { display: inline-block; background: #0891b2; color: #ffffff !important; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 10px; text-decoration: none; letter-spacing: 0.01em; transition: background 0.15s; }
    .email-cta-btn:hover { background: #0e7490; }

    /* Fallback link */
    .email-fallback { margin-top: 20px; font-size: 13px; color: #94a3b8; }
    .email-fallback a { color: #0891b2; word-break: break-all; }

    /* Features list */
    .feature-list { list-style: none; padding: 0; margin: 0 0 24px; }
    .feature-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; }
    .feature-item:last-child { border-bottom: none; }
    .feature-icon { color: #0891b2; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

    /* Warning box */
    .email-warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #9a3412; line-height: 1.6; margin-top: 24px; }

    /* Footer */
    .email-footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 40px; text-align: center; }
    .email-footer p { font-size: 12px; color: #94a3b8; margin: 0 0 6px; line-height: 1.6; }
    .email-footer a { color: #64748b; text-decoration: underline; }

    /* Mobile responsive */
    @media (max-width: 600px) {
      .email-body { padding: 28px 24px; }
      .email-footer { padding: 20px 24px; }
      .email-header { padding: 28px 24px; }
      .email-greeting { font-size: 20px; }
      .email-cta-btn { padding: 14px 28px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table class="email-card" cellpadding="0" cellspacing="0" role="presentation" width="100%">

      <!-- Header -->
      <tr>
        <td class="email-header">
          <div class="email-logo">
            <div class="email-logo-icon">🏥</div>
            <span class="email-logo-text">CareOS</span>
          </div>
          <div class="email-tagline">Your Personal Health Record Platform</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td class="email-body">
          <h1 class="email-greeting">Welcome aboard, ${firstName}! 👋</h1>

          <p class="email-text">
            We're thrilled to have you join <strong>CareOS</strong> — a secure, patient-controlled health record platform built for India.
            With CareOS, you can organize your complete healthcare journey in one place: consultations, medications, lab reports, appointments, and more.
          </p>

          <hr class="email-divider" />

          <p class="email-text" style="margin-bottom: 16px;">
            <strong>Before you get started, please confirm your email address.</strong><br />
            This keeps your account secure and ensures you can always recover access.
          </p>

          <div class="email-cta-section">
            <div class="email-cta-label">Action required</div>
            <a href="${safeUrl}" class="email-cta-btn" target="_blank" rel="noopener noreferrer">
              Confirm Email Address
            </a>
            <div class="email-fallback">
              Button not working? <br />
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                ${safeUrl}
              </a>
            </div>
          </div>

          <div class="email-warning">
            ⏱️ <strong>This link expires in 24 hours.</strong> If it has expired, sign in to CareOS and we'll send you a new confirmation link automatically.
          </div>

          <hr class="email-divider" />

          <p class="email-text" style="margin-bottom: 12px;"><strong>What you can do with CareOS:</strong></p>
          <ul class="feature-list">
            <li class="feature-item"><span class="feature-icon">📋</span> Keep all your health records and consultations in one secure timeline</li>
            <li class="feature-item"><span class="feature-icon">💊</span> Track medications, dosages, and prescriptions</li>
            <li class="feature-item"><span class="feature-icon">📅</span> Manage appointments with your care team</li>
            <li class="feature-item"><span class="feature-icon">🔬</span> Upload and access lab reports anytime</li>
            <li class="feature-item"><span class="feature-icon">🛡️</span> Create an emergency health profile that first responders can access</li>
            <li class="feature-item"><span class="feature-icon">🔒</span> Control exactly who sees your data with granular consent management</li>
          </ul>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="email-footer">
          <p>
            You received this email because an account was created with this address on
            <a href="${APP_URL}" target="_blank" rel="noopener noreferrer">CareOS</a>.
            If you didn't sign up, you can safely ignore this email.
          </p>
          <p style="margin-top: 10px;">
            <a href="${APP_URL}" target="_blank" rel="noopener noreferrer">Visit CareOS</a>
            &nbsp;·&nbsp;
            <a href="${APP_URL}/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
          <p style="margin-top: 12px; color: #cbd5e1;">
            © ${new Date().getFullYear()} CareOS. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>`;
}

export default async function handler(req, context) {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, name, confirmationUrl } = body;

  // Validate inputs
  if (!email || !confirmationUrl) {
    return new Response(
      JSON.stringify({ error: "email and confirmationUrl are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email address" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate that confirmationUrl starts with our APP_URL to prevent open redirects
  const expectedOrigin = APP_URL.replace(/\/$/, "");
  if (
    !confirmationUrl.startsWith(expectedOrigin) &&
    !confirmationUrl.startsWith("https://znhrhosoqccyerapcwpv.supabase.co")
  ) {
    console.warn(
      `Blocked suspicious confirmationUrl: ${confirmationUrl.substring(0, 80)}`
    );
    return new Response(JSON.stringify({ error: "Invalid confirmation URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Confirm your email — Welcome to CareOS",
      html: buildWelcomeEmail(name || "", confirmationUrl),
      // Idempotency key based on email + date to prevent duplicate sends on retry
      headers: {
        "X-Entity-Ref-ID": `welcome-${email}-${new Date().toISOString().split("T")[0]}`,
      },
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error sending welcome email:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
