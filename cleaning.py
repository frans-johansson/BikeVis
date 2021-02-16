import pandas as pd
import sys


def clean_data(file_path: str, destination='data/clean_data.csv') -> pd.DataFrame:
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

    time_format = '%Y-%m-%d %H:%M:%S'
    df['timestamp'] = pd.to_datetime(df['timestamp'], format=time_format)

    df['weather_code'] = df['weather_code'].astype(int)
    df['is_holiday'] = df['is_holiday'].astype(int)
    df['is_weekend'] = df['is_weekend'].astype(int)
    df['season'] = df['season'].astype(int)

    df.rename(columns={'cnt': 'count', 't1': 'temp_real',
                       't2': 'temp_feels', 'hum': 'humidity'}, inplace=True)

    df.to_csv(destination, index=False)
    return df


if __name__ == '__main__':
    try:
        file_path = sys.argv[1]
        clean_data(file_path)
    except IndexError:
        print('Error: Expected path to CSV-file.')
