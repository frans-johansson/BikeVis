import pandas as pd
import numpy as np
from cleaning import clean_data, format_sum_mean
from pearson import make_seasonal_models, pearson_coeff

'''
Main data processing script. Everything required to get the visualization application up and running
with regards to what CSV-files need to be created should be placed in this script.
'''
if __name__ == '__main__':
    # Note that clean_data generates the file 'app/data/clean_data.csv'
    # which is required by subsequent function calls
    clean_df = clean_data('app/data/london_data.csv')
    clean_file = 'app/data/clean_data.csv'
    format_sum_mean(clean_file_path=clean_file, agg_freq='1D', out_name='day_data.csv')
    format_sum_mean(clean_file_path=clean_file, agg_freq='1W', out_name='week_data.csv')
    
    # Data mining steps
    clean_df.set_index('timestamp', inplace=True)
    season_models = make_seasonal_models(clean_df)
    weeks = clean_df[['count', 'season']].groupby(pd.Grouper(freq='1W'))

    # Compute Pearson coefficients
    P = []
    for (_, week) in weeks:
        season = week['season'].value_counts().idxmax()
        season_model = season_models[season]
        week_model = week['count'].groupby(week.index.time).median()
        P += [pearson_coeff(week_model, season_model)]


    f = 20
    P = np.array(P)**f
    P = (P - P.min())/(P.max() - P.min())
    P = np.round(P*10).astype('int')

    week_df = pd.read_csv('app/data/week_data.csv')
    week_df['pearson'] = P
    week_df.to_csv('app/data/week_data.csv')