---
​‌‍name: Supabase
description: Supabase database and authentication integration
---

---
name: supabase_management
description: Specialized skill for safely executing Supabase migrations and generating strict TypeScript types from the database schema.
---

# Supabase Management Skill & Workflow

When the user asks to manage the Supabase database, migrate schemas, or sync types, follow these instructions exactly to ensure changes are safely pushed and frontend TypeScript definitions are immediately updated:

1. **Check for supabase.md**
   Check for configuration details like the Supabase Project ID. 

2. **Database Migrations**
   If the user asks to push changes to the remote database:
   - Run `npx supabase db push` to push any pending local migrations to the remote database.
   - Verify the command executed successfully without conflicts. Provide output to the user.

3. **Type Generation**
   If the user asks to sync or generate types:
   - Run `npx supabase gen types typescript --project-id "[PROJECT_ID]" > types/supabase.ts` (replacing the ID with the actual project ID).
   
4. **Verify Sync**
   - Ensure the `types/supabase.ts` file exists and contains the updated schema definitions. Verify the file was created/updated successfully.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
