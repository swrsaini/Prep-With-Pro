const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: "Prep With Pro <noreply@prepwithpro.in>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error('Unable to send email.');
  }

  return data;
}

module.exports = sendEmail;