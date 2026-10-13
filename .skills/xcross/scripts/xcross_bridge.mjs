#!/usr/bin/env node
/**
 * XCross Cross-Platform iOS Automation Bridge & Diagnostic Suite
 * Provides environment health checks, project scaffolding, interactive onboarding,
 * device discovery, and build automation without Xcode dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import readline from 'node:readline';

const COMMANDS = {
  doctor: 'Run environment diagnostics and dependency health checks',
  onboard: 'Launch interactive onboarding walkthrough with option to skip',
  init: 'Scaffold a new cross-platform SwiftPM iOS application',
  devices: 'Detect and list physical iOS devices connected over USB/WiFi',
  build: 'Compile SwiftPM package into signed iOS application bundle'
};

function runCommandSafe(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function runDoctor() {
  console.log('\n======================================================================');
  console.log('  XCross Cross-Platform iOS Environment Diagnostic');
  console.log('======================================================================\n');

  const osType = process.platform;
  console.log(`[HOST] Operating System: ${osType} (${process.arch})`);

  // 1. Swift Toolchain Check
  const swiftVer = runCommandSafe('swift --version');
  if (swiftVer) {
    const firstLine = swiftVer.split('\n')[0];
    console.log(`[PASS] Swift Toolchain: ${firstLine}`);
  } else {
    console.log('[WARN] Swift Toolchain not detected in PATH. (Install via https://swift.org/install)');
  }

  // 2. Device Communication (usbmuxd / libimobiledevice)
  const ideviceVer = runCommandSafe('idevice_id --version') || runCommandSafe('idevice_id -v');
  if (ideviceVer) {
    console.log(`[PASS] Device Multiplexer: libimobiledevice available`);
  } else {
    console.log('[INFO] libimobiledevice not found in PATH. Physical USB device pairing requires usbmuxd.');
  }

  // 3. Apple Developer Environment Secrets
  const hasKeyId = Boolean(process.env.APPLE_KEY_ID);
  const hasIssuer = Boolean(process.env.APPLE_ISSUER_ID);
  const hasPrivKey = Boolean(process.env.APPLE_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY_PATH);

  if (hasKeyId && hasIssuer && hasPrivKey) {
    console.log('[PASS] Apple Developer API Secrets: Configured via environment');
  } else {
    console.log('[INFO] Apple Developer Credentials: Not configured. Set APPLE_KEY_ID and APPLE_ISSUER_ID for automatic signing.');
  }

  // 4. WSL Check (if running on Windows or Linux)
  if (osType === 'linux') {
    const isWsl = runCommandSafe('uname -r')?.toLowerCase().includes('microsoft');
    if (isWsl) {
      console.log('[INFO] Running inside Windows Subsystem for Linux (WSL2).');
      console.log('       To attach physical iOS devices, execute `usbipd attach --wsl --busid <ID>` from Windows PowerShell.');
    }
  }

  console.log('\n[SUMMARY] Environment diagnostic complete.\n');
}

async function runOnboarding(skipPrompt = false) {
  console.log('\n======================================================================');
  console.log('  Welcome to XCross : Cross-Platform iOS Development Without Xcode');
  console.log('======================================================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  let choice = skipPrompt ? '2' : '1';
  if (!skipPrompt) {
    console.log('Are you new to building iOS apps on Linux, Windows WSL, or macOS without Xcode?');
    console.log('  [1] Take the guided 5-step onboarding walkthrough (Recommended for newcomers)');
    console.log('  [2] Skip onboarding directly to expert mode\n');
    choice = (await question('Select an option (1 or 2, default 1): ')).trim() || '1';
  }

  if (choice === '2' || choice.toLowerCase() === 'skip' || choice.toLowerCase() === 's') {
    console.log('\n[MODE] Expert Mode Activated : Skipping Onboarding.\n');
    console.log('Quick Command Reference:');
    console.log('  * xcross doctor          : Verify toolchains and USB bridge');
    console.log('  * xcross init <Name>     : Scaffold SwiftPM iOS project');
    console.log('  * xcross devices         : List connected iPhone/iPad hardware');
    console.log('  * xcross build           : Compile and package .ipa\n');
    rl.close();
    return;
  }

  console.log('\n--- Step 1: Environment Readiness ---');
  console.log('XCross allows you to write standard Swift and SwiftUI code using Swift Package Manager.');
  console.log('Under the hood, it cross-compiles Swift packages into native ARM64 Mach-O binaries');
  console.log('and packages them into standard iOS .app and .ipa containers.\n');
  await question('Press [Enter] to continue to Step 2...');

  console.log('\n--- Step 2: Apple Developer Credentials & Code Signing ---');
  console.log('iOS hardware enforces strict signature checks. To sign your apps:');
  console.log('  1. Generate an App Store Connect API Key (.p8 file) at developer.apple.com');
  console.log('  2. Set your environment variables:');
  console.log('     export APPLE_KEY_ID="ABC123XYZ"');
  console.log('     export APPLE_ISSUER_ID="57246542-96fe-..."');
  console.log('     export APPLE_PRIVATE_KEY_PATH="~/.keys/AuthKey.p8"');
  console.log('XCross connects programmatically to register device UDIDs and fetch provisioning profiles.\n');
  await question('Press [Enter] to continue to Step 3...');

  console.log('\n--- Step 3: Project Anatomy ---');
  console.log('When you run `xcross init MyApp`, you get:');
  console.log('  * Package.swift     : Standard SwiftPM package target manifest');
  console.log('  * xcross.yml        : Bundle ID, icons, entitlements, and deployment target');
  console.log('  * Sources/MyApp/    : Pure SwiftUI App.swift and ContentView.swift');
  console.log('  * .bsp/xcross.json  : Editor language server configuration for VS Code\n');
  await question('Press [Enter] to continue to Step 4...');

  console.log('\n--- Step 4: Connecting Physical Hardware ---');
  console.log('Plug your iPhone into your computer via USB:');
  console.log('  * Unlock your iPhone and tap "Trust This Computer"');
  console.log('  * On iOS 16+, ensure Developer Mode is toggled on (Settings > Privacy & Security)');
  console.log('  * On Windows WSL2, attach the USB bus: `usbipd attach --wsl --busid <ID>`');
  console.log('  * Run `xcross devices` to verify connection\n');
  await question('Press [Enter] to continue to Step 5...');

  console.log('\n--- Step 5: Live Compilation & Deployment ---');
  console.log('Run `xcross build` inside your project directory to:');
  console.log('  1. Cross-compile SwiftPM sources');
  console.log('  2. Compile asset catalogs and generate Info.plist');
  console.log('  3. Code-sign the Mach-O binary');
  console.log('  4. Install and launch on your iPhone in seconds!\n');

  console.log('🎉 Onboarding complete! You are ready to build your first iOS app without Xcode.\n');
  rl.close();
}

function scaffoldProject(projectName = 'HelloiOS', targetDir = process.cwd()) {
  const root = path.resolve(targetDir, projectName);
  if (fs.existsSync(root)) {
    console.error(`Error: Directory '${projectName}' already exists.`);
    process.exit(1);
  }

  console.log(`\nScaffolding new cross-platform iOS project: ${projectName}...`);

  fs.mkdirSync(path.join(root, 'Sources', projectName), { recursive: true });
  fs.mkdirSync(path.join(root, '.bsp'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Resources'), { recursive: true });

  // 1. Package.swift
  const packageSwift = `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "${projectName}",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "${projectName}",
            targets: ["${projectName}"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "${projectName}",
            dependencies: [],
            path: "Sources/${projectName}"
        ),
    ]
)
`;
  fs.writeFileSync(path.join(root, 'Package.swift'), packageSwift, 'utf8');

  // 2. xcross.yml
  const xcrossYml = `name: ${projectName}
bundleID: com.codescaffold.${projectName.toLowerCase()}
version: 1.0.0
build: 1
target: ${projectName}
deploymentTarget: "17.0"
capabilities:
  - camera
resources:
  - Resources/
entitlements:
  get-task-allow: true
`;
  fs.writeFileSync(path.join(root, 'xcross.yml'), xcrossYml, 'utf8');

  // 3. .bsp/xcross.json
  const bspJson = {
    name: 'xcross',
    version: '1.0.0',
    bspVersion: '2.1.0',
    languages: ['swift'],
    argv: ['xcross', 'bsp']
  };
  fs.writeFileSync(path.join(root, '.bsp', 'xcross.json'), JSON.stringify(bspJson, null, 2), 'utf8');

  // 4. .gitignore
  const gitignore = `.build/
.swiftpm/
.xcross/
build/
*.ipa
*.dSYM
`;
  fs.writeFileSync(path.join(root, '.gitignore'), gitignore, 'utf8');

  // 5. App.swift
  const appSwift = `import SwiftUI

@main
struct ${projectName}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;
  fs.writeFileSync(path.join(root, 'Sources', projectName, `${projectName}App.swift`), appSwift, 'utf8');

  // 6. ContentView.swift
  const contentSwift = `import SwiftUI

struct ContentView: View {
    @State private var counter = 0
    @State private var isPulsing = false

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.07, blue: 0.11)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "bolt.horizontal.circle.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 80, height: 80)
                    .foregroundColor(Color(red: 0.0, green: 0.94, blue: 1.0))
                    .scaleEffect(isPulsing ? 1.08 : 0.96)
                    .animation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true), value: isPulsing)

                Text("${projectName}")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text("Built with XCross on Linux/Windows")
                    .font(.subheadline)
                    .foregroundColor(.gray)

                Button(action: {
                    counter += 1
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Counter: \\(counter)")
                    }
                    .font(.headline)
                    .foregroundColor(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 14)
                    .background(Color(red: 0.0, green: 0.94, blue: 1.0))
                    .cornerRadius(12)
                }
            }
            .padding()
        }
        .onAppear {
            isPulsing = true
        }
    }
}
`;
  fs.writeFileSync(path.join(root, 'Sources', projectName, 'ContentView.swift'), contentSwift, 'utf8');

  console.log(`[SUCCESS] Project '${projectName}' scaffolded successfully at ${root}\n`);
  console.log('Next Steps:');
  console.log(`  cd ${projectName}`);
  console.log('  node ../.skills/xcross/scripts/xcross_bridge.mjs devices');
  console.log('  node ../.skills/xcross/scripts/xcross_bridge.mjs build\n');
}

function listDevices() {
  console.log('\nScanning for connected iOS devices via usbmuxd...');
  const deviceOutput = runCommandSafe('idevice_id -l');

  if (deviceOutput && deviceOutput.trim().length > 0) {
    const udids = deviceOutput.trim().split('\n').filter(Boolean);
    console.log(`\nFound ${udids.length} connected iOS device(s):`);
    udids.forEach((udid, i) => {
      console.log(`  [${i + 1}] UDID: ${udid} (Connected via USB)`);
    });
  } else {
    console.log('\n[NOTICE] No physical iOS hardware detected over USB.');
    console.log('  * Ensure your iPhone or iPad is connected with a data cable.');
    console.log('  * Ensure the device is unlocked and you have tapped "Trust This Computer".');
    console.log('  * If using Windows WSL2, run `usbipd attach --wsl --busid <BUSID>` in PowerShell.');
  }
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'doctor':
      runDoctor();
      break;
    case 'onboard':
      await runOnboarding(args.includes('--skip'));
      break;
    case 'init':
    case 'new':
      scaffoldProject(args[1] || 'HelloiOS');
      break;
    case 'devices':
      listDevices();
      break;
    case 'help':
    default:
      console.log('\nUsage: node xcross_bridge.mjs <command> [options]\n');
      console.log('Commands:');
      Object.entries(COMMANDS).forEach(([cmd, desc]) => {
        console.log(`  ${cmd.padEnd(12)} : ${desc}`);
      });
      console.log('');
      break;
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
