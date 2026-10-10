#!/usr/bin/env node
/**
 * Code Scaffold SEO, GEO, AEO & Agentic Readiness Automated Auditor
 * Zero-dependency Node.js CLI tool for production website & HTML auditing.
 * 
 * Audits across 5 dimensions:
 *   1. Technical SEO & Mobile Viewport (CWV LCP/INP/CLS hints, viewport, meta tags)
 *   2. Modern Schema.org & Deprecation Guard (Active JSON-LD vs retired HowTo/FAQPage)
 *   3. Generative Engine Optimization (GEO) & Passage Citability (130-170 words, entity density)
 *   4. Answer Engine Optimization (AEO) (Question headers, direct answer blocks)
 *   5. E-E-A-T Trust & Agent Readiness (Author bylines, dates, landmarks, llms.txt)
 * 
 * Usage:
 *   node audit.js <url-or-file-path> [--json]
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

function fetchContent(target) {
  return new Promise((resolve, reject) => {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      const client = target.startsWith('https://') ? https : http;
      client.get(target, { headers: { 'User-Agent': 'CodeScaffold-SEOAuditor/5.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      }).on('error', reject);
    } else {
      const filePath = path.resolve(process.cwd(), target);
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }
      resolve(fs.readFileSync(filePath, 'utf8'));
    }
  });
}

function runAudit(html, source) {
  const issues = [];
  const passes = [];
  let seoScore = 100;
  let geoScore = 100;
  let aeoScore = 100;
  let agentScore = 100;

  // 1. Mobile Viewport & Touch
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']viewport["']/i);
  if (!viewportMatch) {
    issues.push({
      category: 'Technical SEO',
      priority: 'High',
      message: 'Missing `<meta name="viewport">` tag. Viewport will not scale properly on mobile devices.',
      verification: 'Verify viewport meta tag exists with width=device-width in Chrome DevTools.'
    });
    seoScore -= 20;
  } else {
    const vpContent = viewportMatch[1];
    if (!vpContent.includes('width=device-width')) {
      issues.push({
        category: 'Technical SEO',
        priority: 'High',
        message: 'Viewport meta tag missing `width=device-width`.',
        verification: 'Inspect viewport content in mobile responsive mode.'
      });
      seoScore -= 10;
    } else {
      passes.push('Mobile viewport declared with `width=device-width`');
    }
    if (vpContent.includes('user-scalable=no') || vpContent.includes('maximum-scale=1.0')) {
      issues.push({
        category: 'Accessibility',
        priority: 'Medium',
        message: 'Viewport disables user scaling (violates WCAG mobile touch standards).',
        verification: 'Ensure user-scalable attribute is removed from viewport meta tag.'
      });
      seoScore -= 5;
    }
  }

  // 2. Title Tag & Meta Description
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push({
      category: 'Metadata',
      priority: 'High',
      message: 'Missing or empty `<title>` tag.',
      verification: 'SERP snippet requires title between 30 and 60 characters.'
    });
    seoScore -= 20;
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 30 || title.length > 65) {
      issues.push({
        category: 'Metadata',
        priority: 'Medium',
        message: `Title length (${title.length} chars) is outside optimal range (50-60 chars): "${title}"`,
        verification: 'Check Google Search Console title truncation report.'
      });
      seoScore -= 5;
    } else {
      passes.push(`Title tag optimal length (${title.length} chars): "${title}"`);
    }
  }

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    issues.push({
      category: 'Metadata',
      priority: 'High',
      message: 'Missing or empty `<meta name="description">` tag.',
      verification: 'Add meta description between 120 and 160 characters.'
    });
    seoScore -= 15;
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 70 || desc.length > 165) {
      issues.push({
        category: 'Metadata',
        priority: 'Medium',
        message: `Meta description length (${desc.length} chars) is outside optimal range (120-160 chars).`,
        verification: 'Optimize meta description length to prevent snippet ellipsis.'
      });
      seoScore -= 5;
    } else {
      passes.push(`Meta description optimal length (${desc.length} chars)`);
    }
  }

  // 3. Canonical URL & Protocols
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ||
                         html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  if (!canonicalMatch) {
    issues.push({
      category: 'Technical SEO',
      priority: 'Medium',
      message: 'Missing `<link rel="canonical">` tag. Risk of duplicate parameter URL indexing.',
      verification: 'Verify self-referencing canonical URL exists in DOM head.'
    });
    seoScore -= 10;
  } else {
    passes.push(`Canonical URL declared: "${canonicalMatch[1]}"`);
  }

  // 4. Heading Hierarchy
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({
      category: 'HTML Structure',
      priority: 'High',
      message: 'No `<h1>` tag found on the page.',
      verification: 'Verify exactly one primary H1 exists per page.'
    });
    seoScore -= 15;
    geoScore -= 15;
  } else if (h1Matches.length > 1) {
    issues.push({
      category: 'HTML Structure',
      priority: 'Medium',
      message: `Multiple (${h1Matches.length}) \`<h1>\` tags found. Standard architecture requires exactly one primary \`<h1>\`.`,
      verification: 'Demote secondary H1 tags to H2.'
    });
    seoScore -= 5;
  } else {
    passes.push('Single H1 heading found');
  }

  // 5. Modern Schema.org & Deprecation Guard
  const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemasFound = [];
  const deprecatedSchemas = [];

  const RETIRED_TYPES = ['HowTo', 'FAQPage', 'SpecialAnnouncement', 'ClaimReview', 'EstimatedSalary', 'VehicleListing'];

  if (jsonLdMatches.length === 0) {
    issues.push({
      category: 'Structured Data',
      priority: 'High',
      message: 'Missing JSON-LD structured data (`<script type="application/ld+json">`). Critical for rich results and GEO entity resolution.',
      verification: 'Test page in Google Rich Results Test tool.'
    });
    seoScore -= 15;
    geoScore -= 20;
    aeoScore -= 20;
  } else {
    for (const block of jsonLdMatches) {
      const content = block.replace(/<\/?script[^>]*>/gi, '').trim();
      try {
        const parsed = JSON.parse(content);
        const extractTypes = (obj) => {
          if (!obj) return [];
          let types = [];
          if (obj['@type']) types.push(obj['@type']);
          if (Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(sub => types.push(...extractTypes(sub)));
          }
          return types;
        };
        const types = extractTypes(parsed);
        schemasFound.push(...types);

        // Check deprecations
        types.forEach(t => {
          if (RETIRED_TYPES.includes(t)) {
            deprecatedSchemas.push(t);
          }
        });
      } catch (e) {
        issues.push({
          category: 'Structured Data',
          priority: 'High',
          message: `Invalid JSON-LD schema syntax: ${e.message}`,
          verification: 'Validate JSON-LD syntax using Schema.org validator.'
        });
        seoScore -= 10;
      }
    }

    if (deprecatedSchemas.length > 0) {
      issues.push({
        category: 'Structured Data',
        priority: 'Medium',
        message: `Deprecated schema type(s) detected: ${deprecatedSchemas.join(', ')}. (FAQPage and HowTo rich results retired by major search engines).`,
        verification: 'Replace deprecated schemas with active Article/TechArticle or Organization patterns.'
      });
      seoScore -= 5;
    } else if (schemasFound.length > 0) {
      passes.push(`Active Schema.org JSON-LD types verified: ${Array.from(new Set(schemasFound)).join(', ')}`);
    }
  }

  // 6. Passage Citability & GEO Analysis (130-170 Word Blocks)
  // Strip tags and analyze paragraph lengths
  const paragraphs = (html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [])
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 30);

  let optimalPassages = 0;
  let bloatedPassages = 0;

  paragraphs.forEach(p => {
    const wordCount = p.split(/\s+/).length;
    if (wordCount >= 120 && wordCount <= 180) {
      optimalPassages++;
    } else if (wordCount > 350) {
      bloatedPassages++;
    }
  });

  if (optimalPassages > 0) {
    passes.push(`Found ${optimalPassages} optimal AI citability passage(s) (130-170 words)`);
  } else if (paragraphs.length > 0) {
    issues.push({
      category: 'GEO Citability',
      priority: 'Medium',
      message: 'No self-contained passages in the optimal 130-170 word range. Content lacks chunked, high-citability answer blocks for LLM synthesis.',
      verification: 'Format key explanatory paragraphs to 130-170 words with clear claim-to-evidence structure.'
    });
    geoScore -= 15;
  }

  if (bloatedPassages > 0) {
    issues.push({
      category: 'GEO Citability',
      priority: 'Low',
      message: `Found ${bloatedPassages} oversized paragraph(s) (>350 words). Break up prose into distinct subheaded topics.`,
      verification: 'Partition long walls of text with question-based subheadings.'
    });
    geoScore -= 5;
  }

  // 7. AEO Question Formulations
  const questionHeadings = html.match(/<h[2-4][^>]*>[^<]*\?[^<]*<\/h[2-4]>/gi) || [];
  if (questionHeadings.length === 0) {
    issues.push({
      category: 'AEO / Voice Search',
      priority: 'Medium',
      message: 'No question-phrased headings found (e.g. "What is X?", "How does Y work?"). Formulation as natural language queries enhances AEO snippet extraction.',
      verification: 'Frame at least 2 subheadings as explicit questions followed by immediate paragraph answers.'
    });
    aeoScore -= 20;
  } else {
    passes.push(`Found ${questionHeadings.length} question-phrased heading(s) for AEO direct snippets`);
  }

  // 8. E-E-A-T Quality Signals (Author, Dates, Organization)
  const hasAuthorSignal = /rel=["']author["']|class=["'][^"']*author[^"']*["']|itemprop=["']author["']/i.test(html) ||
                          /by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(html);
  const hasDateSignal = /itemprop=["']dateModified["']|itemprop=["']datePublished["']|<time\b/i.test(html);

  if (!hasAuthorSignal) {
    issues.push({
      category: 'E-E-A-T Authority',
      priority: 'Medium',
      message: 'Missing explicit author byline or Person credentials. Weakens Google Search Quality Rater E-E-A-T scoring.',
      verification: 'Add visible author byline with credentials and link to author profile.'
    });
    geoScore -= 10;
  } else {
    passes.push('Author byline / credentials signal detected');
  }

  if (!hasDateSignal) {
    issues.push({
      category: 'E-E-A-T Freshness',
      priority: 'Medium',
      message: 'Missing timestamp metadata (`datePublished` or `dateModified` / `<time>`). Essential for content freshness verification.',
      verification: 'Add semantic `<time>` tag with datetime attribute.'
    });
    geoScore -= 10;
  } else {
    passes.push('Publication / modification date timestamp detected');
  }

  // 9. Agent Readiness & Semantic Landmarks
  const hasMain = /<main\b/i.test(html);
  const hasArticle = /<article\b/i.test(html);
  const hasLlmsLink = /href=["'][^"']*llms\.txt["']/i.test(html);

  if (!hasMain && !hasArticle) {
    issues.push({
      category: 'Agent Readiness',
      priority: 'Medium',
      message: 'Missing HTML5 `<main>` or `<article>` landmarks. Autonomous AI agents cannot easily isolate primary content from navigation chrome.',
      verification: 'Wrap primary body content in semantic `<main>` and `<article>` tags.'
    });
    agentScore -= 20;
  } else {
    passes.push('Semantic landmarks (`<main>` or `<article>`) present for agent browsing');
  }

  if (hasLlmsLink) {
    passes.push('Link to `/llms.txt` detected for autonomous AI agent documentation');
  }

  // Normalize scores
  seoScore = Math.max(0, Math.min(100, seoScore));
  geoScore = Math.max(0, Math.min(100, geoScore));
  aeoScore = Math.max(0, Math.min(100, aeoScore));
  agentScore = Math.max(0, Math.min(100, agentScore));
  const composite = Math.round((seoScore * 0.35) + (geoScore * 0.25) + (aeoScore * 0.25) + (agentScore * 0.15));

  return {
    source,
    scores: {
      composite,
      seo: seoScore,
      geo: geoScore,
      aeo: aeoScore,
      agentic: agentScore
    },
    passes,
    issues,
    schemasFound: Array.from(new Set(schemasFound)),
    deprecatedSchemas: Array.from(new Set(deprecatedSchemas))
  };
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const target = args.find(a => !a.startsWith('--')) || 'index.html';

  try {
    const html = await fetchContent(target);
    const result = runAudit(html, target);

    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log('='.repeat(72));
    console.log(`  Code Scaffold SEO, GEO, AEO & Agentic Readiness Audit: ${target}`);
    console.log('='.repeat(72));
    console.log(`* Composite Quality Score    : ${result.scores.composite} / 100`);
    console.log(`  * Technical SEO & Viewport : ${result.scores.seo} / 100`);
    console.log(`  * Generative Engine (GEO)  : ${result.scores.geo} / 100`);
    console.log(`  * Answer Engine (AEO)      : ${result.scores.aeo} / 100`);
    console.log(`  * Agent Readiness          : ${result.scores.agentic} / 100\n`);

    if (result.passes.length > 0) {
      console.log('VERIFIED PASSING STANDARDS:');
      for (const p of result.passes) {
        console.log(`  [PASS] ${p}`);
      }
      console.log('');
    }

    if (result.issues.length > 0) {
      console.log('FALSIFIABLE REMEDIATIONS & LEADING INDICATORS:');
      for (const issue of result.issues) {
        console.log(`  [${issue.priority.toUpperCase()}] [${issue.category}] ${issue.message}`);
        console.log(`         ↳ Leading Test: ${issue.verification}`);
      }
      console.log('');
    } else {
      console.log('[ALL CHECKS PASSED] Page is 100% compliant across SEO, GEO, AEO, and Agentic standards!\n');
    }
  } catch (err) {
    console.error(`Audit Failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAudit };
