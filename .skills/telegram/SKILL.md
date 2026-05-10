---
name: telegram_notify
description: Specialized skill for dispatching alerts, deployment statuses, or critical errors to a designated Telegram chat via the Bot API.
---

# Telegram Notifications Skill

When the user asks to set up Telegram notifications, deploy hooks, or chat alerts, follow these instructions exactly:

1. **Verify Credentials**
   Ensure the project contains a TELEGRAM_BOT_TOKEN and a DEFAULT_CHAT_ID in the local environment variables. Prompt the user for them if missing.

2. **Format Message**
   Construct a clean markdown-formatted string for the alert (e.g., *Deployment Successful*, or **Critical Error on Edge Function**).

3. **Dispatch HTTP Post**
   Make a standard HTTP POST request to https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage with the payload { "chat_id": "<DEFAULT_CHAT_ID>", "text": "<Message>", "parse_mode": "Markdown" }. 

