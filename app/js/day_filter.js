const make_day_filter = (clean_data) => {
    
    // TODO: Make filter_data() return an array of objects that contains the days that are specified in the filter
    // Right now it doesn't apply any filter
    let filtered_data = apply_filter(clean_data, filter)

    // Takes any array of objects and groups it by hour of the day.
    // Returns an array of 24 objects that each contains a timestamp and the mean count for that hour.
    let mean_data = mean_hourly_data(filtered_data)
    console.log(mean_data)

    // TODO: Make the line fit and look good
    let svg = d3.select('#day-filter')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    const x = d3.scaleTime()
        .domain(d3.extent(mean_data, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(mean_data, d => d.count)])
        .range([height - margin.bottom, margin.top])

    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
    const yAxis = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
    
    const line = d3.line()
        .x(d => x(d.timestamp))
        .y(d => y(d.count))  

    svg.append('g')
        .call(xAxis);
    svg.append('g')
        .call(yAxis);
    svg.append("path")
        .datum(mean_data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
}

const apply_filter = (data) => {

    let filtered_data = data
    return filtered_data
}

const mean_hourly_data = (filtered_data) => {

    const format_hour = d3.timeFormat("%H")
    let mean_data = []
    let grouped_data = d3.group(filtered_data, d => format_hour(d.timestamp))
    
    grouped_data.forEach((hour_array, i) => {

        let temp = {
            timestamp: format_hour(hour_array[0].timestamp),
            count: 0
        }
        Object.values(hour_array).forEach( d => {
            
            temp.count = temp.count + d.count
        })
        temp.count = Math.round(temp.count / hour_array.length)
        mean_data[+i] = temp
    })
    return mean_data
}