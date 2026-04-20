const scans = {};

const createScan = (id) => {
    scans[id] = {
        stage: "starting",
        progress: 0
    };
};

const updateScan = (id, data) => {
    if (scans[id]) {
        scans[id] = { ...scans[id], ...data };
    }
};

const getScan = (id) => scans[id] || null;

module.exports = { createScan, updateScan, getScan };
