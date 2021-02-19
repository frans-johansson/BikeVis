const main = async () => {
    timeParser = d3.timeParse('%Y-%m-%d %H:%M:%S')
    data = await d3.csv('data/clean_data.csv', d => ({
        timestamp: timeParser(d.timestamp),
        count: +d.count,
        temp_real: +d.temp_real,
        wind_speed: +d.wind_speed,
        humidity: +d.humidity,
        weather_code: +d.weather_code,
        season: +d.season,
        is_weekend: +d.is_weekend,
        is_holiday: +d.is_holiday,
    }))
    make_timeline_overview(data)
}

main()