document.addEventListener('DOMContentLoaded', async () => {
    await updateUI();
    const { autoFetch } = await chrome.storage.local.get(['autoFetch']);
    document.getElementById('autoFetchToggle').checked = !!autoFetch;
});

// Update UI when storage changes (e.g. from background script)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.pdfLinks) {
        updateUI();
    }
});

document.getElementById('autoFetchToggle').addEventListener('change', async (e) => {
    await chrome.storage.local.set({ autoFetch: e.target.checked });
});

document.getElementById('fetchBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = 'Scanning...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        statusDiv.textContent = 'No active tab.';
        return;
    }

    try {
        // Inject content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: "fetch_pdfs" });

        if (response && response.links) {
            await addLinksToStorage(response.links);
        } else {
            statusDiv.textContent = 'No links found.';
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        console.error(error);
    }
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
    const links = await getLinksFromStorage();
    if (links.length > 0) {
        downloadCSV(links);
    }
});

document.getElementById('downloadAllBtn').addEventListener('click', async () => {
    const links = await getLinksFromStorage();
    if (links.length > 0) {
        downloadAllPDFs(links);
    }
});

document.getElementById('resetBtn').addEventListener('click', async () => {
    await chrome.storage.local.set({ pdfLinks: [] });
    updateUI();
    document.getElementById('status').textContent = 'All links cleared.';
});

async function addLinksToStorage(newLinks) {
    const currentLinks = await getLinksFromStorage();
    const existingUrls = new Set(currentLinks.map(l => l.url));
    let addedCount = 0;

    for (const link of newLinks) {
        if (!existingUrls.has(link.url)) {
            currentLinks.push(link);
            existingUrls.add(link.url);
            addedCount++;
        }
    }

    await chrome.storage.local.set({ pdfLinks: currentLinks });
    updateUI();

    const statusDiv = document.getElementById('status');
    if (addedCount > 0) {
        statusDiv.textContent = `Added ${addedCount} new link${addedCount === 1 ? '' : 's'}.`;
    } else {
        statusDiv.textContent = `No new links found (duplicates skipped).`;
    }
}

async function getLinksFromStorage() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['pdfLinks'], (result) => {
            resolve(result.pdfLinks || []);
        });
    });
}


document.getElementById('copyBtn').addEventListener('click', async () => {
    const links = await getLinksFromStorage();
    if (links.length > 0) {
        const urlList = links.map(link => link.url).join('\n');
        try {
            await navigator.clipboard.writeText(urlList);
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = `Copied ${links.length} URLs to clipboard!`;
            setTimeout(() => {
                if (statusDiv.textContent.startsWith('Copied')) {
                    statusDiv.textContent = '';
                }
            }, 3000);
        } catch (err) {
            document.getElementById('status').textContent = 'Failed to copy: ' + err;
        }
    }
});

async function updateUI() {
    const links = await getLinksFromStorage();
    const countDiv = document.getElementById('result-count');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const copyBtn = document.getElementById('copyBtn');

    countDiv.textContent = `Total Links: ${links.length}`;
    downloadBtn.disabled = links.length === 0;
    downloadAllBtn.disabled = links.length === 0;
    copyBtn.disabled = links.length === 0;
}

function downloadCSV(links) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = `Generating CSV...`;

    try {
        const csvContent = "Link Text,URL\n"
            + links.map(e => {
                const text = e.text ? e.text.replace(/"/g, '""').replace(/\n/g, ' ') : "No Text";
                return `"${text}","${e.url}"`;
            }).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "pdf_links_collection.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusDiv.textContent = `Successfully export to CSV.`;
    } catch (err) {
        statusDiv.textContent = 'Error creating CSV: ' + err.message;
    }
}

async function downloadAllPDFs(links) {
    const statusDiv = document.getElementById('status');
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    statusDiv.textContent = `Starting downloads... (0/${links.length})`;

    for (const link of links) {
        try {
            // Delegate to background service worker to avoid popup context restrictions
            const result = await chrome.runtime.sendMessage({
                action: 'download_file',
                url: link.url
            });

            if (result && result.success) {
                successCount++;
            } else {
                failCount++;
                errors.push(result?.error || 'Unknown error');
                console.error(`Failed to download ${link.url}:`, result?.error);
            }
        } catch (err) {
            failCount++;
            errors.push(err.message);
            console.error(`Failed to download ${link.url}:`, err);
        }
        statusDiv.textContent = `Downloading... (${successCount + failCount}/${links.length})`;
    }

    if (failCount === 0) {
        statusDiv.textContent = `Successfully started ${successCount} downloads!`;
    } else {
        const firstError = errors[0] ? ` Error: ${errors[0]}` : '';
        statusDiv.textContent = `Started ${successCount} downloads. ${failCount} failed.${firstError}`;
    }
}
