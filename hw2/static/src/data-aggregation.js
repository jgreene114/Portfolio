const aggregateData = function (data, frequency) {
    data.forEach(d => {
        d.date = new Date(d.date)
        if (frequency === "monthly") {
            // get date for start of month (to group)
            d.group = d3.timeMonth(d.date)
        } else if (frequency === "weekly") {
            d.group = d3.timeMonday(d.date)
        }
    });
    let aggregatedData = d3.groups(data, d => d.group)
        .map(([group, records]) => {
            let aggregated = {group: group};
            records.forEach(record => {
                Object.keys(record).forEach(key => {
                    if (key !== 'date' && key !== 'group') {
                        aggregated[key] = (aggregated[key] || 0) + +record[key];
                    }
                });
            });
            return aggregated;
        });

    aggregatedData = aggregatedData.slice(1)

    return aggregatedData;
}

const topNData = function (data, n) {
    const itemCounts = {};
    data.forEach(d => {
        Object.entries(d).forEach(([group, value]) => {
            if (group !== 'group') { // Ignore the 'group' key
                itemCounts[group] = itemCounts[group] ? itemCounts[group] + value : value;
            }
        });
    });

    const topNItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(item => item[0]);

    const filteredData = data.map(record => {
        const filteredRecord = {group: record.group};
        topNItems.forEach(item => {
            if (record[item] !== undefined) {
                filteredRecord[item] = record[item];
            }
        });
        return filteredRecord;
    });

    return [filteredData, topNItems, itemCounts];
}
