# PDF Link Fetcher

**PDF Link Fetcher** is a Chrome extension that automatically detects and extracts PDF links from the current web page. It allows users to manage, copy, or export these links to a CSV file for offline use.

## Features

- **One-Click Fetching**: Instantly scan the current tab for all hyperlinks ending in `.pdf`.
- **Auto-Fetch Mode**: Automatically scan for PDF links whenever a new page loads.
- **CSV Export**: Download the collected list of PDF links (including link text and URL) to a CSV file.
- **Copy to Clipboard**: Quickly copy all found PDF URLs to your clipboard.
- **Duplicate Prevention**: Automatically ignores duplicate links to keep your list clean.
- **Badge Indicators**: Shows the count of found PDF links directly on the extension icon.

## Installation

Since this extension is not yet in the Chrome Web Store, you can install it in "Developer Mode":

1.  Clone or download this repository.
2.  Open Google Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this extension's files (the directory with `manifest.json`).

## Usage

1.  **Manual Fetch**: Click the extension icon and press the **Fetch from Tab** button to scan the current page.
2.  **Auto-Fetch**: Toggle the **Auto-Fetch** switch in the popup to enable automatic scanning on every page load.
3.  **Export**: Click **Download CSV** to save the list of found PDFs.
4.  **Copy**: Click **Copy URLs** to copy the list of links to your clipboard.
5.  **Reset**: Use the **Reset All** button to clear the stored links.

## Permissions

-   `activeTab`: Required to scan the current tab for links when requested.
-   `scripting`: Required to inject the content script that finds the links.
-   `storage`: Required to save your settings and the list of found links.
