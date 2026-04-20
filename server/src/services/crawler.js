const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

const normalizeUrl = (base, link) => {
    try {
        return new URL(link, base).href;
    } catch (e) {
        return null;
    }
};

const crawlTarget = async (target) => {
    try {
        const baseUrl = `http://${target}`;
        console.log("🕷 Crawling:", baseUrl);

        const res = await axios.get(baseUrl, {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const html = res.data;
        const $ = cheerio.load(html);

        let links = [];

        $("a").each((i, el) => {
            const href = $(el).attr("href");

            if (href) {
                const fullUrl = normalizeUrl(baseUrl, href);

                if (fullUrl && fullUrl.startsWith(baseUrl)) {
                    links.push(fullUrl);
                }
            }
        });

        // ✅ Remove duplicates
        links = [...new Set(links)];

        console.log("🔗 Clean Links:", links);

        return links.slice(0,5);

    } catch (err) {
        console.error("Crawler error:", err.message);
        return [];
    }
};

module.exports = { crawlTarget };