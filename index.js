const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const OTP_PEPPER = defineSecret("OTP_PEPPER");

function otpHash(email, code, pepper) {
  return crypto.createHash("sha256").update(`${email.toLowerCase()}|${code}|${pepper}`).digest("hex");
}

exports.sendEmailOtp = onCall({ secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OTP_PEPPER] }, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError("invalid-argument", "সঠিক ইমেইল দিন।");
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const ref = db.collection("emailOtps").doc(crypto.createHash("sha256").update(email).digest("hex"));
  const now = Date.now();
  const prev = await ref.get();
  if (prev.exists && now - (prev.data().lastSentAt || 0) < 60_000) throw new HttpsError("resource-exhausted", "নতুন OTP পাঠানোর আগে ১ মিনিট অপেক্ষা করুন।");
  await ref.set({ hash: otpHash(email, code, OTP_PEPPER.value()), expiresAt: now + 10 * 60_000, attempts: 0, lastSentAt: now }, { merge: true });
  const transporter = nodemailer.createTransport({ host: SMTP_HOST.value(), port: Number(SMTP_PORT.value()), secure: Number(SMTP_PORT.value()) === 465, auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() } });
  try {
    await transporter.sendMail({ from: SMTP_USER.value(), to: email, subject: "HSC MCQ Pro verification code", text: `আপনার HSC MCQ Pro OTP: ${code}\nএটি ১০ মিনিটের মধ্যে ব্যবহার করুন। কাউকে OTP দেবেন না।` });
  } catch (e) {
    await ref.delete();
    throw new HttpsError("internal", "ইমেইল পাঠানো যায়নি। SMTP সেটিং পরীক্ষা করুন।");
  }
  return { ok: true, message: "ইমেইলে OTP পাঠানো হয়েছে।" };
});

exports.verifyEmailOtp = onCall({ secrets: [OTP_PEPPER] }, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  const code = String(request.data?.code || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "ইমেইল ও ৬ সংখ্যার OTP দিন।");
  const id = crypto.createHash("sha256").update(email).digest("hex");
  const ref = db.collection("emailOtps").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("failed-precondition", "আগে OTP পাঠান।");
  const d = snap.data();
  if (Date.now() > d.expiresAt) { await ref.delete(); throw new HttpsError("deadline-exceeded", "OTP-এর মেয়াদ শেষ। নতুন OTP নিন।"); }
  if ((d.attempts || 0) >= 5) { await ref.delete(); throw new HttpsError("resource-exhausted", "অনেকবার ভুল হয়েছে। নতুন OTP নিন।"); }
  if (otpHash(email, code, OTP_PEPPER.value()) !== d.hash) {
    await ref.update({ attempts: (d.attempts || 0) + 1 });
    throw new HttpsError("permission-denied", "OTP সঠিক নয়।");
  }
  await ref.delete();
  return { ok: true, verified: true };
});
