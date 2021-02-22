const main = async () => {
    timeParserLong = d3.timeParse('%Y-%m-%d %H:%M:%S')
    
    // clean_data contains all the original data from the dataset
    clean_data = await d3.csv('data/clean_data.csv', d => ({
        timestamp: timeParserLong(d.timestamp),
        count: +d.count,
        temp_real: +d.temp_real,
        wind_speed: +d.wind_speed,
        humidity: +d.humidity,
        weather_code: +d.weather_code,
        season: +d.season,
        is_weekend: +d.is_weekend,
        is_holiday: +d.is_holiday,
    }))

    // day_data contain mean and sum values for each day
    timeParserShort = d3.timeParse('%Y-%m-%d')
    day_data = await d3.csv('data/day_data.csv', d => ({
        timestamp: timeParserShort(d.timestamp),
        sum_count: +d.sum_count,
        mean_count: +d.mean_count,
        mean_temp: +d.mean_temp,
        mean_humidity: +d.mean_humidity,
        mean_wind_speed: +d.mean_wind_speed
    }))

    // week_data contain mean and sum values for each week
    week_data = await d3.csv('data/week_data.csv', d => ({
        timestamp: timeParserShort(d.timestamp),
        sum_count: +d.sum_count,
        mean_count: +d.mean_count,
        mean_temp: +d.mean_temp,
        mean_humidity: +d.mean_humidity,
        mean_wind_speed: +d.mean_wind_speed
    }))
    
    make_timeline_overview(clean_data, day_data, week_data)
    make_day_filter(clean_data)
}

main()