const makeTimelineFocus = (week_data, dayData) => {
    let svg = d3.select('#timeline-focus')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.right - margin.left)
        .attr("height", height - margin.bottom - margin.top);

    let x = d3.scaleTime()
        .domain(d3.extent(dayData, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(dayData, d => d.sum_count + 10000)])
        .range([height - margin.bottom, margin.top])

    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
    const yAxis = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))

    const line = d3.line()
        .x(d => x(d.timestamp))
        .y(d => y(d.sum_count))

    svg.append('g')
        .attr("class", "x-axis")
        .call(xAxis);
    svg.append('g')
        .attr("class", "y-axis")
        .call(yAxis);
    svg.append("path")
        .datum(dayData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("clip-path", "url(#clip)")
        .attr("class", "focus-path")
        .attr("d", line);

    return ([xMin, xMax]) => {
        x.domain([xMin, xMax])
        y.domain([0, d3.max(dayData, d => xMin <= d.timestamp && d.timestamp <= xMax ? d.sum_count + 10000 : null)])
        svg.select('.focus-path').attr("d", line)
        svg.select('.x-axis').call(xAxis)
        svg.select('.y-axis').call(yAxis)
    }
}