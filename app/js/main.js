const loadData = async () => {
    // Time parsers for complete and aggregated data
    timeParserLong = d3.timeParse('%Y-%m-%d %H:%M:%S')
    timeParserShort = d3.timeParse('%Y-%m-%d')

    // Clean data contains all the original data from the dataset
    // with relevant fields set to numbers
    const hours = await d3.csv('data/clean_data.csv', d => ({
        timestamp: timeParserLong(d.timestamp),
        count: +d.count,
        temp_real: +d.temp_real,
        wind_speed: +d.wind_speed,
        humidity: +d.humidity,
        weather_code: +d.weather_code,
        season: +d.season,
        is_weekday: +d.is_weekend-1*-1,
        is_weekend: +d.is_weekend,
        is_holiday: +d.is_holiday,
    }))

    // Day data contains mean and sum values for each day
    const days = await d3.csv('data/day_data.csv', d => ({
        timestamp: timeParserShort(d.timestamp),
        sum_count: +d.sum_count,
        mean_count: +d.mean_count,
        mean_temp: +d.mean_temp,
        mean_humidity: +d.mean_humidity,
        mean_wind_speed: +d.mean_wind_speed
    }))

    // Week data contains mean and sum values for each week
    const weeks = await d3.csv('data/week_data.csv', d => ({
        timestamp: timeParserShort(d.timestamp),
        sum_count: +d.sum_count,
        mean_count: +d.mean_count,
        mean_temp: +d.mean_temp,
        mean_humidity: +d.mean_humidity,
        mean_wind_speed: +d.mean_wind_speed,
        pearson: +d.pearson
    }))

    return {
        hours, days, weeks
    }
}

const main = async () => {
    // Read and parse data into a single object
    const data = await loadData()
    
    // Initialize and link the visualizations
    const updateFocusSpan = makeTimelineFocus(data.weeks, data.days)
    const updateDayViewSpan = makeDayView(data.hours)
    makeTimelineOverview(data.weeks, (fromBrushed) => {
        updateFocusSpan(fromBrushed)
        updateDayViewSpan(fromBrushed)
    })
}

main()