const makeTimelineOverview = (aggData, brushed) => {
    let svg = d3.select('#timeline-overview')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 15, right: 20, bottom: 20, left: 20 })

    const x = d3.scaleTime()
        .domain(d3.extent(aggData, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggData, d => d.sum_count)])
        .range([height - margin.bottom, margin.top])
    const yTemp = d3.scaleLinear()
        .domain([0, d3.max(aggData, d => d.mean_temp + 20)])
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

    const tempArea = d3.area()
        .x(d => x(d.timestamp))
        .y1(d => yTemp(d.mean_temp))
        .y0(yTemp(0))

    svg.append('g')
        .call(xAxis);

    svg.append("path")
        .datum(aggData)
        .attr("class", "focus-area")
        .attr("fill", "DarkOrange")
        .attr("opacity", "0.5")
        .attr("d", tempArea);

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
            // Move focused text
            d3.selectAll('.focus-text')
                .attr('text-anchor', 'center')
                .attr('x', selection[0] + 10)
            brushed(s.map(x.invert, x))
        })

    const brushSelection = svg.append('g')
        .call(brush)
        .call(brush.move, x.range())
    
    svg.append('text')
        .attr('class', 'focus-text')
        .attr('x', margin.left + 10)
        .attr('y', 10)
        .attr('text-anchor', 'center')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', 'steelblue')
        .text('Focus')
    
    d3.selectAll('.selection')
        .attr('fill', 'steelblue')
        .attr('opacity', "0.8")
        .attr('rx', 5)

    // Handle outlier notifications
    const outlierNotifications = svg.append('g')
        .attr('class', 'outlier-notifications')
        .attr('fill', 'tomato')
        .attr('pointer-events', 'all')
        .attr('transform', `translate(0,${height - margin.bottom})`)

    const drawOutlierNotifications = (threshold) => {
        const outliers = aggData.filter(d => d.pearson < threshold)
        outlierNotifications.selectAll('circle').data(outliers, d => d.timestamp)
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
    // const outlierSlider = d3.select('#outlier-sensitivity')
    const outlierSlider = d3.sliderHorizontal()
        .width(250)
        .ticks(10)
        .domain([0, 10])
        .value(6)
        .step(1)
        .fill('tomato')

    d3.select('#outlier-wrapper').append('svg').style('display', 'inline-block').style('width', 'unset')
        .append('g').attr('transform', 'translate(10, 10)')
        .call(outlierSlider)

    // Initial draw
    drawOutlierNotifications(outlierSlider.value())
    // Redraw on input change
    outlierSlider
        .on('onchange', (value) => drawOutlierNotifications(value))
}