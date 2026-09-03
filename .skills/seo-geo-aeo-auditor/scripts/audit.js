#!/usr/bin/env node
/**
 * SEO, GEO, AEO & Mobile Viewport Automated Auditor
 * Zero-dependency Node.js CLI script for auditing HTML pages and live URLs.
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
      client.get(target, { headers: { 'User-Agent': 'CodeScaffold-SEOAuditor/3.0' } }, (res) => {
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

  // 1. Mobile Viewport & Touch
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']viewport["']/i);
  if (!viewportMatch) {
    issues.push({ category: 'Mobile & Viewport', priority: 'High', message: 'Missing `<meta name="viewport">` tag. Viewport will not scale properly on mobile devices.' });
    seoScore -= 25;
  } else {
    const vpContent = viewportMatch[1];
    if (!vpContent.includes('width=device-width')) {
      issues.push({ category: 'Mobile & Viewport', priority: 'High', message: 'Viewport meta tag missing `width=device-width`.' });
      seoScore -= 10;
    } else {
      passes.push('Mobile viewport declared with `width=device-width`');
    }
    if (vpContent.includes('user-scalable=no') || vpContent.includes('maximum-scale=1.0')) {
      issues.push({ category: 'Mobile & Viewport', priority: 'Medium', message: 'Viewport disables user scaling (accessibility issue on mobile devices).' });
      seoScore -= 5;
    }
  }

  // 2. Title Tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push({ category: 'Traditional SEO', priority: 'High', message: 'Missing or empty `<title>` tag.' });
    seoScore -= 20;
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 30 || title.length > 65) {
      issues.push({ category: 'Traditional SEO', priority: 'Medium', message: `Title length (${title.length} chars) is outside optimal range (50-60 chars): "${title}"` });
      seoScore -= 5;
    } else {
      passes.push(`Title tag optimal length (${title.length} chars): "${title}"`);
    }
  }

  // 3. Meta Description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    issues.push({ category: 'Traditional SEO', priority: 'High', message: 'Missing or empty `<meta name="description">` tag.' });
    seoScore -= 15;
  } else {
    const desc = descMatch[1].trim();
    if (desc.length < 70 || desc.length > 165) {
      issues.push({ category: 'Traditional SEO', priority: 'Medium', message: `Meta description length (${desc.length} chars) is outside optimal range (120-160 chars).` });
      seoScore -= 5;
    } else {
      passes.push(`Meta description optimal length (${desc.length} chars)`);
    }
  }

  // 4. Canonical URL
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ||
                         html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
  if (!canonicalMatch) {
    issues.push({ category: 'Traditional SEO', priority: 'Medium', message: 'Missing `<link rel="canonical">` tag to prevent duplicate content indexing.' });
    seoScore -= 10;
  } else {
    passes.push(`Canonical URL declared: "${canonicalMatch[1]}"`);
  }

  // 5. OpenGraph & Twitter Cards
  const ogTitle = html.match(/<meta\s+property=["']og:title["']/i);
  const ogDesc = html.match(/<meta\s+property=["']og:description["']/i);
  const ogImage = html.match(/<meta\s+property=["']og:image["']/i);
  const twitterCard = html.match(/<meta\s+name=["']twitter:card["']/i);

  if (!ogTitle || !ogDesc || !ogImage) {
    issues.push({ category: 'Social & Discovery', priority: 'Medium', message: 'Incomplete OpenGraph tags (ensure og:title, og:description, and og:image exist).' });
    seoScore -= 10;
  } else {
    passes.push('Complete OpenGraph social metadata present');
  }

  if (!twitterCard) {
    issues.push({ category: 'Social & Discovery', priority: 'Low', message: 'Missing `twitter:card` meta tag.' });
    seoScore -= 5;
  } else {
    passes.push('Twitter card metadata present');
  }

  // 6. Heading Hierarchy
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({ category: 'Heading Hierarchy', priority: 'High', message: 'No `<h1>` tag found on the page.' });
    seoScore -= 15;
    geoScore -= 15;
  } else if (h1Matches.length > 1) {
    issues.push({ category: 'Heading Hierarchy', priority: 'Medium', message: `Multiple (${h1Matches.length}) \`<h1>\` tags found. Standard SEO requires exactly one primary \`<h1>\`.` });
    seoScore -= 5;
  } else {
    passes.push('Single H1 heading found');
  }

  // 7. Structured JSON-LD Data
  const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemasFound = [];
  if (jsonLdMatches.length === 0) {
    issues.push({ category: 'Structured Data', priority: 'High', message: 'Missing JSON-LD structured data (`<script type="application/ld+json">`). Essential for rich snippets and GEO entity resolution.' });
    seoScore -= 15;
    geoScore -= 20;
    aeoScore -= 25;
  } else {
    for (const block of jsonLdMatches) {
      const content = block.replace(/<\/?script[^>]*>/gi, '').trim();
      try {
        const parsed = JSON.parse(content);
        const schemaType = parsed['@type'] || (Array.isArray(parsed) ? parsed.map(p => p['@type']).join(', ') : 'Unknown');
        schemasFound.push(schemaType);
      } catch (e) {
        issues.push({ category: 'Structured Data', priority: 'High', message: `Invalid JSON-LD schema syntax: ${e.message}` });
        seoScore -= 10;
      }
    }
    if (schemasFound.length > 0) {
      passes.push(`JSON-LD schema types detected: ${schemasFound.join(', ')}`);
    }
  }

  // 8. GEO & AEO Analysis (Direct Answers & Question Headings)
  const questionHeadings = html.match(/<h[2-4][^>]*>[^<]*\?[^<]*<\/h[2-4]>/gi) || [];
  if (questionHeadings.length === 0) {
    issues.push({ category: 'AEO / Voice Search', priority: 'Medium', message: 'No question-phrased headings found. Formulating subheadings as questions (e.g. "What is X?", "How does Y work?") boosts AEO snippet eligibility.' });
    aeoScore -= 20;
  } else {
    passes.push(`Found ${questionHeadings.length} question-phrased headings for AEO snippets`);
  }

  // Ensure scores remain between 0 and 100
  seoScore = Math.max(0, Math.min(100, seoScore));
  geoScore = Math.max(0, Math.min(100, geoScore));
  aeoScore = Math.max(0, Math.min(100, aeoScore));

  return {
    source,
    scores: {
      seo: seoScore,
      geo: geoScore,
      aeo: aeoScore,
      composite: Math.round((seoScore + geoScore + aeoScore) / 3)
    },
    passes,
    issues,
    schemasFound
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

    console.log('='.repeat(60));
    console.log(`  SEO, GEO, AEO & Mobile Viewport Audit: ${target}`);
    console.log('='.repeat(60));
    console.log(`* Composite Score: ${result.scores.composite} / 100`);
    console.log(`  * Traditional SEO Score: ${result.scores.seo} / 100`);
    console.log(`  * Generative Engine (GEO) Score: ${result.scores.geo} / 100`);
    console.log(`  * Answer Engine (AEO) Score: ${result.scores.aeo} / 100\n`);

    if (result.passes.length > 0) {
      console.log('PASSING CHECKS:');
      for (const p of result.passes) {
        console.log(`  [PASS] ${p}`);
      }
      console.log('');
    }

    if (result.issues.length > 0) {
      console.log('ACTIONABLE ISSUES & REMEDIATIONS:');
      for (const issue of result.issues) {
        console.log(`  [${issue.priority.toUpperCase()}] [${issue.category}] ${issue.message}`);
      }
      console.log('');
    } else {
      console.log('[ALL CHECKS PASSED] Fully optimized for Mobile, Traditional SEO, GEO, and AEO!\n');
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
