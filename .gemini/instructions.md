### **Workflow Plan: GoodHive-Web**

This document outlines the development workflow for using AI agents on the GoodHive-Web project.

---

### **Multi-Agent Collaboration**

To ensure seamless collaboration between different AI agents (Gemini, Claude, Cursor, etc.), each agent's configuration will be stored in a dedicated directory.

-   **Gemini:** Configuration is stored in the `.gemini/` directory.
-   **Claude:** Configuration is stored in the `.claude/` directory.
-   **Other Agents:** Should use their own respective directories (e.g., `.cursor/`).

This separation prevents configuration conflicts and allows each agent to maintain its own workflow and permissions.

---

### **Core Commands**

Based on `package.json`, the primary package manager is `pnpm`.

-   **Install Dependencies:** `pnpm install`
-   **Run Dev Server:** `pnpm dev`
-   **Build Project:** `pnpm build`
-   **Run Linter:** `pnpm lint`
-   **Type Checking:** `npx tsc`

---

### **Development Cycle**

1.  **Understand:** Analyze relevant files to understand the context of a request.
2.  **Plan:** Formulate and share a plan before making changes.
3.  **Implement:** Write or modify code.
4.  **Verify:** Run `pnpm lint` and `npx tsc` to ensure code quality and type safety.
5.  **Commit:** Prepare a clear and descriptive commit message for review.

---

### **Git Commit Guidelines**

When committing changes to the repository:

-   **DO NOT mention AI assistance (Gemini, Claude, etc.) in commit messages**
-   Keep commit messages professional and concise
-   Follow conventional commit format: `type: description`
-   Focus on what changed and why, not who made the change

**Example Good Commit Messages:**

✅ `feat: add dynamic loading text to spinner component`
✅ `refactor: simplify user profile layout`
✅ `fix: resolve authentication redirect issue`

**Example Bad Commit Messages:**

❌ `feat: add feature with AI help`
❌ `update: changes made by assistant`
❌ `🤖 Generated with AI`
