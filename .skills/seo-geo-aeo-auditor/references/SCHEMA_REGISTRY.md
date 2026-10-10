# Code Scaffold Structured Schema Registry and Deprecation Index

This document provides the definitive architectural reference for Schema.org JSON-LD structured data implementations across traditional search crawlers and AI search synthesizers.

---

## 1. Active High-Value Schema Types

Search crawlers and generative engines reward rich, unambiguous structured data. Always implement schema as inline JSON-LD (`<script type="application/ld+json">`) within the document head or body.

### Active Types Matrix

* **Organization & WebSite:**
  * Defines core entity identity, brand names, official logo, contact endpoints, and social knowledge graphs.
  * Essential for knowledge panels and brand entity disambiguation in AI models.
* **Article & TechArticle:**
  * Requires `headline`, `author` (Person or Organization), `datePublished`, `dateModified`, `publisher`, and `image`.
  * The `dateModified` property is heavily weighted for freshness and algorithmic trust.
* **Product & SoftwareApplication:**
  * Covers commercial offerings, pricing models, feature sets, operating systems, and user review aggregations (`AggregateRating`).
* **LocalBusiness:**
  * Maps physical store locations, street addresses, opening hours, geographic coordinates, and phone numbers.
* **QAPage:**
  * Used for community question and answer pages where a question is followed by accepted or community answers.
* **Course & JobPosting:**
  * Active rich results for educational curricula and employment opportunities.

---

## 2. Deprecated and Retired Schema Types

Modern search engines have deprecated several legacy rich result formats. Retaining retired schemas adds DOM weight without conferring rich snippet advantages.

* **FAQPage (Retired for General Sites in May 2026):**
  * Major search engines permanently removed FAQ rich snippet display for commercial and publisher websites.
  * Retain only if needed for internal semantic graphs, but do not rely on it for SERP expansion.
* **HowTo (Retired in September 2023):**
  * HowTo rich results were deprecated worldwide across desktop and mobile SERPs.
  * Consolidate step-by-step instructional content into semantic HTML `<ol>` lists within standard `Article` or `TechArticle` schemas.
* **SpecialAnnouncement (Retired in July 2025):**
  * Emergency COVID-era announcement badges retired from active search displays.
* **ClaimReview & EstimatedSalary (Retired in June 2025):**
  * Automated salary estimates and third-party fact-check snippets discontinued from general SERP display.

---

## 3. Production JSON-LD Implementation Patterns

### Multi-Entity Knowledge Graph Pattern
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Code Scaffold Technologies",
      "url": "https://example.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/assets/logo.png"
      },
      "sameAs": [
        "https://github.com/upioneer/code-scaffold",
        "https://twitter.com/codescaffold"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "url": "https://example.com",
      "name": "Code Scaffold",
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    },
    {
      "@type": "TechArticle",
      "@id": "https://example.com/blog/seo-guide#article",
      "isPartOf": {
        "@id": "https://example.com/#website"
      },
      "headline": "Modern SEO and Generative Engine Optimization Architecture",
      "datePublished": "2026-03-15T08:00:00Z",
      "dateModified": "2026-10-01T12:00:00Z",
      "author": {
        "@type": "Person",
        "name": "Senior Architect",
        "jobTitle": "Lead Systems Engineer"
      },
      "publisher": {
        "@id": "https://example.com/#organization"
      }
    }
  ]
}
</script>
```
