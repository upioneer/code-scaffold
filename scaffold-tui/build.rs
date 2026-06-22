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
}
