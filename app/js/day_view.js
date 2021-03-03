const make_day_view = (data) => {
    const hourOf = d3.timeFormat("%H")
    const hourData = data.map(d => ({ ...d, hour: hourOf(d.timestamp) }))


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

    // TODO: Make the box plot remove old elements when updated

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
            return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, minVertLine: minVertLine, maxVertLine: maxVertLine, minCount: minCount, maxCount: maxCount})
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

    // Function that draws the boxes
    let boxWidth = width/48
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
    
    // The filter object that determines which data that is rendered and is updated by the checkboxes
    let filter = {
        weekday: 1, weekend: 1, holiday: 1,
        clear: 1, cloud1: 2, cloud2: 3, cloud3: 4, rain: 7, thunder: 10, snow: 26
    }

    // Takes a dataset and a filter objects filters the data with the filter. This function can take already filtered data and apply another filter to it.
    const apply_filter = (data, filter) => {
        return data.filter( d => (d.is_weekday == filter.weekday || d.is_weekend == filter.weekend || d.is_holiday == filter.holiday)
                                        && 
                                        (d.weather_code == filter.clear || d.weather_code == filter.cloud1 || d.weather_code == filter.cloud2
                                        || d.weather_code == filter.cloud3 || d.weather_code == filter.rain || d.weather_code == filter.thunder
                                        || d.weather_code == filter.snow))
    }

    // Updates the filter when a checkbox is changed
    d3.selectAll(".filter")
        .on("change", d => {
            
            // d.path[0].id contains the id the pressed checkbox. The id got the same name as the filter element and thus updates the filter
            filter[`${d.path[0].id}`] *= -1
            drawBoxes(compute_summary(apply_filter(filteredData, filter)))
        })
        

    return [
        ([xMin, xMax]) => {
            
            filteredData = hourData.filter(d => xMin <= d.timestamp && d.timestamp <= xMax)
            filteredData = apply_filter(filteredData, filter)

            drawBoxes(compute_summary(filteredData))

            // drawDots(filteredData)
            // console.log(`Update day view with: [${xMin}, ${xMax}]`)
        },
        (filter) => {
            console.log(`Update day filter with: ${filter}`)
        }
    ]
}