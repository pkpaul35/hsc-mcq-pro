HSC MCQ Pro — আপডেট প্যাকেজ

এই ZIP-এ আছে: index.html, firebase-config.js, firestore.rules, firebase.json, manifest.json এবং এই নির্দেশিকা।

নতুন UI: বাংলা স্লোগান, হোমপেজ ফিচার কার্ড, শিক্ষার্থী/শিক্ষক রেজিস্ট্রেশন, নাম-মোবাইল-ইমেইল-পাসওয়ার্ড, শিক্ষার্থীর একাদশ/দ্বাদশ ও বিভাগ, শিক্ষকের বিভাগ ও বিষয়, MCQ প্রদর্শন এবং অ্যাডমিন প্রশ্ন যোগ করার ফর্ম।

গুরুত্বপূর্ণ: অন্তর্ভুক্ত firebase-config.js ফাইলে placeholder রয়েছে; আপনার আসল Firebase Web App config ও ADMIN_EMAIL বসাতে হবে।

OTP/লগইন সীমাবদ্ধতা: নিরাপদ SMS OTP-এর জন্য Firebase Phone Authentication + reCAPTCHA/domain setup প্রয়োজন। ইমেইল OTP পাঠানো ও যাচাই করতে সার্ভার-সাইড Cloud Functions এবং ইমেইল provider প্রয়োজন। শুধু frontend দিয়ে নিরাপদ email OTP করা যায় না। এই ZIP-এ ওই OTP backend অন্তর্ভুক্ত নয়; বর্তমান রেজিস্ট্রেশন Firebase Email/Password ব্যবহার করে এবং login-ও ইমেইল/পাসওয়ার্ডে। মোবাইল নম্বর/পাসওয়ার্ড login-এর জন্য নিরাপদ phone-to-account mapping backend প্রয়োজন। UI-তে বিষয়গুলো স্পষ্ট রাখা হয়েছে—এগুলো সম্পূর্ণ OTP authentication হিসেবে ব্যবহার করবেন না।

ব্যবহার: ফাইলগুলো একই ফোল্ডারে Extract করুন; firebase-config.js-এ নিজের config বসান; Firebase Console-এ Email/Password Auth চালু রাখুন; Firebase Hosting বা HTTP server দিয়ে চালান (file:// দিয়ে নয়)। Firestore rules-এ ADMIN_EMAIL একই রাখুন।


OTP backend scaffold (পরবর্তী কনফিগারেশন আবশ্যক):
- functions/index.js-এ email OTP পাঠানো/যাচাইয়ের callable Cloud Functions যোগ করা হয়েছে।
- Firebase Console/CLI-তে Functions deploy করতে হবে; billing plan প্রয়োজন হতে পারে।
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OTP_PEPPER secrets সেট না করলে ইমেইল OTP কাজ করবে না।
- এই backend scaffold এখনও index.html-এর registration flow-এর সাথে সংযুক্ত নয়; deployment এবং client integration পরবর্তী কাজ।
- SMS OTP-এর জন্য Firebase Phone Auth + reCAPTCHA এবং অনুমোদিত domain কনফিগার করতে হবে।
- Phone + password login ও email OTP password reset সম্পূর্ণ করতে অতিরিক্ত backend/client integration প্রয়োজন। এই ZIP-কে OTP-সম্পূর্ণ বলে ধরে নেবেন না।
