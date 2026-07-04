fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default() == "windows" {
        let mut res = winres::WindowsResource::new();

        let version = std::env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "1.0.0".to_string());

        // winres requires version in the format X.X.X.X
        let mut version_parts: Vec<&str> = version.split('.').collect();
        while version_parts.len() < 4 {
            version_parts.push("0");
        }

        res.set("FileVersion", &version);
        res.set("ProductVersion", &version);
        res.set("ProductName", "Code Scaffold");
        res.set("FileDescription", "Code Scaffold TUI Application");
        res.set("LegalCopyright", "Upioneer");

        if let Err(e) = res.compile() {
            println!("cargo:warning=Failed to compile windows resources: {}", e);
        }
    }

    let version = std::env::var("CARGO_PKG_VERSION").unwrap_or_else(|_| "1.0.0".to_string());
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let dest_path = std::path::Path::new(&out_dir).join("changelog.txt");

    let changelog_path = format!("../project_details/history/v{}/readme.md", version);
    let mut changelog_text = format!("What's new in v{}:\n", version);
    if let Ok(content) = std::fs::read_to_string(&changelog_path) {
        for line in content.lines() {
            if line.starts_with("* ") || line.starts_with("- ") {
                changelog_text.push_str(line);
                changelog_text.push('\n');
            }
        }
    }

    std::fs::write(&dest_path, changelog_text).expect("Failed to write changelog to OUT_DIR");
    println!("cargo:rerun-if-changed={}", changelog_path);
}
