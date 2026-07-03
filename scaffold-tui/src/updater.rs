use anyhow::Result;
use std::time::Duration;
use tokio::time::timeout;

pub async fn check_for_updates() -> Result<()> {
    let target_str = if cfg!(target_os = "windows") && cfg!(target_arch = "x86_64") {
        "windows-x64"
    } else if cfg!(target_os = "windows") && cfg!(target_arch = "aarch64") {
        "windows-arm64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "x86_64") {
        "linux-x64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "aarch64") {
        "linux-arm64"
    } else if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        "macos-arm64"
    } else {
        return Ok(());
    };

    // Fast 3-second timeout to prevent hanging offline users during the network check
    let check_task = tokio::task::spawn_blocking(move || {
        if let Ok(updater) = self_update::backends::github::Update::configure()
            .repo_owner("upioneer")
            .repo_name("code-scaffold")
            .bin_name("scaffold-tui")
            .target(target_str)
            .show_download_progress(true)
            .show_output(false)
            .no_confirm(true)
            .current_version(env!("CARGO_PKG_VERSION"))
            .build()
        {
            if let Ok(latest) = updater.get_latest_release() {
                if self_update::version::bump_is_greater(env!("CARGO_PKG_VERSION"), &latest.version)
                    .unwrap_or(false)
                {
                    return Some(latest.version);
                }
            }
        }
        None
    });

    if let Ok(Ok(Some(latest_version))) = timeout(Duration::from_secs(3), check_task).await {
        println!(
            "\nUpdate available: v{} (Current: v{})",
            latest_version,
            env!("CARGO_PKG_VERSION")
        );
        println!("Press [Y] to install, or [Enter] to skip and continue...");

        let mut input = String::new();
        std::io::stdin().read_line(&mut input).unwrap_or(0);
        if input.trim().eq_ignore_ascii_case("y") {
            println!("Downloading and applying update...");
            let _ = tokio::task::spawn_blocking(move || {
                if let Ok(updater) = self_update::backends::github::Update::configure()
                    .repo_owner("upioneer")
                    .repo_name("code-scaffold")
                    .bin_name("scaffold-tui")
                    .target(target_str)
                    .show_download_progress(true)
                    .show_output(false)
                    .no_confirm(true)
                    .current_version(env!("CARGO_PKG_VERSION"))
                    .build()
                {
                    if let Ok(status) = updater.update() {
                        println!(
                            "Update successful ({}). Please relaunch the application.",
                            status.version()
                        );
                        std::process::exit(0);
                    } else {
                        println!("Update failed. Continuing to application...");
                        std::thread::sleep(Duration::from_secs(2));
                    }
                }
            })
            .await;
        }
    }

    Ok(())
}
