import pandas as pd
from cleaning import clean_data


def pearson_coeff(one_week: pd.Series, season_model: pd.Series) -> float:
    '''
    Computes the Pearson correlation coefficient between binned observations for one week of data
    and corresponding seasonal data

    ## Parameters
    * `one_week`: One week of data which has been aggregated into a 24h representation or similar
    * `season_model`: Seasonal representation of the data with the same binning strategy as `one_week`

    ## Returns
    The Pearson correlation coefficient between the week and seasonal observations
    '''
    a = (one_week-one_week.mean()) * (season_model-season_model.mean())
    b = one_week.std() * season_model.std()
    return a.mean() / b


def make_seasonal_models(df: pd.DataFrame) -> pd.Series:
    '''
    Creates seasonal median based models for use in the Pearson coefficient calculations.

    ## Parameters:
    * `df`: Cleaned DataFrame with labeled seasonal data and hourly bike share counts

    ## Returns:
    A Multi-Indexed (Season, Hour) Series with seasons and median data binned by the hour of the day (24 bins per season)
    '''
    seasons_df = df.groupby(['season', df.index.time]).median()
    return seasons_df['count']


if __name__ == '__main__':
    df = clean_data('app/data/clean_data.csv')
    season_models = make_seasonal_models(df)
    weeks = df[['count', 'season']].groupby(pd.Grouper(freq='1W'))

    results = []
    for (_, week) in weeks:
        season = week['season'].value_counts().idxmax()
        season_model = season_models[season]
        week_model = week['count'].groupby(week.index.time).median()
        results += [pearson_coeff(week_model, season_model)]
