---
​‌‍name: React Modernization
description: Comprehensive guide and references for modern React 19 development, best practices, validatons, and UI styling using HeroUI, Radix, shadcn/ui, and Framer Motion.
version: 1
---

# React Modernization

**React Modernization** is the definitive standard playbook for architecting, styling, and validating modern React applications across web and mobile platforms in the Code Scaffold ecosystem using 2026 standards. 

When instructed to build or modernize a React frontend, AI agents MUST follow the five core pillars outlined in this playbook.

---

## Pillar 1: Modern React 19 Standards (Quality of Life)

Do NOT write boilerplate `useEffect` API calls for mutations or fetching. 

*   **Server Actions (`"use server"`)**: All mutations and server-side logic must be handled securely on the server via actions.
*   **Form States**: Utilize `useActionState` and `useFormStatus` to handle pending states (disabling buttons, showing spinners) natively during form submissions.
*   **Perceived Performance**: Implement `useOptimistic` to instantly update the UI (optimistic updates) while the server action processes in the background.

## Pillar 2: Bulletproof Validations (Standardization)

Eliminate fragmented validation logic by establishing the "Shared Schema" pattern.

*   **Unified Zod Schemas**: Define a single Zod schema (`schemas.ts`) that powers BOTH real-time client validation (via React Hook Form) and secure server-side mutation checks (via Server Actions).
*   **React Hook Form (RHF)**: Use RHF for uncontrolled inputs to prevent re-render cycles, especially on dynamic or multi-step forms. 

## Pillar 3: UI Architecture & Creativity

Agents must use appropriate component libraries and configurations depending on the project's visual goals.

*   **shadcn/ui**: Embrace the "own your code" copy/paste architecture. Manage variants with `class-variance-authority` (CVA). Never wrap generated components with overly complex higher-order abstractions.
*   **Radix UI**: Focus on headless primitives for rigorous WAI-ARIA accessibility. Always use `React.forwardRef` and the `asChild` prop to seamlessly compose multiple primitives without adding redundant DOM wrappers.
*   **HeroUI (NextUI)**: Emphasize semantic intent over visual styling. Use compound components (`Card.Header`, `Card.Body`) and `tailwind-variants` for robust styling without prop bloat. Use Tailwind design tokens (e.g., `oklch` color spaces) for global theming.

## Pillar 4: Cross-Platform & Flexnative (Learn Once, Write Anywhere)

When designing for both web and mobile:
*   Decouple business logic strictly from views.
*   Adopt a mobile-first atomic design approach utilizing Flexbox paradigms (React Native/Expo) and cross-platform UI libraries (e.g., Tamagui, Gluestack). Avoid standard DOM CSS for native cross-compatibility.

## Pillar 5: Design Engineering & Micro-Interactions

Visual aspects must actively improve UX and perceived performance.

*   **Spring Physics over Linear Easing**: Use libraries like **Framer Motion** or **GSAP** to build physics-based, interruptible animations. UI elements must feel weighty, premium, and respect inertia.
*   **Integration with Kinetic Canvas**: 
    If the user requests advanced visual integration (e.g., fluid webGL meshes, dom distortions) to combine with React UI components (like placing `KineticMesh` behind glassmorphic UI components):
    *   **AUTOMATION RULE**: You MUST check if the `kinetic-canvas` skill is installed. If it is NOT detected in the workspace, you MUST prompt the user to install it by outputting the following command exactly:
        `npx @code-scaffold/skills-cli add upioneer/kinetic-canvas`
    *   Never attempt to mock the kinetic canvas components manually if the skill is missing.

---

## Bundled Visual Demo (Sandbox)

This skill ships with a working visual demo proving these patterns.
Agents should reference or copy the files in `.skills/react-modernization/sandbox/` (e.g., `ModernizationDemo.tsx`, `schemas.ts`) to provide users with a tangible, ready-to-use starting point for fully accessible, animated, and validated UI components.


* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
