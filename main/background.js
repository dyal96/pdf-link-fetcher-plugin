chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        const { autoFetch } = await chrome.storage.local.get(['autoFetch']);

        if (autoFetch) {
            try {
                // Determine if we can inject script (might fail on some restricted pages)
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });

                const response = await chrome.tabs.sendMessage(tabId, { action: "fetch_pdfs" });

                if (response && response.links && response.links.length > 0) {
                    await addLinksToStorage(response.links);

                    // Optional: Update badge to show count found on THIS page or TOTAL? 
                    // Let's show a "OK" or count on badge to indicate activity
                    chrome.action.setBadgeText({ text: displayCount(response.links.length), tabId: tabId });
                    chrome.action.setBadgeBackgroundColor({ color: '#28a745', tabId: tabId });
                }
            } catch (err) {
                console.log("Auto-fetch failed or not applicable for this tab:", err);
            }
        }
    }
});

function displayCount(n) {
    if (n > 99) return "99+";
    return n.toString();
}

async function addLinksToStorage(newLinks) {
    const { pdfLinks } = await chrome.storage.local.get(['pdfLinks']);
    const currentLinks = pdfLinks || [];
    const existingUrls = new Set(currentLinks.map(l => l.url));
    let addedCount = 0;

    for (const link of newLinks) {
        if (!existingUrls.has(link.url)) {
            currentLinks.push(link);
            existingUrls.add(link.url);
            addedCount++;
        }
    }

    if (addedCount > 0) {
        await chrome.storage.local.set({ pdfLinks: currentLinks });
    }
}
