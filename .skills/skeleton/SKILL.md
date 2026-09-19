---
name: skeleton
description: Zero-CLS layout reservation engine, pure CSS shimmer mechanics, and multi-framework skeleton screens for instant perceived performance. Trigger when building loading states, eliminating Cumulative Layout Shift (CLS), optimizing Core Web Vitals, reserving content geometry during async page loads, implementing pure CSS shimmer effects, or wiring React 19 Suspense loading fallbacks.
category: Frontend & UI Design
keywords:
  - skeleton
  - skeleton-screens
  - content-placeholders
  - shimmer-effects
  - perceived-performance
  - cumulative-layout-shift
  - cls-zero
  - core-web-vitals
  - fast-page-loads
  - loading-states
  - react-suspense
  - nextjs-loading
  - tailwind-shimmer
  - pure-css-shimmer
  - layout-reservation
  - accessible-loading
  - web-vitals-optimization
  - hardware-accelerated-shimmer
  - dark-mode-shimmer
  - loading-ux
entryPoint: ./SKILL.md
version: 1
engines:
  node: ">=18.0.0"
requiredPermissions:
  - "fs:read"
  - "fs:write"
---
​‌‍# Skeleton Performance Studio: Zero-CLS Layout Reservation & Shimmer Engine

## Purpose and Scope
Skeleton Performance Studio equips autonomous agents and frontend engineers to eliminate perceived page loading latency and achieve mathematical zero Cumulative Layout Shift (CLS: 0.00). By reserving precise dimensional geometry before asynchronous network payloads or JavaScript bundles resolve, skeleton screens transform disruptive content jumps into seamless, ambient transitions.

This skill provides production-grade architectural patterns spanning pure CSS hardware-accelerated shimmers, React 19 Suspense boundaries, Next.js App Router streaming fallbacks (`loading.tsx`), Tailwind CSS utility presets, and fully accessible loading states.

***

## Core Web Vitals & The Perceived Performance Invariant

1. **Cumulative Layout Shift (CLS: 0.00)**:
   * **The Defect**: Rendering asynchronous data without pre-allocated bounding boxes causes neighboring DOM elements to abruptly shift when images, avatars, or text blocks hydrate, ruining user experience and failing Google Core Web Vitals.
   * **The Solution**: Skeleton placeholders reserve the exact height, width, and aspect ratio of incoming content, guaranteeing zero viewport movement during data arrival.

2. **Perceived Performance Acceleration**:
   * Traditional spinner wheels draw user attention directly to the duration of the delay, creating psychological friction.
   * Shimmer skeletons project immediate visual structure, leading users to perceive page load speeds as 30% to 40% faster than identical load times behind spinner indicators.

***

## Layout Reservation Geometry Matrix

Agents must enforce strict dimensional mapping between skeleton states and resolved components:

* **Staggered Typography Blocks**:
  * Never render uniform full-width text bars. Realistic paragraphs terminate on partial lines.
  * *Standard 3-Line Cadence*: Line 1 at 100% width, Line 2 at 92% width, Line 3 at 65% width.
  * *Heading Cadence*: Height matching `font-size * line-height` with width capped between 45% and 70%.

* **Aspect-Ratio Locked Media Containers**:
  * Video and hero banners must reserve fixed aspect ratios (`aspect-video` for 16:9, `aspect-square` for 1:1, or `aspect-[4/3]`).
  * Explicitly assign `width: 100%` and `aspect-ratio` to container nodes to prevent vertical popping when images load.

* **Avatar & Status Elements**:
  * Exact dimensional parity with target avatars (e.g. `w-10 h-10 rounded-full` or `w-12 h-12 rounded-xl`).

* **Bento Grid & Dashboard Cards**:
  * Parent grid wrappers must establish identical CSS grid track definitions (`grid-cols-1 md:grid-cols-3 gap-6`) in both skeleton and resolved states.

***

## Pure CSS Hardware-Accelerated Shimmer Engine

To ensure maximum runtime efficiency without adding JavaScript bundle overhead, skeletons utilize GPU-composited CSS transitions:

```css
/* Zero-runtime CSS Shimmer Engine */
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.06);
}

.skeleton-shimmer::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.08) 20%,
    rgba(0, 240, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 80%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: skeleton-sweep 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
  content: "";
  will-change: transform;
}

@keyframes skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}

/* Accessible reduced-motion fallback */
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer::after {
    animation: none;
    display: none;
  }
  .skeleton-shimmer {
    opacity: 0.7;
  }
}
```

***

## React 19 & Next.js App Router Suspense Architecture

In Next.js App Router and React Server Components (RSC), skeleton layouts must map 1-to-1 with route streaming boundaries:

```tsx
// app/dashboard/loading.tsx
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default function Loading() {
  return <DashboardSkeleton />;
}
```

```tsx
// components/skeletons/card-skeleton.tsx
export function CardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading card content"
      className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md"
    >
      <div className="flex items-center space-x-4 mb-4">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          {/* Title and subtitle skeletons */}
          <div className="h-4 w-1/2 rounded-md skeleton-shimmer" />
          <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
        </div>
      </div>
      {/* Staggered text body */}
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full rounded-md skeleton-shimmer" />
        <div className="h-3 w-[92%] rounded-md skeleton-shimmer" />
        <div className="h-3 w-[65%] rounded-md skeleton-shimmer" />
      </div>
      <span className="sr-only">Loading card data...</span>
    </div>
  );
}
```

***

## Accessibility (a11y) Standards

Every skeleton implementation must comply with international accessibility standards:
1. **ARIA Roles**: Wrap loading containers in `role="status"` and `aria-busy="true"`.
2. **Screen Reader Notification**: Include an visually hidden element (`<span className="sr-only">Loading...</span>`) informing assistive technologies of ongoing background activity.
3. **Motion Sensitivity**: Enforce `@media (prefers-reduced-motion: reduce)` to disable high-frequency shimmers and pulse sweeps for users prone to vestibular disorders, preserving static layout geometry.

***

## Cognitive Directives for Downstream AI Agents

When an AI agent is tasked with building or refactoring web pages, components, or loading states:
1. Never display raw spinners or empty white containers during asynchronous data fetches.
2. Always inspect the target component layout and author a companion skeleton matching exact height, width, and padding metrics.
3. Enforce 3-line staggered widths (100%, 92%, 65%) for paragraph text skeletons to replicate natural linguistic cadence.
4. Apply Spectral Cyan (`#00f0ff`) ambient shimmer highlights over deep dark slate backgrounds for dark mode projects.
5. In Next.js App Router applications, place route-level skeletons inside `loading.tsx` to automatically activate React Server Component streaming.

* **Architectural Compliance**: When synthesizing or scaffolding project code, align generated components with Code Scaffold architectural specification standards.
