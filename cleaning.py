import pandas as pd
import sys


def clean_data(file_path: str, destination='app/data/clean_data.csv') -> pd.DataFrame:
    '''
    Performs rudimentary data cleaning on the London bike share data CSV-file.
    Will format the `timestamp` column as proper datetime objects, cast categorical data to integers,
    and rename columns for clarity (e.g. `t1` -> `temp_real`).

    ## Parameters:

    * `file_path`:      String indicating the relative path to the csv-file
    * `destination`:    String indicating the relative path to the new file where the clean data will be saved\\
                        (note that this does not handle directory existance checking)

    ## Returns:

    `clean_df`: A Pandas DataFrame object with the cleaned data.
    '''
    df = pd.read_csv(file_path)

    df['timestamp'] = format_datetimes(df)

    df['weather_code'] = df['weather_code'].astype(int)
    df['is_holiday'] = df['is_holiday'].astype(int)
    df['is_weekend'] = df['is_weekend'].astype(int)
    df['season'] = df['season'].astype(int)

    df.rename(columns={'cnt': 'count', 't1': 'temp_real',
                       't2': 'temp_feels', 'hum': 'humidity'}, inplace=True)


    df.to_csv(destination, index=False)
    return df

def format_datetimes(df: pd.DataFrame, column='timestamp', format='%Y-%m-%d %H:%M:%S') -> pd.Series:
    '''
    Formats a column from a given DataFrame from datetime strings to DateTime objects.

    ## Parameters:

    * `df`: The DataFrame to format
    * `column`: The name of the column with datetime strings
    * `format`: Format string for how to parse the datetime strings

    ## Returns:

    A Series with the parsed DateTime objects.
    '''
    return pd.to_datetime(df['timestamp'], format=format)

def format_sum_mean(clean_file_path: str, agg_freq = '1W', out_name='sum_mean_data.csv') -> pd.DataFrame:
    """
    Aggrigates the output data from the clean_data function into a given time interval and calculates mean and sum values.

    ## Args:
    `clean_file_path` (str): Path to the dataset generated from the function "clean_data".
    `agg_freq` (str, optional): The timeperiod the function aggrigates. Defaults to '1W'.
    `out_name` (str, optional): The name of the output file. Defaults to 'sum_mean_data.csv'.

    ## Returns:
        pd.DataFrame: A Pandas DataFrame object with the aggrigated data.
    """
    df = pd.read_csv(clean_file_path)
    new_df = pd.DataFrame()

    df['timestamp'] = format_datetimes(df)
    df.set_index('timestamp', inplace=True)

    new_df['sum_count'] = df['count'].groupby(pd.Grouper(freq=agg_freq)).sum()
    new_df['mean_count'] = df['count'].groupby(pd.Grouper(freq=agg_freq)).mean()
    new_df['mean_temp'] = df['temp_real'].groupby(pd.Grouper(freq=agg_freq)).mean()
    new_df['mean_humidity'] = df['humidity'].groupby(pd.Grouper(freq=agg_freq)).mean()
    new_df['mean_wind_speed'] = df['wind_speed'].groupby(pd.Grouper(freq=agg_freq)).mean()

    new_df.to_csv('app/data/'+ out_name, index=True)
    return new_df


if __name__ == '__main__':
    try:
        file_path = sys.argv[1]
        clean_data(file_path)
    except IndexError:
        print('Error: Expected path to CSV-file.')
