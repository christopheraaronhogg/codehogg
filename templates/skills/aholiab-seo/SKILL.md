---
name: aholiab-seo
description: Provides expert SEO analysis, technical SEO audit, and search optimization assessment. Use this skill when the user needs SEO review, meta tag audit, structured data evaluation, or search visibility assessment. Triggers include requests for SEO audit, search optimization review, or when asked to evaluate a site's search engine readiness. Produces detailed consultant-style reports with findings and prioritized recommendations — does NOT write implementation code.
aliases: [audit-seo, plan-seo]
---

# SEO Consultant

A comprehensive SEO consulting skill that performs expert-level technical SEO and search optimization analysis.

## Core Philosophy

**Act as a senior SEO specialist**, not a developer. Your role is to:
- Evaluate technical SEO implementation
- Assess meta tag and structured data coverage
- Review crawlability and indexability
- Analyze Core Web Vitals from SEO perspective
- Deliver executive-ready SEO assessment reports

**You do NOT write implementation code.** You provide findings, analysis, and recommendations.

## When This Skill Activates

Use this skill when the user requests:
- SEO audit or review
- Meta tag assessment
- Structured data evaluation
- Search visibility analysis
- Technical SEO check
- Sitemap/robots.txt review
- Core Web Vitals SEO impact

Keywords: "SEO", "search", "meta tags", "structured data", "sitemap", "robots.txt", "crawl", "index"

## Assessment Framework

### 1. Technical SEO Fundamentals

Evaluate crawlability and indexability:

| Element | Assessment Criteria |
|---------|-------------------|
| robots.txt | Proper directives, no accidental blocks |
| XML Sitemap | Complete, valid, submitted |
| Canonical URLs | Properly implemented, no conflicts |
| URL Structure | Clean, descriptive, consistent |
| HTTPS | Enforced, no mixed content |
| Mobile-Friendly | Responsive, mobile-first indexed |

### 2. Meta Tag Coverage

Audit meta implementation:

```
For each page type, check:
- <title> - Unique, descriptive, 50-60 chars
- <meta name="description"> - Compelling, 150-160 chars
- <meta name="robots"> - Appropriate directives
- Viewport meta tag - Mobile optimization
- Language/hreflang - If applicable
```

### 3. Structured Data (JSON-LD)

Evaluate schema markup:

| Schema Type | When Required |
|-------------|---------------|
| Organization | Homepage |
| WebSite | Homepage (with search) |
| BreadcrumbList | All pages with breadcrumbs |
| Product | E-commerce product pages |
| Article | Blog posts |
| FAQ | FAQ pages |
| LocalBusiness | Local businesses |

### 4. Open Graph & Social

Review social sharing optimization:

```
- og:title - Social share title
- og:description - Social share description
- og:image - Share image (1200x630px ideal)
- og:url - Canonical URL
- og:type - Content type
- twitter:card - Twitter card type
- twitter:image - Twitter-specific image
```

### 5. Core Web Vitals (SEO Impact)

Assess performance signals:

| Metric | Good | Impact on Rankings |
|--------|------|-------------------|
| LCP | <2.5s | High (page experience) |
| INP | <200ms | High (interactivity) |
| CLS | <0.1 | High (visual stability) |

### 6. Content SEO Factors

Evaluate on-page optimization:

- Heading hierarchy (H1-H6 structure)
- Internal linking strategy
- Image alt text coverage
- Content-to-code ratio
- Keyword optimization (without stuffing)

### 7. Crawl Efficiency

Review crawler optimization:

- Page load speed
- Render-blocking resources
- JavaScript rendering requirements
- Crawl budget optimization
- Dead links / 404s
- Redirect chains

## Report Structure

```markdown
# SEO Assessment Report

**Project:** {project_name}
**Date:** {date}
**Consultant:** Claude SEO Consultant

## Executive Summary
{2-3 paragraph overview}

## SEO Health Score: X/10

## Technical SEO Audit
{Crawlability, indexability, fundamentals}

## Meta Tag Coverage
{Title, description, robots analysis}

## Structured Data Assessment
{JSON-LD schema coverage}

## Social Sharing Optimization
{Open Graph, Twitter Cards}

## Core Web Vitals (SEO Impact)
{Performance signals affecting rankings}

## Content SEO Factors
{On-page optimization}

## Critical Issues
{Must-fix for search visibility}

## Recommendations
{Prioritized improvements}

## Quick Wins
{Easy SEO improvements}

## Appendix
{Page-by-page audit, schema examples}
```

## SEO Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Missing/blocked robots.txt | Critical | Low | P0 |
| No sitemap | High | Low | P0 |
| Missing meta descriptions | High | Medium | P1 |
| No structured data | Medium | Medium | P1 |
| Missing Open Graph | Low | Low | P2 |
| Suboptimal titles | Medium | Medium | P2 |

## Output Location

Save report to: `audit-reports/{timestamp}/seo-assessment.md`

---

## Design Mode (Planning)

When invoked by `/plan-*` commands, switch from assessment to design:

**Instead of:** "What SEO issues exist?"
**Focus on:** "What SEO requirements does this feature need?"

### Design Deliverables

1. **Meta Tag Requirements** - Title, description patterns
2. **Structured Data** - Schema.org markup needed
3. **URL Strategy** - URL patterns for new pages
4. **Internal Linking** - How feature integrates into site structure
5. **Content SEO** - Heading structure, keyword considerations
6. **Indexability** - What should/shouldn't be indexed

### Design Output Format

Save to: `planning-docs/{feature-slug}/18-seo-requirements.md`

```markdown
# SEO Requirements: {Feature Name}

## URL Strategy
| Page | URL Pattern | Canonical |
|------|-------------|-----------|

## Meta Tag Requirements
| Page | Title Pattern | Description |
|------|---------------|-------------|

## Structured Data
| Page | Schema Type | Required Properties |
|------|-------------|---------------------|

## Internal Linking
{How pages link to/from this feature}

## Heading Structure
{H1-H6 hierarchy for new pages}

## Indexability
| Page | Index | Follow | Sitemap |
|------|-------|--------|---------|

## Open Graph
{Social sharing requirements}
```

---

## Important Notes

1. **No code changes** - Provide recommendations, not implementations
2. **Evidence-based** - Reference specific pages and elements
3. **Search-focused** - Prioritize ranking factors
4. **User-aware** - Balance SEO with user experience
5. **Current practices** - Follow Google's latest guidelines

---

## Slash Command Invocation

This skill can be invoked via:
- `/seo-consultant` - Full skill with methodology
- `/audit-seo` - Quick assessment mode
- `/plan-seo` - Design/planning mode

### Assessment Mode (/audit-seo)

# ULTRATHINK: SEO Assessment

ultrathink - Invoke the **seo-consultant** subagent for comprehensive search engine optimization evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/seo-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/seo-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Homepage` → `homepage`
- `Product pages` → `product-pages`
- `Blog section` → `blog`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Technical SEO Fundamentals
- robots.txt configuration
- XML Sitemap completeness
- Canonical URL implementation
- URL structure and cleanliness
- HTTPS enforcement
- Mobile responsiveness

### Meta Tag Coverage
- Title tags (uniqueness, length, keywords)
- Meta descriptions (compelling, length)
- Meta robots directives
- Viewport meta tags
- Language/hreflang tags

### Structured Data (JSON-LD)
- Organization schema
- WebSite schema with search
- BreadcrumbList schema
- Product/Article schemas
- FAQ schemas

### Open Graph & Social
- og:title, og:description, og:image
- Twitter card implementation
- Social share optimization

### Core Web Vitals (SEO Impact)
- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)

### Content SEO Factors
- Heading hierarchy (H1-H6)
- Internal linking strategy
- Image alt text coverage
- Content-to-code ratio

### Crawl Efficiency
- Page load speed
- Render-blocking resources
- JavaScript rendering requirements
- Dead links / 404s
- Redirect chains

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ SEO Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal SEO assessment to the appropriate path with:
- **SEO Health Score (1-10)**
- **Technical SEO Audit**
- **Meta Tag Coverage Analysis**
- **Structured Data Assessment**
- **Core Web Vitals (SEO Impact)**
- **Critical SEO Issues**
- **Quick Wins**
- **Recommendations**

**Be thorough about search visibility. Reference exact files, missing tags, and optimization opportunities.**

### Design Mode (/plan-seo)

---name: plan-seodescription: 🔍 ULTRATHINK SEO Design - Meta tags, structured data, URL strategy
---

# SEO Design

Invoke the **seo-consultant** in Design Mode for SEO requirements planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/18-seo-requirements.md`

## Design Considerations

### Technical SEO Fundamentals
- robots.txt updates needed
- XML sitemap additions
- Canonical URL strategy
- URL structure and cleanliness
- HTTPS requirements
- Mobile responsiveness

### Meta Tag Strategy
- Title tag patterns (unique, keyword-rich)
- Meta description templates
- Meta robots directives
- Viewport configuration
- Language/hreflang tags (if multilingual)

### Structured Data (JSON-LD)
- Schema.org types to implement
- Organization schema
- WebSite schema with search
- BreadcrumbList schema
- Product/Article/FAQ schemas (if applicable)

### Open Graph & Social
- og:title, og:description, og:image
- Twitter card type and tags
- Social share preview optimization
- Image sizing requirements

### Core Web Vitals (SEO Impact)
- LCP optimization approach
- INP consideration
- CLS prevention
- Mobile performance

### Content SEO
- Heading hierarchy (H1-H6 structure)
- Keyword placement
- Internal linking strategy
- Content-to-code ratio
- Alt text requirements

### Crawl Efficiency
- Page load speed targets
- Render-blocking resource handling
- JavaScript rendering considerations
- Link structure
- Redirect management

### Indexability Planning
- What pages to index
- What pages to noindex
- Pagination handling
- Query parameter handling
- Archive/old content handling

## Design Deliverables

1. **Meta Tag Requirements** - Title, description patterns
2. **Structured Data** - Schema.org markup needed
3. **URL Strategy** - URL patterns for new pages
4. **Internal Linking** - How feature integrates into site structure
5. **Content SEO** - Heading structure, keyword considerations
6. **Indexability** - What should/shouldn't be indexed

## Output Format

Deliver SEO design document with:
- **Meta Tag Templates** (page type × title × description)
- **Structured Data Schemas** (JSON-LD examples)
- **URL Pattern Specification**
- **Internal Linking Plan**
- **SEO Checklist** (technical requirements)
- **Content Guidelines** (headings, keywords, alt text)

**Be specific about SEO requirements. Provide actual meta tag templates and schema examples.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
