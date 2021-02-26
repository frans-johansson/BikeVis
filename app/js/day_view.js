const make_day_view = (data) => {
    const hourOf = d3.timeFormat("%H")
    const hourData = data.map(d => ({ ...d, hour: hourOf(d.timestamp) }))


    // TODO: Make filter_data() return an array of objects that contains the days that are specified in the filter
    // Right now it doesn't apply any filter
    // let filtered_data = apply_filter(data, filter)

    // Takes any array of objects and groups it by hour of the day.
    // Returns an array of 24 objects that each contains a timestamp and the mean count for that hour.
    // let mean_data = mean_hourly_data(filtered_data)

    let svg = d3.select('#day-view')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    const x = d3.scalePoint()
        .domain(hourData.map(d => d.hour))
        .rangeRound([margin.left, width - margin.right])
        .padding(1)
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

    const dots = svg.append("g")
        .attr("fill", "steelblue")
        .attr("pointer-events", "all")
            
    const drawDots = (data) => {
        dots.selectAll("circle")
            .data(data, (d) => d.timestamp)
            .join(
                enter => enter.append('circle')
                            .attr("opacity", `${op(data.length)}`)
                            .attr("r", 3.5)
                            .attr("cx", d => x(d.hour))
                            .attr("cy", d => y(d.count)),
                update => update.attr("opacity", `${op(data.length)}`),
                exit => exit.remove()
            )
    }
    drawDots(hourData)

    // const line = d3.line()
    //     .x(d => x(d.timestamp))
    //     .y(d => y(d.count))  

    // svg.append('g')
    //     .call(xAxis);
    // svg.append('g')
    //     .call(yAxis);
    // svg.append("path")
    //     .datum(data)
    //     .attr("fill", "none")
    //     .attr("stroke", "steelblue")
    //     .attr("stroke-width", 1.5)
    //     .attr("stroke-linejoin", "round")
    //     .attr("stroke-linecap", "round")
    //     .attr("d", line);

    return [
        ([xMin, xMax]) => {
            filteredData = hourData.filter(d => xMin <= d.timestamp && d.timestamp <= xMax)
            drawDots(filteredData)
            // console.log(`Update day view with: [${xMin}, ${xMax}]`)
        },
        (filter) => {
            console.log(`Update day filter with: ${filter}`)
        }
    ]
}

const apply_filter = (data) => {

    let filtered_data = data
    return filtered_data
}

const mean_hourly_data = (filtered_data) => {

    const format_hour = d3.timeFormat("%H")
    // let mean_data = []
    let grouped_data = d3.group(filtered_data, d => format_hour(d.timestamp))

    console.log(grouped_data)

    // grouped_data.forEach((hour_array, i) => {

    //     let temp = {
    //         timestamp: format_hour(hour_array[0].timestamp),
    //         count: 0
    //     }
    //     Object.values(hour_array).forEach( d => {

    //         temp.count = temp.count + d.count
    //     })
    //     temp.count = Math.round(temp.count / hour_array.length)
    //     mean_data[+i] = temp
    // })
    // return mean_data
}