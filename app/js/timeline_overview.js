const makeTimelineOverview = (aggData, brushed) => {
    let svg = d3.select('#timeline-overview')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 30, left: 20 })

    const x = d3.scaleTime()
        .domain(d3.extent(aggData, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggData, d => d.sum_count)])
        .range([height - margin.bottom, margin.top])

    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
    // const yAxis = g => g
    //     .attr('transform', `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(y))

    const line = d3.line()
        .x(d => x(d.timestamp))
        .y(d => y(d.sum_count))

    svg.append('g')
        .call(xAxis);
    // svg.append('g')
    //     .call(yAxis);
    svg.append("path")
        .datum(aggData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);

    const brush = d3.brushX()
        .extent([[margin.left, margin.top - 0.5], [width - margin.right, height - margin.bottom]])
        .on('brush', ({ selection }) => {
            let s = selection || x
            brushed(s.map(x.invert, x))
        })

    const brushSelection = svg.append('g')
        .call(brush)
        .call(brush.move, x.range())

    // Handle outlier notifications
    const outlierNotifications = svg.append('g')
        .attr('class', 'outlier-notifications')
        .attr('fill', 'red')
        .attr('pointer-events', 'all')
        .attr('transform', `translate(0,${height - margin.bottom})`)

    const drawOutlierNotifications = (threshold) => {
        const outliers = aggData.filter(d => d.pearson < threshold)
        outlierNotifications.selectAll('circle').data(outliers)
            .join(
                enter => enter.append('circle')
                    .attr('class', 'outlierDot')
                    .attr('r', 4)
                    .attr('cx', d => x(d.timestamp))
                    .attr('cy', 0)
                    .on('mouseover', ({ currentTarget }) => {
                        // I like hover effects :)
                        d3.select(currentTarget).attr('r', 8)
                    })
                    .on('mouseout', ({ currentTarget }) => {
                        // Not sure if this is the cleanest way of doing it,
                        // but the hover effect has to be reset 
                        d3.select(currentTarget).attr('r', 4)
                    })
                    .on('click', (e, d) => {
                        // Set the brush range on click
                        let startOfWeek = d.timestamp
                        let endOfWeek = new Date(startOfWeek)
                        endOfWeek.setDate(startOfWeek.getDate() + 7)
                        brushSelection.call(brush.move, [x(startOfWeek), x(endOfWeek)])
                    })
            )
    }
    // DOM handle for slider
    const outlierSlider = d3.select('#outlier-sensitivity')
    // Initial draw
    drawOutlierNotifications(outlierSlider.node().value)
    // Redraw on input change
    outlierSlider
        .on('input', ({ target }) => drawOutlierNotifications(target.value))
}