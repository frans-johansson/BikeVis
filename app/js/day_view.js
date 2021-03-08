const makeDayView = (data) => {
    const hourOf = d3.timeFormat("%H")
    const hourData = data.map(d => ({ ...d, hour: hourOf(d.timestamp) }))
    let focusedData = []

    
    // SVG element handle for the box plot view
    let svg = d3.select('#day-view')
        .append('svg')
        .lower()

    // Sizing parameters
    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 10, right: 50, bottom: 45, left: 40 })

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

    // Axis
    const xAxis = g => g
        .attr("class", "x-axis")   
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))

    const yAxis = g => g
        .attr("class", "y-axis")
        .attr('transform', `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y))

    svg.append('g')
        .call(xAxis);
    svg.append('g')
        .call(yAxis);

    // Axis label
    svg.select('.x-axis').append("text")
        .attr("x", width/2)
        .attr("y", margin.bottom - 5)
        .style("font-size", "15px")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .text("Timestamp (h)")
    svg.select('.y-axis').append("text")
        .attr("transform", "rotate(90)")
        .attr("x", (height-margin.top-margin.bottom)/2)
        .attr("y", -margin.right + 10)
        .style("font-size", "15px")
        .style("fill", "black")
        .style("text-anchor", "middle")
        .text(" No. bikes rented")
    
    // Attatch the weather bar
    const weatherSvg = d3.select('#weather-bar').append('svg')
    const weatherColor = d3.scaleOrdinal()
        .domain(hourData.map(d => d.weather_code))
        .range(d3.schemeSet2.slice(1))

    const weatherX = d3.scaleLinear()
        .domain([0, 1])
        .range([5, width-margin.right-margin.left-120])
    
    formatPercent = weatherX.tickFormat(null, "%")

    const computeWeatherStacks = (data) => {
        const weather_counts = d3.rollups(data, v => v.length, d => d.weather_code)
        
        return weather_counts.map(d => ({
            weather_code: d[0],
            value: d[1]
        }))
    }
    
    // Initializer function for the weather bar groups
    const initWeatherBars = (selection) => {
        selection
            .classed('weather checked', true)
            .attr('id', d => d.weather_code)
            .attr('fill', (d, i, nodes) => {
                if (nodes[i].classList.contains('solo')) {
                    return weatherColor(d.weather_code)
                } else {
                    return 'steelblue'
                }
            })
            // .attr('transform', d => `translate(${margin.left}, ${weatherY(d.weather_code)})`)
            .attr("font-family", "sans-serif")
            .attr("font-size", 12)
            .on('click', ({currentTarget}) => {
                // Toggle the checked class on the target
                const clicked = d3.select(currentTarget) 
                const status = clicked.classed('checked')
                clicked.classed('checked', !status)
                clicked.classed('solo', false)
                // Update visualizations
                update()
            })
    }

    // Initialize the bar groups to make sure the initial filtering works
    // Solving the chicken and egg problem
    weatherSvg.selectAll('.weather')
        .data(computeWeatherStacks(hourData))
        .join('g').call(initWeatherBars)

    // New weather bar
    const drawWeatherBar = (stacks, weatherFilter) => {
        const { height } = weatherSvg.node().getBoundingClientRect()

        let filteredStacks = d3.sort(stacks.map(s => {
            if (weatherFilter(s))
                return s
            else
                return {...s, value: 0}
        }), (a, b) => d3.descending(a.value, b.value))
        const total = d3.sum(filteredStacks, s => s.value)
        filteredStacks = filteredStacks.map(s => ({...s, percentage: s.value/total}))

        // Convenience object for translating ID's to weather names
        const weatherNames = {
            1: "Clear sky",
            2: "Few clouds",
            3: "Shifting clouds",
            4: "Cloudy",
            7: "Rain",
            10: "Thunder",
            26: "Snow"
        }

        // Scale to position bars along the vertical
        const weatherY = d3.scaleBand()
            .domain(filteredStacks.map(s => s.weather_code))
            .rangeRound([0, height])
            .paddingInner(1)
            .paddingOuter(.5)

        // Transitions are neato
        const transition = d3.transition()
            .duration(200)
            .ease(d3.easeLinear)
        
        let bars = weatherSvg.selectAll('.weather')
            .data(filteredStacks, d => d.weather_code)
            .join(
                enter => enter.append('g')
                    .call(initWeatherBars)
                    .call(enter => enter.transition(transition)
                        .attr('transform', d => `translate(${margin.left}, ${weatherY(d.weather_code)})`)
                    ),
                update => update
                    .attr('id', d => d.weather_code)
                    .call(update => update.transition(transition)
                        .attr('transform', d => `translate(${margin.left}, ${weatherY(d.weather_code)})`)
                        .attr('opacity', (d, i, nodes) => {
                            if (nodes[i].classList.contains('checked')) {
                                return '1.0'
                            } else {
                                return '0.5'
                            }
                        })
                        .attr('fill', (d, i, nodes) => {
                            if (nodes[i].classList.contains('solo')) {
                                return weatherColor(d.weather_code)
                            } else {
                                return 'steelblue'
                            }
                        })
                    ),
                exit => exit.remove()
            )

        bars.selectAll('rect')
            .data(d => [d.percentage])
            .join('rect')
                .attr('x', 80)
                .attr('height', 15)
                .transition(transition)
                .attr('width', d => weatherX(d))

        bars.selectAll('.percent')
            .data(d => [d.percentage])
            .join('text')
                .attr('class', 'percent')
                .attr('fill', 'black')
                .attr("y", 3 + 15/2)
                .text(d => d != 0 ? (d > 0.01 ? formatPercent(d) : '<1%') : '')
                .transition(transition)
                .attr("x", d => 85 + weatherX(d))

        bars.selectAll('.weather-label')
            .data(d => [d.weather_code])
            .join('text')
                .attr('class', 'weather-label')
                .attr('fill', 'black')
                .attr('text-anchor', 'end')
                .attr("x", 70)
                .attr("y", 3 + 15/2)
                .text(d => weatherNames[d])
        
        bars.selectAll('.solo-toggle')
            .data(d => [d])
            .join('circle')
                .attr('cy', 5)
                .attr('r', 5)
                .attr('cx', -margin.left+8)
                .attr('class', 'solo-toggle')
                .on('click', (e) => {
                    e.stopPropagation()
                    let parent = d3.select(e.currentTarget.parentNode)
                    if (!parent.classed('checked'))
                        return
                    const status = parent.classed('solo')
                    parent.classed('solo', !status)
                    update()
                })
                .on('mouseover', ({currentTarget}) => {
                    d3.select(currentTarget).attr('r', 8)
                })
                .on('mouseout', ({currentTarget}) => {
                    d3.select(currentTarget).attr('r', 5)
                })
    }

    // Drawing the box plots
    const defaultWidth = 1.5*width/48
    
    const drawBoxes = (data) => {
        const boxWidth = defaultWidth / data.length

        const transitionLength = 150
        const transition = d3.transition()
            .duration(transitionLength)
            .ease(d3.easeLinear)
        const stagger = (d, i) => (i+1)*transitionLength/24

        // Groups for each summary
        const g = svg.selectAll('.summary-group')
            .data(data, d => d.id)
            .join('g')
                .attr('class', 'summary-group')
                .style("fill", (d) => {
                    if (d.id === 'combined') {
                        return 'steelblue'
                    } else {
                        return weatherColor(d.id)
                    }
                })
                .call(join => join.transition(transition)
                    .attr('transform', (d, i) => `translate(${-defaultWidth+boxWidth*0.5*(2*i+data.length+1)}, 0)`)
                )

        // Vertical line
        g.selectAll(".vertLine")
        .data(d => d.summary, d => d[0])
        .join(
            enter => enter.append("line")
                .attr("class", "vertLine")
                .attr("x1", d => {return(x(d[0]))})
                .attr("x2", d => {return(x(d[0]))})
                .attr('y1', d => y(d[1].median))
                .attr('y2', d => y(d[1].median))
                .call(enter => enter.transition(transition).delay(stagger)
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
                )
                .attr("stroke", "black"),
            update => update.call(update => update.transition(transition).delay(stagger)
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
            )
        )

        // The box
        g.selectAll(".box")
        .data(d => d.summary, d => d[0])
        .join(
            enter => enter.append("rect")
                .attr("class", "box")
                .attr("x", d => {return(x(d[0]))})
                .attr("y", d => {return(y(d[1].q3))})
                .attr("height", d => {return(y(d[1].q1)-y(d[1].q3))})
                .call(enter => enter.transition(transition).delay(stagger)
                    .attr("width", boxWidth)
                    .attr("x", d => {return(x(d[0])-boxWidth/2)})
                )
                .attr("stroke", "black"),
            update => update.call(update => update.transition(transition).delay(stagger)
                .attr("y", d => {return(y(d[1].q3))})
                .attr("height", d => {return(y(d[1].q1)-y(d[1].q3))})
                .attr("x", d => {return(x(d[0])-boxWidth/2)})
                .attr("width", boxWidth)
            )
        )

        // Horizontal lines
        g.selectAll(".minLine")
        .data(d => d.summary, d => d[0])
        .join(
            enter => enter.append("line")
                .attr("class", "minLine")
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
                .attr("x1", d => {return(x(d[0])) })
                .attr("x2", d => {return(x(d[0])) })
                .call(enter => enter.transition(transition).delay(stagger)
                    .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                    .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                )
                .attr("stroke", "black"),
            update => update.call(update => update.transition(transition).delay(stagger)
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
                .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                .attr("x2", d => {return(x(d[0])+boxWidth/2) })
            )
        )
        
        g.selectAll(".medianLine")
        .data(d => d.summary, d => d[0])
        .join(
            enter => enter.append("line")
                .attr("class", "medianLine")
                .attr("y1", d => {return(y(d[1].median))})
                .attr("y2", d => {return(y(d[1].median))})
                .attr("x1", d => {return(x(d[0])) })
                .attr("x2", d => {return(x(d[0])) })
                .call(enter => enter.transition(transition).delay(stagger)
                    .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                    .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                )
                .attr("stroke", "black"),
            update => update
                .call(update => update.transition(transition).delay(stagger)
                    .attr("y1", d => {return(y(d[1].median))})
                    .attr("y2", d => {return(y(d[1].median))})
                    .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                    .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                )
        )

        g.selectAll(".maxLine")
        .data(d => d.summary, d => d[0])
        .join(
            enter => enter.append("line")
                .attr("class", "maxLine")
                .attr("x1", d => {return(x(d[0])) })
                .attr("x2", d => {return(x(d[0])) })
                .call(enter => enter.transition(transition).delay(stagger)
                    .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                    .attr("x2", d => {return(x(d[0])+boxWidth/2) })
                )
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
            update => update.call(update => update.transition(transition).delay(stagger)
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
                .attr("x1", d => {return(x(d[0])-boxWidth/2) })
                .attr("x2", d => {return(x(d[0])+boxWidth/2) })
            )
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

    // Predicate generators for filtering
    const weatherFilter = () => {
        const weathers = d3.selectAll('.weather.checked').nodes().map(c => +c.id)
        return (data) => 
            weathers.includes(data.weather_code)
    }
    const dayPropertyFilter = () => {
        const dayPropBoxes = d3.selectAll('.dayProp').nodes()
        const dayProps = dayPropBoxes.map(d => d.checked)
        return (data) =>
                ((data.is_holiday  && dayProps[2])   ||
                 (data.is_weekend  && dayProps[1])   ||
                 (!data.is_weekend && dayProps[0]))
    }


    // Updates all visualizations with potentially new filters
    const update = () => {
        const df = dayPropertyFilter()
        const wf = weatherFilter()

        const soloed = d3.selectAll('.solo').nodes().map(s => +s.id)
        const sf = (data) => soloed.includes(data.weather_code)

        const filteredByDayProp = focusedData.filter(df)
        const weatherStacks = computeWeatherStacks(filteredByDayProp)
        drawWeatherBar(weatherStacks, wf)

        const combined = {id: 'combined', summary: computeSummary(filteredByDayProp.filter((d) => wf(d) && !sf(d)))}
        const soloedSummaries = soloed.map(s => ({id: s, summary: computeSummary(filteredByDayProp.filter(d => d.weather_code == s))}))

        summaries = combined.summary.length != 0 ? [combined, ...soloedSummaries] : soloedSummaries
        drawBoxes(summaries)
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