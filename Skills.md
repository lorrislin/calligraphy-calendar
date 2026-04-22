# Antigravity Agent Skills

This file contains Standard Operating Procedures (SOPs) for the Antigravity AI assistant. When the user gives a command that matches a skill below, refer to the instructions to execute it properly.

## Skill: Validate Pending Links
**Trigger Command:** "validate pending links" or "check pending events"

**Workflow Instructions:**
1. **Query Database:** Use the `mcp_supabase_execute_sql` tool to query the Supabase `competitions` table for all rows where `status = 'pending'`.
2. **Review Links:** For each pending event, use the `browser_subagent` to visit the event's `url`. 
3. **Extract Data:** Look specifically for:
   - The actual event or exhibition dates.
   - The deadline for physical or online submission (`deadline`).
   - The location of the event.
   *Note: These details are often embedded inside images (e.g., posters) or PDF links on the page.*
4. **Update Database:** Use SQL to update the `start_date`, `deadline`, and `location` for each event ID you reviewed.
5. **Approve:** Change the `status` of these events from `'pending'` to `'approved'` so they appear live on the website.
6. **Report:** Summarize to the user which events were approved and what dates were inserted.
