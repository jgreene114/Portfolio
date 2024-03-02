const monthlyBarChart = function (svg, data, countColumn, yLim, yAxisLabel,
                                  barColorScale = "#000000",
                                  xAxisTextColor = "#000000",
                                  xTicks = 10,
                                  yAxisTickFormat = d3.format('.0f'),
                                  marginLeft= 60) {
    let width = svg.attr("width");
    let height = svg.attr("height");
    let margin = {top: 10, bottom: 70, left: marginLeft, right: 10}

    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - margin.top - margin.bottom;

    let countScale = d3.scaleLinear()
        .domain([0, yLim]) // d3.max(data, d => +d.Count)]) // Max # of trees in a single month (aggregate)
        .range([chartHeight + margin.top, margin.top]);
    let monthScale = d3.scaleBand()
        .domain(data.map(d => d['Month'])) // 12 months
        .range([0, chartWidth])
        .padding(.1);

    // let leftAxis = d3.axisLeft(countScale)
    let leftGridlines = d3.axisLeft(countScale)
        .ticks(xTicks)
        .tickSize(-chartWidth)
        .tickFormat(yAxisTickFormat === "degrees" ? (d => `${d}°`) : d3.format(','))

    svg.append("g")
        .attr("class", "y gridlines")
        .attr("transform", `translate(${margin.left - 10}, 0)`)
        .style("color", "#969696")
        .call(leftGridlines)

    data.forEach(d => {
        svg.append("rect")
            .attr("x", monthScale(d['Month']))
            .attr("y", countScale(d[countColumn]))
            .attr("transform", `translate(${margin.left - 10}, 0)`)
            .attr("width", monthScale.bandwidth())
            .attr("height", countScale(0) - countScale(d[countColumn]))
            .style("fill", typeof barColorScale === 'function' ? barColorScale(d[countColumn]) : barColorScale);

        // adding x axis ticks (months)
        let centerX = monthScale(d['Month']) + monthScale.bandwidth() / 2
        let y = countScale(0) + 5
        svg.append("text")
            .attr("x", 0) // position label at center of bar
            .attr("y", 0) // position label underneath bar
            .attr("transform", `translate(${margin.left - 10 + centerX}, ${y}) rotate(-90)`)
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "end")
            .style("fill", xAxisTextColor)
            .style("font-weight", "bold")
            .style("font-size", 12)
            .text(d['Month'])

    })

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 3)
        .attr("x", 0 - (chartHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", ".8em")
        .text(yAxisLabel)

}

const requestData = async function () {
    const monthlyTrees = await d3.csv("data/Monthly_Street_Tree_Counts-2022-01-30_FILTERED.csv");
    const monthlyWeather = await d3.csv("data/SF_weather_data.csv");

    let treeSvg = d3.select("svg#tree-bar-chart");
    let tempSvg = d3.select("svg#temperature-bar-chart");
    let rainSvg = d3.select("svg#precipitation-bar-chart");

    // temperature colorscale from blue (cold) to red (hot)
    let tempColorScale = d3.scaleLinear()
        .domain(d3.extent(monthlyWeather, d => d['Mean Avg Temperature Normal (°F)']))
        .range(['#0012bb', '#e80000'])

    // rain colorscale from light blue (less rain) to dark blue (more rain)
    let rainColorScale = d3.scaleLinear()
        .domain(d3.extent(monthlyWeather, d => d['Total Precipitation Normal (inches)']))
        .range(['#cddbff', '#000f86'])

    // tree count colorscale from light green (few trees) to dark green (many trees)
    let treeColorScale = d3.scaleLinear()
        .domain(d3.extent(monthlyTrees, d => +d['Count']))
        .range(['#89a689', '#205d20', '#0f440f'])


    monthlyBarChart(treeSvg, monthlyTrees, 'Count', 2000, "Trees Planted", treeColorScale, "#572a0e")
    monthlyBarChart(tempSvg, monthlyWeather, 'Mean Avg Temperature Normal (°F)', 65, "Degrees (&deg;F)", tempColorScale, null, null, "degrees", 50)
    monthlyBarChart(rainSvg, monthlyWeather, 'Total Precipitation Normal (inches)', 5, "Precipitation (Inches)", rainColorScale, null, 5, null, 45)

}

requestData()