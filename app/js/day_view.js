const make_day_view = (data) => {
    const hourOf = d3.timeFormat("%H")
    const hourData = data.map(d => ({ ...d, hour: hourOf(d.timestamp) }))
    let focusedData = []

    // ******************* OLD CODE WITH DOTS *********************

    // Takes any array of objects and groups it by hour of the day.
    // Returns an array of 24 objects that each contains a timestamp and the mean count for that hour.

    // let svg = d3.select('#day-view')
    //     .append('svg')

    // const { width, height } = svg.node().getBoundingClientRect()
    // const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    // const x = d3.scalePoint()
    //     .domain(hourData.map(d => d.hour))
    //     .rangeRound([margin.left, width - margin.right])
    //     .padding(1)
    // const y = d3.scaleLinear()
    //     .domain([0, d3.max(hourData, d => d.count)])
    //     .range([height - margin.bottom, margin.top])
    // const op = d3.scaleLinear()
    //     .domain([0, hourData.length])
    //     .range([0.2, 0.05])

    // const xAxis = g => g
    //     .attr('transform', `translate(0,${height - margin.bottom})`)
    //     .call(d3.axisBottom(x))
    // const yAxis = g => g
    //     .attr('transform', `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(y))

    // svg.append('g')
    //     .call(xAxis);
    // svg.append('g')
    //     .call(yAxis);

    // const dots = svg.append("g")
    //     .attr("fill", "steelblue")
    //     .attr("pointer-events", "all")
            
    // const drawDots = (data) => {
    //     dots.selectAll("circle")
    //         .data(data, (d) => d.timestamp)
    //         .join(
    //             enter => enter.append('circle')
    //                         .attr("opacity", `${op(data.length)}`)
    //                         .attr("r", 3.5)
    //                         .attr("cx", d => x(d.hour))
    //                         .attr("cy", d => y(d.count)),
    //             update => update.attr("opacity", `${op(data.length)}`),
    //             exit => exit.remove()
    //         )
    // }
    // ***************************************************************

    // Compute the data needed for the box plot
    const compute_summary = (data) => {
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
    
    // Axis
    let svg = d3.select('#day-view')
        .append('svg')

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

    // Function for drawing the weather bar
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

    // Function that draws the boxes
    let boxWidth = width/48
    const draw_boxes = (data) => {
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

    // Function that draws the outliers as dots
    const dots = svg.append("g")
        .attr("fill", "red")
        .attr("pointer-events", "all")

    const draw_outliers = data => {
        
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
    
    // The filter object that determines which data that is rendered and is updated by the checkboxes
    let filter = {
        weekday: 1, weekend: 1, holiday: 1,
        clear: 1, cloud1: 2, cloud2: 3, cloud3: 4, rain: 7, thunder: 10, snow: 26
    }
    const toWeatherCode = {
        clear: 1, cloud1: 2, cloud2: 3, cloud3: 4, rain: 7, thunder: 10, snow: 26
    }
    // let summary = []
    // let focusedData = []

    // Takes a dataset and a filter objects filters the data with the filter. This function can take already filtered data and apply another filter to it.
    const apply_filter = (data) => {
        const weatherBoxes = d3.selectAll('.weather').nodes()
        const weathers = weatherBoxes.filter(w => w.checked).map(w => toWeatherCode[w.id])

        const dayPropBoxes = d3.selectAll('.dayProp').nodes()
        const dayProps = dayPropBoxes.map(d => d.checked)

        console.log(dayProps)
        console.log(`Holiday: ${data[0].is_holiday  && dayProps[0]}`)
        console.log(`Weekend: ${data[0].is_weekend  && dayProps[1]}`)
        console.log(`Weekday: ${!data[0].is_weekend && dayProps[2]}`)
        // console.log(data[0])
        // console.log(weathers)
        // console.log(`Check if includes works: ${weathers.includes(data[0].weather_code)}`)
        // weathers.includes(d.weather_code)

        return data.filter(d => weathers.includes(d.weather_code)    &&
                                ((d.is_holiday  && dayProps[2]) ||
                                 (d.is_weekend  && dayProps[1]) ||
                                 (!d.is_weekend && dayProps[0])))

        // return data.filter( d => (d.is_weekend != filter.weekend || do.is_weekend == filter.weekend || d.is_holiday == filter.holiday)
        //                                 && 
        //                                 (d.weather_code == filter.clear || d.weather_code == filter.cloud1 || d.weather_code == filter.cloud2
        //                                 || d.weather_code == filter.cloud3 || d.weather_code == filter.rain || d.weather_code == filter.thunder
        //                                 || d.weather_code == filter.snow))
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

    // Updates the filter when a checkbox is changed
    d3.selectAll(".filter")
        .on("change", e => {
            // console.log(e)
            const filteredData = apply_filter(focusedData)

            // checked.each((arg) => console.log())
            // d.path[0].id contains the id the pressed checkbox. The id got the same name as the filter element and thus updates the filter
            // filter[`${d.path[0].id}`] *= -1
            const summary = compute_summary(filteredData)
            draw_boxes(summary)
            draw_outliers(summary.map( d => d[1].outliers).reduce( (acc, curr) => acc.concat(curr)))
            drawWeatherBar(computeWeatherStacks(filteredData))
        })
    

        

    return [
        ([xMin, xMax]) => {
            
            focusedData = hourData.filter(d => xMin <= d.timestamp && d.timestamp <= xMax)

            const filteredData = apply_filter(focusedData)
            const summary = compute_summary(filteredData)
            draw_boxes(summary)
            draw_outliers(summary.map( d => d[1].outliers).reduce((acc, curr) => acc.concat(curr)))
            drawWeatherBar(computeWeatherStacks(filteredData))

            // drawDots(focusedData)
            // console.log(`Update day view with: [${xMin}, ${xMax}]`)
        },
        (filter) => {
            console.log(`Update day filter with: ${filter}`)
        }
    ]
}