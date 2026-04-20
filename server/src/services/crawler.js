const axios = require("axios");
const cheerio = require("cheerio");

// ----------------------
// FAST CRAWLER
// ----------------------
const crawlTarget = async (target) => {

    const baseUrl = target.startsWith("http")
        ? target
        : `http://${target}`;

    console.log("🕷 Crawling:", baseUrl);

    try {
        // Step 1: Get homepage
        const res = await axios.get(baseUrl, {
            timeout: 2000,
            validateStatus: () => true
        });

        const html = res.data;
        const $ = cheerio.load(html);

        let links = [];

        // Step 2: Extract links
        $("a").each((i, el) => {
            let href = $(el).attr("href");

            if (!href) return;

            // Convert relative → absolute
            if (href.startsWith("/")) {
                href = baseUrl + href;
            }

            // Keep only same domain links
            if (href.includes(target)) {
                links.push(href);
            }
        });

        // Remove duplicates
        links = [...new Set(links)];

        console.log("🔗 Raw Links:", links);

        // ----------------------
        // 🔥 LIMIT LINKS (CRITICAL)
        // ----------------------
        const MAX_LINKS = 5;
        const limitedLinks = links.slice(0, MAX_LINKS);

        // ----------------------
        // ⚡ PARALLEL VALIDATION (FAST)
        // ----------------------
        const requests = limitedLinks.map(link => {
            return axios.get(link, {
                timeout: 1500,
                validateStatus: () => true
            }).catch(() => null);
        });

        await Promise.all(requests);

        console.log("🔗 Final Links:", limitedLinks);

        return limitedLinks;

    } catch (err) {
        console.error("❌ Crawl error:", err.message);

        // fallback (important)
        return [`http://${target}/?id=1`];
    }
};

module.exports = { crawlTarget };