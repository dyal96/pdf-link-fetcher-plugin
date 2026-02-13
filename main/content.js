// Check if listener is already added
if (!window.hasPdfFetcherListener) {
    window.hasPdfFetcherListener = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "fetch_pdfs") {
            const links = Array.from(document.querySelectorAll('a'));
            const pdfLinks = links
                .map(a => ({
                    text: a.innerText.trim() || a.href,
                    url: a.href
                }))
                .filter(link => {
                    if (!link.url) return false;
                    try {
                        const urlObj = new URL(link.url, document.baseURI);
                        return urlObj.pathname.toLowerCase().endsWith('.pdf');
                    } catch (e) {
                        return false;
                    }
                });

            // Remove duplicates based on URL
            const uniqueLinks = [];
            const seenUrls = new Set();
            for (const link of pdfLinks) {
                if (!seenUrls.has(link.url)) {
                    seenUrls.add(link.url);
                    uniqueLinks.push(link);
                }
            }

            sendResponse({ links: uniqueLinks });
        }
        return true; // Keep channel open
    });
}
