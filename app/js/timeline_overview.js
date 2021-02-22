const make_timeline_overview = (clean_data, day_data, week_data) => {
    
    console.log(week_data)

    let svg = d3.select('#timeline-overview')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    const x = d3.scaleTime()
        .domain(d3.extent(week_data, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(week_data, d => d.sum_count)])
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
        .call(xAxis);
    svg.append('g')
        .call(yAxis);
    svg.append("path")
        .datum(week_data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
}