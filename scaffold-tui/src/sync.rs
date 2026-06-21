use anyhow::Result;
use std::io::Read;

pub async fn sync_payload() -> Result<std::path::PathBuf> {
    // 1. Determine if we are in local dev mode.
    let mut current_dir = std::env::current_dir().unwrap_or_default();
    let mut is_local_dev = false;
    let mut dev_path = std::path::PathBuf::new();

    loop {
        let t_cand = current_dir.join(".templates");
        let s_cand = current_dir.join(".skills");
        let l_cand = current_dir.join(".licenses");
        if t_cand.exists()
            && t_cand.is_dir()
            && s_cand.exists()
            && s_cand.is_dir()
            && l_cand.exists()
            && l_cand.is_dir()
        {
            is_local_dev = true;
            dev_path = current_dir.clone();
            break;
        }
        if !current_dir.pop() {
            break;
        }
    }

    if is_local_dev {
        return Ok(dev_path);
    }

    // 2. Standalone mode. Sync payload to ProjectDirs.
    let proj_dirs = directories::ProjectDirs::from("com", "upioneer", "scaffold-tui")
        .expect("Failed to find project dirs");
    let cache_dir = proj_dirs.data_local_dir().to_path_buf();
    std::fs::create_dir_all(&cache_dir)?;

    let cache_file = cache_dir.join(".sync_cache.json");
    let mut local_version = "0.0.0".to_string();
    if let Ok(content) = std::fs::read_to_string(&cache_file) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(v) = json.get("version").and_then(|v| v.as_str()) {
                local_version = v.to_string();
            }
        }
    }

    let client = reqwest::Client::new();
    let manifest_url =
        "https://raw.githubusercontent.com/upioneer/code-scaffold/main/manifest.json";

    if let Ok(resp) = client.get(manifest_url).send().await {
        if let Ok(manifest) = resp.json::<serde_json::Value>().await {
            if let Some(remote_version) = manifest
                .get("metadata")
                .and_then(|m| m.get("version"))
                .and_then(|v| v.as_str())
            {
                if remote_version != local_version {
                    println!("Syncing remote payload library v{}...", remote_version);
                    let zip_url =
                        "https://github.com/upioneer/code-scaffold/archive/refs/heads/main.zip";
                    if let Ok(zip_resp) = client.get(zip_url).send().await {
                        if let Ok(bytes) = zip_resp.bytes().await {
                            let reader = std::io::Cursor::new(bytes);
                            if let Ok(mut archive) = zip::ZipArchive::new(reader) {
                                for i in 0..archive.len() {
                                    let mut file = archive.by_index(i)?;
                                    let outpath = match file.enclosed_name() {
                                        Some(path) => path.to_owned(),
                                        None => continue,
                                    };
                                    let mut components = outpath.components();
                                    components.next(); // strip 'code-scaffold-main' root
                                    let rel_path: std::path::PathBuf = components.collect();

                                    if rel_path.starts_with(".templates")
                                        || rel_path.starts_with(".skills")
                                        || rel_path.starts_with(".licenses")
                                    {
                                        let target = cache_dir.join(&rel_path);
                                        if file.name().ends_with('/') {
                                            std::fs::create_dir_all(&target)?;
                                        } else {
                                            if let Some(p) = target.parent() {
                                                if !p.exists() {
                                                    std::fs::create_dir_all(p)?;
                                                }
                                            }
                                            let mut outfile = std::fs::File::create(&target)?;
                                            std::io::copy(&mut file, &mut outfile)?;
                                        }
                                    }
                                }
                            }
                            let cache_json = serde_json::json!({ "version": remote_version });
                            std::fs::write(
                                &cache_file,
                                serde_json::to_string_pretty(&cache_json)?,
                            )?;
                        }
                    }
                }
            }
        }
    }

    Ok(cache_dir)
}
