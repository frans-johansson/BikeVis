const makeTimelineFocus = (dayData) => {
    let svg = d3.select('#timeline-focus')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 40, bottom: 40, left: 60 })

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
    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(dayData, d => d.sum_count + 10000)])
        .range([height - margin.bottom, margin.top])
    const yRight = d3.scaleLinear()
        .domain([0, d3.max(dayData, d => d.mean_temp + 20)])
        .range([height - margin.bottom, margin.top])

    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
    const yAxisLeft = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yLeft))
    const yAxisRight = g => g
        .attr('transform', `translate(${width - margin.right},0)`)
        .call(d3.axisRight(yRight))

    // Draws the line- and area graphs.
    const line = d3.line()
        .x(d => x(d.timestamp))
        .y(d => yLeft(d.sum_count))
    const tempArea = d3.area()
        .x(d => x(d.timestamp))
        .y1(d => yRight(d.mean_temp))
        .y0(yRight(0))
    svg.append('g')
        .attr("class", "x-axis")
        .call(xAxis);
    svg.append('g')
        .attr("class", "y-axisLeft")
        .call(yAxisLeft);
    svg.append('g')
        .attr("class", "y-axisRight")
        .call(yAxisRight)
    svg.append("path")
        .datum(dayData)
        .attr("clip-path", "url(#clip)")
        .attr("class", "focus-area")
        .attr("fill", "DarkOrange")
        .attr("opacity", .5)
        .attr("d", tempArea);
    svg.append("path")
        .datum(dayData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("clip-path", "url(#clip)")
        .attr("class", "focus-path")
        .attr("d", line)
   
    
    // Draws a invisible dot at each datum in the line graph. Becomes visible and gives details about datum when hovered on.
    const popupDots = svg.append('g')
        .attr('class', 'popup-dots')
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
    const formatTime = d3.timeFormat("%B %d, %Y")
    const popupOrientation = x => {
        if(x > width / 2){
            return x-190
        }
        return x
    }
    popupDots.selectAll('.popupDot')
    .data(dayData)
    .join(
        enter => enter.append('circle')
            .attr('class', 'popupDot')
            .attr('r', 6)
            .attr('cx', d => x(d.timestamp))
            .attr('cy', d => yLeft(d.sum_count))
            .attr('transform', `translate(${0},${2})`)
            .attr('d', d => d)
            .on('mouseover', ({ currentTarget }, d) => {
                d3.select(currentTarget).style('fill', 'steelblue')
                const g = svg.append("g")
                g.append("rect")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value))
                    .attr("y", currentTarget.cy.animVal.value - 78)
                    .attr("width", 190)
                    .attr("height", 78)
                    .attr("rx", 5)
                    .attr("fill", "AliceBlue")
                    .attr("stroke", "black")
                    .attr("id", "popupRect")
                g.append("text")
                    .attr("class", "popupText")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value) + 2)
                    .attr("y", currentTarget.cy.animVal.value - 64)
                    .attr("font-size", "0.9em")
                    .text(`Date: ${formatTime(d.timestamp)}`)
                g.append("text")
                    .attr("class", "popupText")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value) + 2)
                    .attr("y", currentTarget.cy.animVal.value - 49)
                    .attr("font-size", "0.9em")
                    .text(`No. bikes rented: ${d.sum_count}`)
                g.append("text")
                    .attr("class", "popupText")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value) + 2)
                    .attr("y", currentTarget.cy.animVal.value - 34)
                    .attr("font-size", "0.9em")
                    .text(`Mean temperature: ${d.mean_temp.toFixed(2)} °C`)
                g.append("text")
                    .attr("class", "popupText")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value) + 2)
                    .attr("y", currentTarget.cy.animVal.value - 19)
                    .attr("font-size", "0.9em")
                    .text(`Mean humidity: ${d.mean_humidity.toFixed(2)} %rh`)
                g.append("text")
                    .attr("class", "popupText")
                    .attr("x", x => x = popupOrientation(currentTarget.cx.animVal.value) + 2)
                    .attr("y", currentTarget.cy.animVal.value - 4)
                    .attr("font-size", "0.9em")
                    .text(`Mean wind speed: ${d.mean_wind_speed.toFixed()} km/h`)
            })
            .on('mouseout', ({ currentTarget }) => { 
                d3.select(currentTarget).style('fill', 'none')
                d3.select('#popupRect').remove()
                d3.selectAll('.popupText').remove()
            })
    )
    
    
    // Change axes colors
    svg.select('.y-axisLeft')
        .select("path")
        .style("stroke", "steelblue")
    svg.select('.y-axisLeft')
        .selectAll(".tick")
            .select("line")
            .style("stroke", "steelblue")
    svg.select('.y-axisLeft')
        .selectAll(".tick")
            .select("text")
            .style("fill", "steelblue")
        
    svg.select('.y-axisRight')
        .select("path")
        .style("stroke", "DarkOrange")
    svg.select('.y-axisRight')
        .selectAll(".tick")
            .select("line")
            .style("stroke", "DarkOrange")
    svg.select('.y-axisRight')
        .selectAll(".tick")
            .select("text")
            .style("fill", "DarkOrange")

    // Axes labels
    svg.select('.x-axis').append("text")
        .attr("x", width/2)
        .attr("y", margin.bottom - 8)
        .style("font-size", "15px")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Date")
    svg.select('.y-axisLeft').append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height-margin.top-margin.bottom)/2)
        .attr("y", -margin.left + 12)
        .style("font-size", "15px")
        .style("fill", "steelblue")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(" No. bikes rented")
    svg.select('.y-axisRight').append("text")
        .attr("transform", "rotate(90)")
        .attr("x", (height-margin.top-margin.bottom)/2)
        .attr("y", -margin.right + 12)
        .style("font-size", "15px")
        .style("fill", "DarkOrange")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Mean temperature (°C)")


    return ([xMin, xMax]) => {
        x.domain([xMin, xMax])
        svg.select('.focus-path').attr("d", line)
        svg.select('.x-axis').call(xAxis)
        svg.select('.focus-area').attr("d", tempArea)
        svg.selectAll('.popupDot')
            .attr('cx', d => x(d.timestamp))
            .attr('cy', d => yLeft(d.sum_count))
    }
}