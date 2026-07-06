use anyhow::Result;
use std::time::Duration;
use tokio::time::timeout;

pub fn spawn_update_checker(tx: tokio::sync::mpsc::UnboundedSender<String>) {
    tokio::spawn(async move {
        let token = std::env::var("GITHUB_TOKEN").ok();
        let frequency = if token.is_some() {
            60 * 60 // 1 hour
        } else {
            4 * 60 * 60 // 4 hours
        };

        loop {
            let target_str = if cfg!(target_os = "windows") && cfg!(target_arch = "x86_64") {
                "ota-payload-windows-x64"
            } else if cfg!(target_os = "windows") && cfg!(target_arch = "aarch64") {
                "ota-payload-windows-arm64"
            } else if cfg!(target_os = "linux") && cfg!(target_arch = "x86_64") {
                "ota-payload-linux-x64"
            } else if cfg!(target_os = "linux") && cfg!(target_arch = "aarch64") {
                "ota-payload-linux-arm64"
            } else if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
                "ota-payload-macos-arm64"
            } else {
                return;
            };

            let bin_name = if cfg!(target_os = "windows") {
                "update.exe"
            } else {
                "update.bin"
            };

            let token_clone = token.clone();
            let check_task = tokio::task::spawn_blocking(move || {
                let mut builder = self_update::backends::github::Update::configure();
                builder
                    .repo_owner("upioneer")
                    .repo_name("code-scaffold")
                    .bin_name(bin_name)
                    .target(target_str)
                    .show_download_progress(false)
                    .show_output(false)
                    .no_confirm(true)
                    .current_version(env!("CARGO_PKG_VERSION"));

                if let Some(t) = token_clone {
                    builder.auth_token(&t);
                }

                if let Ok(updater) = builder.build() {
                    if let Ok(latest) = updater.get_latest_release() {
                        if self_update::version::bump_is_greater(
                            env!("CARGO_PKG_VERSION"),
                            &latest.version,
                        )
                        .unwrap_or(false)
                        {
                            return Some(latest.version);
                        }
                    }
                }
                None
            });

            // Use a longer timeout for background check
            if let Ok(Ok(Some(latest_version))) = timeout(Duration::from_secs(10), check_task).await
            {
                let _ = tx.send(format!("[UPDATE_AVAILABLE] {}", latest_version));
            }

            tokio::time::sleep(Duration::from_secs(frequency)).await;
        }
    });
}

pub fn perform_update() -> Result<()> {
    let target_str = if cfg!(target_os = "windows") && cfg!(target_arch = "x86_64") {
        "ota-payload-windows-x64"
    } else if cfg!(target_os = "windows") && cfg!(target_arch = "aarch64") {
        "ota-payload-windows-arm64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "x86_64") {
        "ota-payload-linux-x64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "aarch64") {
        "ota-payload-linux-arm64"
    } else if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        "ota-payload-macos-arm64"
    } else {
        return Ok(());
    };

    let bin_name = if cfg!(target_os = "windows") {
        "update.exe"
    } else {
        "update.bin"
    };

    let mut builder = self_update::backends::github::Update::configure();
    builder
        .repo_owner("upioneer")
        .repo_name("code-scaffold")
        .bin_name(bin_name)
        .target(target_str)
        .show_download_progress(false)
        .show_output(false)
        .no_confirm(true)
        .current_version(env!("CARGO_PKG_VERSION"));

    if let Ok(token) = std::env::var("GITHUB_TOKEN") {
        builder.auth_token(&token);
    }

    if let Ok(updater) = builder.build() {
        updater.update()?;
    }

    Ok(())
}
