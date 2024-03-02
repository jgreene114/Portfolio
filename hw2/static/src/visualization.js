let lineOpacityNormal = .8
let lineOpacitySelected = 1
let lineOpacityUnselected = .4

let areaOpacityNormal = .2
let areaOpacitySelected = .3
let areaOpacityUnselected = .1
let areaOpacityClicked = .4

let strokeWidthNormal = 2
let strokeWidthSelected = 3
let strokeWidthUnselected = 1

let circleColor = "#070707"
let monthSepColor = "#646464"
let monthTextColor = "#afafaf"

let legendTextOpacityNormal = .9
let legendTextOpacitySelected = 1
let legendTextOpacityUnselected = .6

let legendTextSizeNormal = "26px"
let legendTextSizeSelected = "30px"
let legendTextSizeUnselected = "24px"


transitionDuration = 400

function titleCase(str) {
    if (str) {
        str = str.replace(/\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        })
        return str
    } else {
        return null
    }
}

function formatMS(msPlayed) {
    const seconds = msPlayed / 1000
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    const minsRem = mins % 60

    let formattedTimeStr = ""
    if (hrs > 0) {
        formattedTimeStr += `${hrs} hrs `;
    }
    if (minsRem > 0 || hrs === 0) {
        formattedTimeStr += `${minsRem} mins`;
    }
    return formattedTimeStr;
}

const addDivOverInnerCircle = async function (svg, radius, selection) {
    let html = (
        "   <div class='inner-circle-content'>" +
        "      <div class='inner-circle-text'>Your year in</div>" +
        "       <div class=\"dropdown\">" +
        `            <p class=\"dropdown-button\">${titleCase(selection)} <i class="fa-solid fa-caret-down"></i></p>` +
        "            <div id=\"dropdown-items-container\" class=\"dropdown-content\">" +
        "                <button onclick=\"redrawChartAndLegend('genres')\">Genres</button>" +
        "                <button onclick=\"redrawChartAndLegend('artists')\">Artists</button>" +
        "                <button onclick=\"redrawChartAndLegend('songs')\">Songs</button>" +
        "            </div>" +
        "       </div>" +
        "   </div>"
    )
    const div = d3.select(".overlay-parent")

    div.select(".inner-circle-content-parent").remove();

    div.append("div")
        .attr("class", "inner-circle-content-parent")
        .html(html)
}

const createRadialChart = async function (selection, svg, data, topNOrder, colorScale) {
    svg.selectAll("#lines").remove();
    let width = svg.attr("width");
    let height = svg.attr("height");
    let margin = {top: 5, bottom: 5, left: 5, right: 10}

    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - margin.top - margin.bottom;
    let outerRadius = Math.min(chartWidth, chartHeight) / 2 * .85;
    let innerRadius = outerRadius * 0.55;

    let linesG = svg.append("g")
        .attr("id", "lines")
        .attr("transform", `translate(${width / 2 + margin.left},
                                      ${height / 2 + margin.top})`);
    let innerCircleG = svg.append("g")
        .attr("transform", `translate(${width / 2 + margin.left},
                                      ${height / 2 + margin.top})`);
    let innerAxisG = svg.append("g")
        .attr("id", "inner-axis")
        .attr("transform", `translate(${width / 2 + margin.left},
                                      ${height / 2 + margin.top})`);

    let firstGroupDate = new Date(data[0].group);
    let nextYearDate = new Date(firstGroupDate.getFullYear() + 1, firstGroupDate.getMonth());

    let nextYearData = {...data[0]}
    nextYearData.group = nextYearDate

    let extendedData = [...data, nextYearData];

    let angleScale = d3.scalePoint()
        .domain(extendedData.map(d => d.group))
        .range([0, 2 * Math.PI]);


    let maxValue = d3.max(data, d => d3.max(Object.keys(d).filter(key => key !== 'group'), key => +d[key]));
    let radialScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([innerRadius + 2, outerRadius]);
    let lineGenerator = d3.lineRadial()
        .angle(d => angleScale(d.group))
        .radius(d => radialScale(d.value))
        .curve(d3.curveCardinalClosed);
    let arr = Object.keys(data[0])
        .filter(d => d !== 'group')
        .map(category => {
            return data.map(d => {
                return {group: d.group, value: d[category]};
            });
        });

    arr.forEach((d, i) => {
        linesG.append("path")
            .datum(d)
            .attr("class", 'data-line')
            .attr("item-id", topNOrder[i])
            .attr("item-order", i)
            .attr("opacity", lineOpacityNormal)
            .style("fill-opacity", areaOpacityNormal)
            .style("fill", colorScale(i))
            .attr("stroke", colorScale(i))
            .attr("stroke-width", 3)
            .attr("d", lineGenerator);

    });

    let innerRadiusAxis = innerRadius - 40;

    let axisLabelLineDomain = angleScale.domain();
    let averageAngles = [];
    for (let i = 0; i < axisLabelLineDomain.length - 1; i++) {
        let startAngle = angleScale(axisLabelLineDomain[i]);
        let endAngle = angleScale(axisLabelLineDomain[i + 1]);
        let avgAngle = (startAngle + endAngle) / 2;
        averageAngles.push(avgAngle);
    }

    // lines separating months
    innerAxisG.selectAll(".axis-month-separator-line")
        .data(averageAngles)
        .enter().append("line")
        .attr("class", "axis-month-separator-line")
        .attr("x1", d => Math.cos(d - Math.PI / 2) * (innerRadiusAxis + 5))
        .attr("y1", d => Math.sin(d - Math.PI / 2) * (innerRadiusAxis + 5))
        .attr("x2", d => Math.cos(d - Math.PI / 2) * (innerRadiusAxis + 25))
        .attr("y2", d => Math.sin(d - Math.PI / 2) * (innerRadiusAxis + 25))
        .attr("stroke", monthSepColor)
        .style("stroke-width", strokeWidthNormal);

    // 3-char month labels
    innerAxisG.selectAll(".axis-month-label")
        .data(angleScale.domain())
        .enter().append("text")
        .attr("class", "axis-label-text")
        .attr("x", d => Math.cos(angleScale(d) - Math.PI / 2) * (innerRadiusAxis + 5))
        .attr("y", d => Math.sin(angleScale(d) - Math.PI / 2) * (innerRadiusAxis + 5))
        .attr("text-anchor", "middle")
        .attr("transform", d => {
            let angle = angleScale(d) * (180 / Math.PI);
            return `rotate(${angle}, ${Math.cos(angleScale(d) - Math.PI / 2) * (innerRadiusAxis + 10)}, ${Math.sin(angleScale(d) - Math.PI / 2) * (innerRadiusAxis + 10)})`;
        })
        .text(d => d3.timeFormat("%b")(new Date(d)).toUpperCase())
        .style("font-size", 12)
        .style("fill", monthTextColor);

    innerCircleG.append("circle")
        .attr("class", "inner-circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", innerRadius)
        .attr("fill", circleColor);
    // adding dropdown menu/text
    await addDivOverInnerCircle(svg, innerRadius, selection)
};

const createLegend = async function (selection, div, colorScale, weeklyData, topNOrder, topNCounts, songArtistData, artistData, genreArtistData) {
    div.selectAll(".legend-item").remove();
    let selectedItemOrder = null;
    Object(topNOrder).forEach((itemId, itemOrder) => {
        div.append("div")
            .attr("class", "legend-item")
            .attr("item-id", itemId)
            .attr("item-order", itemOrder)
            .text(selection === "genres" ? `${itemOrder + 1}. ${titleCase(itemId)}` : `${itemOrder + 1}. ${itemId}`)
            .style("color", colorScale(itemOrder))
            .on("mouseover", function (event, _) {
                if (selectedItemOrder !== null && selectedItemOrder !== itemOrder.toString()) {
                    return;
                }
                d3.selectAll(".legend-item")
                    .transition()
                    .duration(transitionDuration)
                    .style("color", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? colorScale(itemOrder) : "lightgrey";
                    })
                    .style("opacity", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? legendTextOpacitySelected : legendTextOpacityUnselected;
                    })

                d3.selectAll(".data-line")
                    .transition()
                    .duration(transitionDuration)
                    .attr("stroke", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? colorScale(itemOrder) : "grey";
                    })
                    .attr("stroke-width", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? strokeWidthSelected : strokeWidthUnselected;
                    })
                    .style("fill", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? colorScale(itemOrder) : "grey";
                    })
                    .style("fill-opacity", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? areaOpacitySelected : areaOpacityUnselected;
                    })
                    .style("opacity", function () {
                        return d3.select(this)
                            .attr("item-order") === itemOrder.toString()
                            ? lineOpacitySelected : lineOpacityUnselected;
                    })
            })
            .on("mouseout", function (event, _) {
                if (selectedItemOrder !== null) {
                    return;
                }
                d3.selectAll(".legend-item")
                    .transition()
                    .duration(transitionDuration)
                    .style("color", function () {
                        let currentOrder = d3.select(this).attr('item-order');
                        return colorScale(currentOrder);
                    })
                    .style("opacity", legendTextOpacityNormal)

                d3.selectAll(".data-line")
                    .each(function () {
                        let currentOrder = d3.select(this).attr('item-order');
                        d3.select(this)
                            .transition()
                            .duration(transitionDuration)
                            .attr("stroke", colorScale(currentOrder))
                            .attr("stroke-width", strokeWidthNormal)
                            .style("fill", colorScale(currentOrder))
                            .style("fill-opacity", areaOpacityNormal)
                            .style("opacity", lineOpacityNormal)
                    })
            })
            .on("click", function () {
                // if clicking on already selected item
                if (selectedItemOrder === itemOrder.toString()) {
                    selectedItemOrder = null; // deselect
                    d3.selectAll(".data-line")
                        .transition()
                        .duration(transitionDuration)
                        .style("fill-opacity", areaOpacityNormal);

                    d3.selectAll(".legend-item")
                        .transition()
                        .duration(transitionDuration)
                        .style("font-size", legendTextSizeNormal)
                        .style("fill-opacity", legendTextOpacityNormal)
                    removeSummary()
                } else {
                    // set selection and redraw summary, radial, legend
                    selectedItemOrder = itemOrder.toString()
                    createSummaryVisual(itemId, itemOrder, selection, weeklyData, topNOrder, topNCounts, colorScale, songArtistData, artistData, genreArtistData)
                    d3.selectAll(".legend-item")
                        .transition()
                        .duration(transitionDuration)
                        .style("color", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? colorScale(itemOrder) : "lightgrey";
                        })
                        .style("font-size", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? legendTextSizeSelected : legendTextSizeUnselected;
                        })
                        .style("opacity", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? legendTextOpacitySelected : legendTextOpacityUnselected;
                        })

                    d3.selectAll(".data-line")
                        .transition()
                        .duration(transitionDuration)
                        .attr("stroke", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? colorScale(itemOrder) : "grey";
                        })
                        .attr("stroke-width", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? strokeWidthSelected : strokeWidthUnselected;
                        })
                        .style("fill", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? colorScale(itemOrder) : "grey";
                        })
                        .style("fill-opacity", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? areaOpacityClicked : areaOpacityUnselected;
                        })
                        .style("opacity", function () {
                            return d3.select(this)
                                .attr("item-order") === itemOrder.toString()
                                ? lineOpacitySelected : lineOpacityUnselected;
                        })
                }
            })

    })

    d3.select(document)
        .on("click", function (event) {
            if (event.target.closest('.legend-item')) {
                return
            }

            if (event.target.closest('.summary-container')) {
                return
            }

            if (selectedItemOrder !== null) {
                selectedItemOrder = null
            }
            d3.selectAll(".legend-item")
                .transition()
                .duration(transitionDuration)
                .style("color", function () {
                    let currentOrder = d3.select(this).attr('item-order');
                    return colorScale(currentOrder);
                })
                .style("font-size", legendTextSizeNormal)
                .style("opacity", 1)

            d3.selectAll(".data-line")
                .each(function () {
                    let currentOrder = d3.select(this).attr('item-order');
                    d3.select(this)
                        .transition()
                        .duration(transitionDuration)
                        .attr("stroke", colorScale(currentOrder))
                        .attr("stroke-width", strokeWidthNormal)
                        .style("fill", colorScale(currentOrder))
                        .style("fill-opacity", areaOpacityNormal)
                        .style("opacity", lineOpacityNormal)
                })
            removeSummary()
        })
}

const createBarChart = async function (div, svg, subSelection, subSelectionOrder, selection, data, topNOrder, colorScale) {
    let filteredData = data.map(d => ({
        group: d.group,
        value: d[subSelection]
    }));
    let width = svg.attr("width");
    let height = svg.attr("height");
    let margin = {top: 5, bottom: 5, left: 10, right: 0}

    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - margin.top - margin.bottom;

    let cy = margin.top + chartHeight / 2
    let maxValue = d3.max(filteredData, d => d.value);
    let countScale = d3.scaleLinear()
        .domain([1, maxValue])
        .range([5, chartHeight / 2 + 5])
    let weekScale = d3.scaleBand()
        .domain(filteredData.map(d => d.group))
        .range([margin.left, chartWidth + margin.left])
        .padding(.5);
    let weekTimeScale = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.group))
        .rangeRound([margin.left, chartWidth - margin.right])
        .nice()

    let xAxisTicks = d3.axisTop(weekTimeScale)
        .tickFormat(d3.timeFormat("%b"))
        .ticks(4)

    xAxis = svg.append("g")
        .attr("transform", `translate(0, ${chartHeight + margin.top - 6})`)
        .style("color", monthTextColor)
        .style("text-transform", "uppercase")
        .style("font-size", 12)
        .call(xAxisTicks)

    xAxis.select(".domain").style("color", monthSepColor)
    xAxis.selectAll(".tick line").style("color", monthSepColor)

    let barsG = svg.append("g")
        .attr("id", "bars")


    filteredData.forEach(d => {
        let barWidth = weekScale.bandwidth()
        let halfBarVal = countScale(d.value) / 2
        barsG.append("rect")
            .attr("group", d.group)
            .attr("value", d.value)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", weekScale(d.group))
            .attr("original-x", weekScale(d.group))
            .attr("y", cy - halfBarVal)
            .attr("transform", `translate(${margin.left - 10}, 0)`)
            .attr("width", barWidth)
            .attr("original-width", barWidth)
            .attr("original-color", colorScale(subSelectionOrder))
            .style("fill", colorScale(subSelectionOrder))
            .transition()
            .duration(transitionDuration * 2)
            .attr("height", halfBarVal * 2)


        barsG.selectAll("rect")
            .on("mouseover", function () {
                div.selectAll(".tooltip").remove()
                let hoverText = div.append("div")
                    .attr("class", "tooltip")
                let group = new Date(this.getAttribute("group"))
                let value = this.getAttribute("value")

                // let month = d3.utcFormat("%B")(group)
                // let begOfWK = d3.utcFormat("%-d")(group)
                // let endOfWKDate = new Date(group.getDate() + 6)
                // let endOfWK = d3.utcFormat("%-d")(group.getDate() + 6)
                // let hoverDate = d3.timeFormat("%U")(group)
                let hoverDate = d3.utcFormat("%B %-d")(group)

                barsG.selectAll("rect")
                    .transition()
                    .duration(transitionDuration * .75)
                    .style("fill", "grey")
                    .attr("width", barWidth)
                d3.select(this)
                    .transition()
                    .duration(transitionDuration)
                    .style("fill", this.getAttribute("original-color"))
                    .attr("x", this.getAttribute("original-x") - .25 * barWidth)
                    .attr("width", barWidth * 1.5)


                hoverText.append("div")
                    .attr("class", "hover-info group")
                    .text(`Week of ${hoverDate}`)
                    // .text(`Week of: ${month} ${begOfWK}`)

                hoverText.append("div")
                    .attr("class", "hover-info value")
                    .text(`${formatMS(value)}`)
                    .style("opacity", 0)
                    .transition()
                    .duration(transitionDuration)
                    .style("opacity", 1)
            })
            .on("mouseout", function () {
                d3.select(this)
                    .attr("width", barWidth)
                    .attr("x", this.getAttribute("original-x"))

                div.selectAll(".tooltip")
                    .style("opacity", 1)
                    .transition()
                    .duration(transitionDuration)
                    .style("opacity", 0)
                    .remove()
                barsG.selectAll("rect")
                    .transition()
                    .duration(transitionDuration)
                    .attr("width", barWidth)
                    .style("fill", this.getAttribute("original-color"))
            })
    })
}

const createSummaryInfo = async function (div, subSelection, subSelectionOrder, selection, data, topNOrder, topNCount, colorScale, songArtistData, artistData, genreArtistData) {
    let htmlTitle = ""

    if (selection === "artists") {
        let artistName = subSelection
        let artist = artistData[artistName]
        let artistHref = artist['external_urls']['spotify']
        let artistImage = artist["images"][artist["images"].length - 1]
        htmlTitle += ""
            + `<a href='${artistHref}'>`
            + `   <img src='${artistImage['url']}' height='${artistImage['height'] / 2}' width='${artistImage['height'] / 2}' alt='${artistName} on Spotify'>`
            + `</a>`
    }

    htmlTitle += `<div class='summary-info-title' style="color: ${colorScale(subSelectionOrder)}">${titleCase(subSelection)}</div>`

    if (selection === "songs") {
        let artistName = songArtistData[subSelection]
        let artist = artistData[artistName]
        let aHref = artist['external_urls']['spotify']
        htmlTitle += `<div class='summary-info-artist-line' style="color: ${colorScale(subSelectionOrder)}">By `
            + `<a class="custom-link" style="color: ${colorScale(subSelectionOrder)}" href="${aHref}">${titleCase(artistName)}</a>`
            + `</div>`
    }


    let htmlText = "" +
        "<span class='secondary-text'>You listened to </span>" +
        `<span class='primary-text' style="color: ${colorScale(subSelectionOrder)}">${titleCase(subSelection)}</span>` +
        `<span class='secondary-text'> for </span>` +
        `<span class='primary-text2' style="color: ${colorScale(subSelectionOrder)}">${formatMS(topNCount[subSelection])}</span>` +
        `<span class='secondary-text'>.</span>`

    if (selection === "genres") {
        let artists = Object.entries(genreArtistData[subSelection])
            .sort(function (a, b) {
                return a[1] > b[1] ? -1 : 1;
            })
            .slice(0, 5)
        let artistsStr = ""
        artists.forEach(d => {
            let aData = artistData[d[0]]
            let aHref = aData['external_urls']['spotify']

            artistsStr += `<span><a class="custom-link" style="color: #1ED760" href="${aHref}">${d[0]}</a>, </span>`
        })
        artistsStr = artistsStr.slice(0, -9) + "</span>"

        htmlText += "" +
            `<span class='secondary-text'><br><br>Your top 5 artists in ${titleCase(subSelection)} were:<br></span>`
            + `<span class='primary-text2' style="color: lightgrey">${artistsStr}.</span>`
    }

    div.append("div")
        .attr("class", "summary-info-top")
        .html(htmlTitle)
    div.append("div")
        .attr("class", "summary-info-bottom")
        .html(htmlText)

    div.style("margin", "10px")
        .style("border", "5px solid #1ED760")
        .style("color", colorScale(subSelectionOrder))
        .style("opacity", 0)
        .transition()
        .duration(transitionDuration * 2)
        .style("opacity", 1)
        .style("min-height", "100px")

    let height = div.node().getBoundingClientRect().height;
    return height
}
const createSummaryVisual = async function (subSelection, subSelectionOrder, selection, data, topNOrder, topNCounts, colorScale, songArtistData, artistData, genreArtistData) {
    let summaryDiv = d3.select(".summary-container")
    summaryDiv.selectAll("div").remove()

    summaryDiv.append("div")
        .attr("class", "summary-info")
    let height = await createSummaryInfo(summaryDiv.select(".summary-info"), subSelection, subSelectionOrder, selection, data, topNOrder, topNCounts, colorScale, songArtistData, artistData, genreArtistData)

    summaryDiv.append("div")
        .attr("class", "bar-chart-container")
        .html(`<svg width="500" height="${height}" id="summary-bar-chart"></svg>`)

    let svgContainer = d3.select(".bar-chart-container")

    let svg = d3.select("svg#summary-bar-chart")
    await createBarChart(svgContainer, svg, subSelection, subSelectionOrder, selection, data, topNOrder, colorScale)

}

const removeSummary = async function () {
    let summaryDiv = d3.select(".summary-container")
    subDivs = summaryDiv.selectAll("div")

    subDivs
        .style("opacity", 1)
        .transition()
        .duration(transitionDuration * 2)
        .style("opacity", 0)
        .on("end", function () {
            subDivs.remove()
        })
}


// animateInnerCircle()

const requestData = async function () {
    pathStart = "../static/data/daily-data/"
    const genreData = await d3.csv(pathStart + "genre.csv")
    const artistData = await d3.csv(pathStart + "artist.csv")
    const songData = await d3.csv(pathStart + "song.csv")

    const songArtistData = await d3.json("../static/data/songToArtist.json")
    const fullArtistData = await d3.json("../static/data/artistData.json")
    const genreArtistData = await d3.json("../static/data/genreToArtist.json")

    const topN = 5

    const weeklyData = {
        "genres": topNData(aggregateData(genreData, "weekly"), topN),
        "artists": topNData(aggregateData(artistData, "weekly"), topN),
        "songs": topNData(aggregateData(songData, "weekly"), topN)
    }

    const monthlyData = {
        "genres": topNData(aggregateData(genreData, "monthly"), topN),
        "artists": topNData(aggregateData(artistData, "monthly"), topN),
        "songs": topNData(aggregateData(songData, "monthly"), topN)
    }
    const filteredGenreData = {}
    monthlyData['genres'][1].forEach(d => {
            filteredGenreData[d] = genreArtistData[d]
        }
    )

    return [monthlyData, weeklyData, songArtistData, fullArtistData, filteredGenreData];
}

// harmonious colors/colors that pop against black
const colors = [
    '#ffd439',
    '#EB5757',
    '#56CCF2',
    '#FF8C00',
    '#9B51E0'
];

const colorScale = d3.scaleOrdinal()
    .domain([0, 1, 2, 3, 4])
    .range(colors);


const redrawChartAndLegend = async function (selection) {
    const data = await requestData()

    const monthlyData = data[0]
    const weeklyData = data[1]
    let songArtistData = data[2];
    let artistData = data[3];
    let genreArtistData = data[4];

    let radialSvg = d3.select("svg#radial-line-chart");
    let legendDiv = d3.select("div#legend-container");
    await createRadialChart(selection, radialSvg, monthlyData[selection][0], monthlyData[selection][1], colorScale);
    await createLegend(selection, legendDiv, colorScale, weeklyData[selection][0], weeklyData[selection][1], weeklyData[selection][2], songArtistData, artistData, genreArtistData);

}

redrawChartAndLegend("genres")
