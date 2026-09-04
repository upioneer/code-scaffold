use crate::models::skill::SkillRecord;
use crate::skills_cli::index::SkillIndex;

#[derive(Debug, Clone, serde::Serialize)]
pub struct SearchResult<'a> {
    pub slug: &'a str,
    pub label: &'a str,
    pub version: &'a str,
    pub category: &'a str,
    pub description: &'a str,
    pub keywords: &'a [String],
    pub score: f64,
}

pub fn search<'a>(
    index: &'a SkillIndex,
    query: &str,
    category_filter: Option<&str>,
    limit: usize,
) -> Vec<SearchResult<'a>> {
    let tokens: Vec<String> = query
        .split_whitespace()
        .map(|t| t.trim().to_lowercase())
        .filter(|t| !t.is_empty())
        .collect();

    if tokens.is_empty() {
        return Vec::new();
    }

    let mut results: Vec<SearchResult<'a>> = Vec::new();

    for record in index.records() {
        if let Some(cat) = category_filter {
            if !record.category.eq_ignore_ascii_case(cat) {
                continue;
            }
        }

        let score = score_record(&tokens, record);
        if score > 0.0 {
            results.push(SearchResult {
                slug: &record.slug,
                label: &record.label,
                version: &record.version,
                category: &record.category,
                description: &record.description,
                keywords: &record.keywords,
                score,
            });
        }
    }

    // Sort descending by score, then alphabetically by slug
    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.slug.cmp(b.slug))
    });

    if limit > 0 && results.len() > limit {
        results.truncate(limit);
    }

    results
}

fn score_record(tokens: &[String], record: &SkillRecord) -> f64 {
    let slug_lower = record.slug.to_lowercase();
    let label_lower = record.label.to_lowercase();
    let desc_lower = record.description.to_lowercase();
    let cat_lower = record.category.to_lowercase();

    let mut total_score = 0.0;

    for token in tokens {
        let mut token_score = 0.0;

        // 1. Match on Slug (Weight 5.0)
        token_score += match_field(token, &slug_lower, 5.0);

        // 2. Match on Label (Weight 4.0)
        token_score += match_field(token, &label_lower, 4.0);

        // 3. Match on Keywords (Weight 3.5 per hit)
        for kw in &record.keywords {
            let kw_score = match_field(token, &kw.to_lowercase(), 3.5);
            if kw_score > 0.0 {
                token_score += kw_score;
                break; // count highest keyword match for this token
            }
        }

        // 4. Match on Category (Weight 2.0)
        token_score += match_field(token, &cat_lower, 2.0);

        // 5. Match on Description (Weight 1.0)
        if desc_lower.contains(token) {
            token_score += 5.0;
        }

        // Conjunction requirement: every token must have at least one match
        if token_score <= 0.0 {
            return 0.0;
        }

        total_score += token_score;
    }

    total_score
}

fn match_field(token: &str, field: &str, weight: f64) -> f64 {
    if field == token {
        weight * 10.0 // exact full match
    } else if field.starts_with(token) {
        weight * 7.0 // prefix match
    } else if field.contains(token) {
        weight * 3.0 // substring match
    } else {
        0.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::path::PathBuf;

    fn sample_record() -> SkillRecord {
        SkillRecord {
            slug: "playwright".to_string(),
            label: "Playwright Automation".to_string(),
            description: "Browser automation and visual regression testing.".to_string(),
            version: "4".to_string(),
            category: "Web Automation & Scraping".to_string(),
            keywords: vec![
                "e2e".to_string(),
                "browser".to_string(),
                "scraping".to_string(),
            ],
            permissions: vec!["net:connect".to_string()],
            engines: HashMap::new(),
            entry_point: "./SKILL.md".to_string(),
            target: ".skills/playwright".to_string(),
            source_path: PathBuf::from("/mock/playwright"),
            logo: vec![],
        }
    }

    #[test]
    fn test_exact_slug_match_scores_highest() {
        let rec = sample_record();
        let score_exact = score_record(&["playwright".to_string()], &rec);
        let score_partial = score_record(&["play".to_string()], &rec);
        assert!(score_exact > score_partial);
        assert!(score_exact >= 50.0);
    }

    #[test]
    fn test_keyword_match() {
        let rec = sample_record();
        let score = score_record(&["browser".to_string()], &rec);
        assert!(score > 0.0);
    }

    #[test]
    fn test_unmatched_token_gives_zero() {
        let rec = sample_record();
        let score = score_record(
            &["playwright".to_string(), "nonexistent123".to_string()],
            &rec,
        );
        assert_eq!(score, 0.0);
    }
}
