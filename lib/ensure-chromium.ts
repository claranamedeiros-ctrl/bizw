import { execSync } from 'child_process';
import { existsSync } from 'fs';

let chromiumInstalled = false;

export async function ensureChromium() {
  if (chromiumInstalled) {
    return; // Already checked and installed
  }

  // Check if Chromium exists
  const chromiumPath = process.env.HOME
    ? `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`
    : '/opt/render/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell';

  if (existsSync(chromiumPath)) {
    console.log('[Chromium] Already installed at:', chromiumPath);
    chromiumInstalled = true;
    return;
  }

  // Not found - install it now
  console.log('[Chromium] Not found. Installing Playwright browsers...');
  console.log('[Chromium] HOME:', process.env.HOME);

  try {
    execSync('npx playwright install chromium', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('[Chromium] Installation complete');
    chromiumInstalled = true;
  } catch (error) {
    console.error('[Chromium] Installation failed:', error);
    throw new Error('Failed to install Chromium');
  }
}
