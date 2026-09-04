use crate::models::skill::{SkillManifest, SkillMeta, SkillRecord};
use anyhow::Result;
use std::collections::{BTreeMap, HashMap};
use std::path::{Path, PathBuf};

pub struct SkillIndex {
    records: Vec<SkillRecord>,
    slug_map: HashMap<String, usize>,
    category_map: BTreeMap<String, Vec<usize>>,
}

impl SkillIndex {
    pub fn build(payload_dir: &Path) -> Result<Self> {
        let skills_dir = payload_dir.join(".skills");
        let mut records = Vec::new();

        if skills_dir.exists() && skills_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&skills_dir) {
                let mut dirs: Vec<PathBuf> = entries
                    .flatten()
                    .filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false))
                    .map(|e| e.path())
                    .collect();

                // Sort directories alphabetically
                dirs.sort();

                for dir in dirs {
                    let slug = match dir.file_name().and_then(|n| n.to_str()) {
                        Some(name) => name.to_string(),
                        None => continue,
                    };

                    // Try to read meta.json and skill-manifest.json
                    let meta_path = dir.join("meta.json");
                    let manifest_path = dir.join("skill-manifest.json");

                    let mut meta_opt: Option<SkillMeta> = None;
                    if meta_path.exists() {
                        if let Ok(content) = std::fs::read_to_string(&meta_path) {
                            if let Ok(m) = serde_json::from_str::<SkillMeta>(&content) {
                                meta_opt = Some(m);
                            }
                        }
                    }

                    let mut manifest_opt: Option<SkillManifest> = None;
                    if manifest_path.exists() {
                        if let Ok(content) = std::fs::read_to_string(&manifest_path) {
                            if let Ok(sm) = serde_json::from_str::<SkillManifest>(&content) {
                                manifest_opt = Some(sm);
                            }
                        }
                    }

                    if meta_opt.is_none() && manifest_opt.is_none() {
                        continue;
                    }

                    let label = meta_opt
                        .as_ref()
                        .map(|m| m.label.clone())
                        .unwrap_or_else(|| slug.clone());

                    let description = manifest_opt
                        .as_ref()
                        .map(|m| m.description.clone())
                        .or_else(|| meta_opt.as_ref().map(|m| m.description.clone()))
                        .unwrap_or_default();

                    let version = manifest_opt
                        .as_ref()
                        .map(|m| m.version.clone())
                        .or_else(|| meta_opt.as_ref().map(|m| m.version.clone()))
                        .unwrap_or_else(|| "1".to_string());

                    let category = manifest_opt
                        .as_ref()
                        .map(|m| m.category.clone())
                        .filter(|c| !c.is_empty())
                        .unwrap_or_else(|| "Uncategorized".to_string());

                    let keywords = manifest_opt
                        .as_ref()
                        .map(|m| m.keywords.clone())
                        .unwrap_or_default();

                    let permissions = manifest_opt
                        .as_ref()
                        .map(|m| m.required_permissions.clone())
                        .unwrap_or_default();

                    let engines = manifest_opt
                        .as_ref()
                        .map(|m| m.engines.clone())
                        .unwrap_or_default();

                    let entry_point = manifest_opt
                        .as_ref()
                        .map(|m| m.entry_point.clone())
                        .unwrap_or_else(|| "./SKILL.md".to_string());

                    let target = meta_opt
                        .as_ref()
                        .map(|m| m.target.clone())
                        .unwrap_or_else(|| format!(".skills/{}", slug));

                    let logo = meta_opt
                        .as_ref()
                        .map(|m| m.logo.clone())
                        .unwrap_or_default();

                    records.push(SkillRecord {
                        slug,
                        label,
                        description,
                        version,
                        category,
                        keywords,
                        permissions,
                        engines,
                        entry_point,
                        target,
                        source_path: dir,
                        logo,
                    });
                }
            }
        }

        let mut slug_map = HashMap::new();
        let mut category_map: BTreeMap<String, Vec<usize>> = BTreeMap::new();

        for (idx, record) in records.iter().enumerate() {
            slug_map.insert(record.slug.to_lowercase(), idx);
            category_map
                .entry(record.category.clone())
                .or_default()
                .push(idx);
        }

        Ok(Self {
            records,
            slug_map,
            category_map,
        })
    }

    pub fn records(&self) -> &[SkillRecord] {
        &self.records
    }

    pub fn total(&self) -> usize {
        self.records.len()
    }

    pub fn get_by_slug(&self, slug: &str) -> Option<&SkillRecord> {
        let idx = self.slug_map.get(&slug.to_lowercase())?;
        self.records.get(*idx)
    }

    pub fn all_slugs(&self) -> Vec<String> {
        self.records.iter().map(|r| r.slug.clone()).collect()
    }

    pub fn categories(&self) -> &BTreeMap<String, Vec<usize>> {
        &self.category_map
    }

    pub fn skills_in_category(&self, category: &str) -> Vec<&SkillRecord> {
        if let Some(indices) = self.category_map.get(category) {
            indices
                .iter()
                .filter_map(|i| self.records.get(*i))
                .collect()
        } else {
            Vec::new()
        }
    }
}
