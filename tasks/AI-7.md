# AI-7: Update portfolio main page to show AI agents as a skill

## Important Rules
- Do not run commands, always use MCP tools
- Stop if a tool is missing
- Always commit changes
- Always update this task list

## Task Description
Add "AI Agents" as a new skill icon in the Skills grid on the portfolio main page.

## Acceptance Criteria
1. A new icon labelled "AI Agents" appears in the Skills grid
2. Icon size, padding and hover behaviour match existing skill icons
3. Tooltip/alt text reads "AI Agents"
4. Grid remains responsive on all breakpoints (no layout shift)
5. Lighthouse performance score remains ≥ 95 (no CLS regressions)
6. Unit or Cypress test asserts icon renders in the DOM

## Tasks
1. [x] Create a new branch for this task
2. [x] Find or create an AI agent icon image and add to public/icons and public/hq_icons
   - Added files:
     - `/public/icons/ai-agents-icon.png` (standard resolution)
     - `/public/hq_icons/ai-agents-icon.png` (high resolution)
3. [x] Update TechType in techIcon.tsx to include "ai-agents"
4. [x] Add the new skill to the skills array in components/utils/skills.ts
5. [x] Write a test to verify the icon renders correctly
6. [  ] Update component snapshot if needed
7. [  ] Create or update Confluence documentation regarding:
   - Purpose of the AI Agents skill entry
   - SVG source, file location, naming conventions
   - Steps for adding future skills
   - Add changelog entry referencing this Jira ticket
   
   Documentation Content (to be added to Confluence):
   ```
   # AI Agents Skill Icon
   
   ## Purpose
   The AI Agents skill icon represents Art's experience in building autonomous, LLM-powered solutions. This skill was added to highlight expertise in developing conversational agents, recommendation systems, and other AI-powered applications.
   
   ## Asset Information
   - **Icon Name**: ai-agents
   - **File Format**: PNG
   - **Location**: 
     - `/public/icons/ai-agents-icon.png` (standard resolution)
     - `/public/hq_icons/ai-agents-icon.png` (high resolution)
   - **Source**: [Optional: Include the source of the icon here]
   
   ## Adding Future Skills
   To add a new skill to the portfolio site:
   
   1. Create icon files in both standard and high resolutions
   2. Add the new skill type to the `TechType` in `components/techIcon.tsx`
   3. Add the skill entry to the `skills` array in `components/utils/skills.ts`
   4. Create a test to verify the icon renders correctly
   5. Update component snapshots if necessary
   6. Document the new skill in Confluence
   
   ## Changelog
   - April 24, 2025: Added AI Agents skill icon ([AI-7](link-to-jira-ticket))
   ```

8. [x] Commit changes
9. [  ] Open pull request

## Progress
- Created task file and planning implementation
- Created branch feat/AI-7-ai-agents-skill
- Updated TechType in techIcon.tsx to include "ai-agents"
- Added "AI Agents" skill entry to the skills array in skills.ts
- Created test file to verify AI Agents skill icon rendering
- Added icon files to public/icons and public/hq_icons directories
- Prepared Confluence documentation content (to be added when access is available)
- Committed all changes to the branch