const make_timeline_overview = (data) => {
    let svg = d3.select('#timeline-overview')
        .append('svg')

    const { width, height } = svg.node().getBoundingClientRect()
    const margin = ({ top: 20, right: 20, bottom: 50, left: 50 })

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.timestamp))
        .range([margin.left, width - margin.right])
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
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
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);

    // HERE WE GO WITH DATA IN JS woo
    const date_data = data.map(d => ({
        ...d,
        date: `${d.timestamp.getYear()}/${d.timestamp.getMonth()}/${d.timestamp.getDate()}`
    }))

    let grouped_data = d3.group(date_data,
        d => d.date
    )
    // ({ timestamp }) => timestamp.getYear(),
    // ({ timestamp }) => timestamp.getMonth(),
    // ({ timestamp }) => timestamp.getDate()

    count_days = grouped_data.forEach((month) => {
        // console.log(month)
    })
    print_data(data)
    print_data(Array.from(grouped_data))
    // print_data(days)
}

const slice_days = (data) => {
    let days = [];
    let i = 0;
    while (i < data.length) {
        days.push(data.slice(i, i += 24))
    }
    return days
}

const print_data = (data) => {
    console.log(data)
}