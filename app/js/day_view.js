const makeDayView = (data) => {
    const hourOf = d3.timeFormat("%H")
    const hourData = data.map(d => ({ ...d, hour: hourOf(d.timestamp) }))
    let focusedData = []

    
    // SVG element handle for the box plot view
    let svg = d3.select('#day-view')
        .append('svg')

    // Sizing parameters
    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    const x = d3.scaleBand()
        .domain(hourData.map(d => d.hour))
        .rangeRound([margin.left, width - margin.right])
        .paddingInner(1)
        .paddingOuter(.5)

    const y = d3.scaleLinear()
        .domain([0, d3.max(hourData, d => d.count)])
        .range([height - margin.bottom, margin.top])

    const op = d3.scaleLinear()
        .domain([0, hourData.length])
        .range([0.2, 0.05])

    // Axes
    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))

    const yAxis = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))

    svg.append('g')
        .call(xAxis);
    svg.append('g')
        .call(yAxis);
    
    // Attatch the weather bar
    weatherBar = d3.select('#weather-bar')
        .append('svg')
        .append('g')

    const weatherColor = d3.scaleOrdinal()
        .domain(hourData.map(d => d.weather_code))
        .range(d3.schemeCategory10)

    const weatherX = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.left, width - margin.right])

    // Drawing the weather bar
    const drawWeatherBar = (data) => {
        const weatherTransition = d3.transition()
            .duration(100)
            .ease(d3.easeLinear)

        weatherBar.selectAll('rect').data(data, d => d.weather_code)
            .join(
                enter => enter.append('rect')
                    .attr('fill', d => weatherColor(d.weather_code))
                    .attr('y', 0.5)
                    .attr('height', 20)
                    .call(enter => enter.interrupt().transition(weatherTransition)
                        .attr('width', d => weatherX(d.endValue) - weatherX(d.startValue))
                        .attr('x', d => weatherX(d.startValue))
                    ),
                update => update.call(
                    update => update.interrupt().transition(weatherTransition)
                        .attr('x', d => weatherX(d.startValue))
                        .attr('width', d => weatherX(d.endValue) - weatherX(d.startValue)),
                ),
                exit => exit.remove()
            )
    }

    const computeWeatherStacks = (data) => {
        const weather_counts = d3.sort(
                        d3.rollups(data, v => v.length, d => d.weather_code),
                        (a, b) => d3.descending(a[1], b[1])
                    )

        // Neat snippet from https://observablehq.com/@d3/single-stack-normalized-horizontal-bar-chart
        const total = d3.sum(weather_counts, d => d[1]);
        let value = 0;
        return d3.sort(weather_counts.map(d => ({
            weather_code: d[0],
            percentage: d[1] / total,
            startValue: value / total,
            endValue: (value += d[1]) / total
        })));
    }

    // Drawing the box plots
    const boxWidth = width/48
    
    const drawBoxes = (data) => {
        // Vertical line
        svg.selectAll(".vertLine")
        .data(data)
        .join(
            enter => enter.append("line")
                            .attr("class", "vertLine")
                            .attr("x1", d => {return(x(d[0]))})
                            .attr("x2", d => {return(x(d[0]))})
                            .attr("y1", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
                            .attr("y2", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
                            .attr("stroke", "black"),
            update => update.attr("y1", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
                            .attr("y2", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
        )

        // The box
        svg.selectAll(".box")
        .data(data)
        .join(
            enter => enter.append("rect")
                            .attr("class", "box")
                            .attr("x", d => {return(x(d[0])-boxWidth/2)})
                            .attr("y", d => {return(y(d[1].q3))})
                            .attr("height", d => {return(y(d[1].q1)-y(d[1].q3))})
                            .attr("width", boxWidth )
                            .attr("stroke", "black")
                            .style("fill", "#69b3a2"),
            update => update.attr("y", d => {return(y(d[1].q3))})
                            .attr("height", d => {return(y(d[1].q1)-y(d[1].q3))})
        )

        // Horizontal lines
        svg.selectAll(".minLine")
        .data(data)
        .join(
            enter => enter.append("line")
                            .attr("class", "minLine")
                            .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                            .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                            .attr("y1", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
                            .attr("y2", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
                            .attr("stroke", "black"),
            update => update.attr("y1", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
                            .attr("y2", d => {
                                if(d[1].minCount > d[1].minVertLine){
                                    return y(d[1].minCount)
                                }
                                return(y(d[1].minVertLine))})
        )
        
        svg.selectAll(".medianLine")
        .data(data)
        .join(
            enter => enter.append("line")
                            .attr("class", "medianLine")
                            .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                            .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                            .attr("y1", d => {return(y(d[1].median))})
                            .attr("y2", d => {return(y(d[1].median))})
                            .attr("stroke", "black"),
            update => update.attr("y1", d => {return(y(d[1].median))})
                            .attr("y2", d => {return(y(d[1].median))})
        )

        svg.selectAll(".maxLine")
        .data(data)
        .join(
            enter => enter.append("line")
                            .attr("class", "maxLine")
                            .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                            .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                            .attr("y1", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
                            .attr("y2", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
                            .attr("stroke", "black"),
            update => update.attr("y1", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
                            .attr("y2", d => {
                                if(d[1].maxCount < d[1].maxVertLine){
                                    return y(d[1].maxCount)
                                }
                                return(y(d[1].maxVertLine))})
        )
    }

    // Drawing outliers as dots
    const dots = svg.append("g")
        .attr("fill", "red")
        .attr("pointer-events", "all")

    const drawOutliers = data => {
        
        // console.log(data)
        dots.selectAll(".outlier")
            .data(data)
            .join(
                enter => enter.append("circle")
                            .attr("class", "outlier")
                            .attr("opacity", `${op(data.length)}`)
                            .attr("r", 3.5)
                            .attr("cx", d => x(d.hour))
                            .attr("cy", d => y(d.count)),
                update => update.attr("opacity", `${op(data.length)}`),
                exit => exit.remove()
            )
        
    }
    
    // Compute the data needed for the box plot
    const computeSummary = (data) => {
        return d3.rollups(data, v => {
            q1 = d3.quantile(v.map( h => { return h.count}).sort(d3.ascending),.25)
            median = d3.quantile(v.map( h => { return h.count}).sort(d3.ascending),.5)
            q3 = d3.quantile(v.map( h => { return h.count}).sort(d3.ascending),.75)
            interQuantileRange = q3 - q1
            minVertLine = q1 - 1.5 * interQuantileRange
            maxVertLine = q3 + 1.5 * interQuantileRange
            minCount = d3.min(v.map( h => { return h.count}))
            maxCount = d3.max(v.map( h => { return h.count}))
            outliers = []
            
            if(minCount < minVertLine || maxCount > maxVertLine){
                outliers = v.filter( d => d.count < minVertLine || d.count > maxVertLine)
            }
            
            return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, minVertLine: minVertLine,
                    maxVertLine: maxVertLine, minCount: minCount, maxCount: maxCount, outliers: outliers})
            }, d => d.hour).sort(d3.ascending)
    }
    
    // Convenience object for translating checkbox ID's to weather codes
    const toWeatherCode = {
        clear: 1, cloud1: 2, cloud2: 3, cloud3: 4, rain: 7, thunder: 10, snow: 26
    }

    // Takes a dataset and a filter objects filters the data with the filter. This function can take already filtered data and apply another filter to it.
    const applyFilter = (data) => {
        const weatherBoxes = d3.selectAll('.weather').nodes()
        const weathers = weatherBoxes.filter(w => w.checked).map(w => toWeatherCode[w.id])

        const dayPropBoxes = d3.selectAll('.dayProp').nodes()
        const dayProps = dayPropBoxes.map(d => d.checked)

        return data.filter(d => weathers.includes(d.weather_code) &&
                                ((d.is_holiday  && dayProps[2])   ||
                                 (d.is_weekend  && dayProps[1])   ||
                                 (!d.is_weekend && dayProps[0])))
    }


    // Updates all visualizations with potentially new filters
    const update = () => {
        const filteredData = applyFilter(focusedData)
        const summary = computeSummary(filteredData)
        drawBoxes(summary)
        drawOutliers(summary.map( d => d[1].outliers).reduce( (acc, curr) => acc.concat(curr)))
        drawWeatherBar(computeWeatherStacks(filteredData))
    }

    // Updates the filter when a checkbox is changed
    d3.selectAll(".filter")
        .on("change", update)
        
    // Return a function that accepts a brushed date range from the overview
    return ([xMin, xMax]) => {
            // Filter the hourly data to the brushed date range
            focusedData = hourData.filter(d => xMin <= d.timestamp && d.timestamp <= xMax)
            update()
        }
}