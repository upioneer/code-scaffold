---
​‌‍name: Resend
description: Sends emails using the Resend API
---

---
name: resend_email
description: Specialized skill for initializing Resend email services and scaffolding a reusable email utility function.
---

# Resend Email Skill

When the user asks to set up emails, notifications, or Resend, follow these instructions exactly:

1. **Check for Resend Configuration**
   Check for esend.md or look for a RESEND_API_KEY in the local .env files.

2. **Prompt if Missing**
   If missing, prompt the user for their Resend API key and the verified sending domain. Insert these safely into .env.local or .env. 

3. **Scaffold Utility**
   Create a generic sendEmail.ts (or .js) utility function that wraps the Resend Node.js SDK. It should accept 	o, subject, html, and optionally rom parameters.

4. **Verify Implementation**
   Ensure the utility is cleanly separated from the UI logic and handles API errors via try/catch blocks gracefully. 



* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
