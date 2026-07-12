use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestMetadata {
    pub version: String,
    #[serde(rename = "lastUpdated")]
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEntry {
    pub id: String,
    pub label: String,
    pub target: String,
    pub method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactEntry {
    pub id: String,
    pub label: String,
    pub source: Option<String>,
    pub target: String,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillEntry {
    pub id: String,
    pub label: String,
    pub source: Option<String>,
    pub target: String,
    pub method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub metadata: ManifestMetadata,
    pub env: HashMap<String, String>,
    pub apps: Vec<AppEntry>,
    pub artifacts: Vec<ArtifactEntry>,
    pub skills: Vec<SkillEntry>,
}
