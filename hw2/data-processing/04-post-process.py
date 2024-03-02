import copy
import csv
import json
from datetime import datetime, timedelta

with open('../static/data/StreamingHistory_withGenres.json', 'r') as f:
    data = json.load(f)

for item in data:
    if item['trackName'] == 'Amphetamine':
        data.remove(item)

uniques = {
    'genres': set(),
    'artists': set(),
    'songs': set()
}

for item in data:
    uniques['genres'].update(item['genre'])
    uniques['artists'].add(item['artistName'])
    uniques['songs'].add(item['trackName'])
for _dict in uniques:
    uniques[_dict] = sorted(uniques[_dict])

start_date = datetime.strptime("2023-01-01", "%Y-%m-%d")
end_date = datetime.strptime("2023-12-31", "%Y-%m-%d")

current_date = start_date
daily_data = {}

while current_date <= end_date:
    daily_data[current_date.strftime("%Y-%m-%d")] = {}
    current_date += timedelta(days=1)


genre_data = copy.deepcopy(daily_data)
artist_data = copy.deepcopy(daily_data)
song_data = copy.deepcopy(daily_data)

for date in daily_data:
    genre_data[date] = {key: 0 for key in uniques['genres']}
    artist_data[date] = {key: 0 for key in uniques['artists']}
    song_data[date] = {key: 0 for key in uniques['songs']}

genreArtist_data = {}
songArtist_data = {}
for item in data:
    date = datetime.strptime(item['endTime'], "%Y-%m-%d %H:%M").date()
    strDate = datetime.strftime(date, "%Y-%m-%d")
    duration = item['msPlayed']
    
    if strDate not in genre_data:
        data.remove(item)
        continue
    
    genres = item['genre']
    artist = item['artistName']
    song = item['trackName']
    
    songArtist_data[song] = artist
    
    for genre in genres:
        genre_data[strDate][genre] += duration
        if genre not in genreArtist_data:
            genreArtist_data[genre] = {}
        if artist not in genreArtist_data[genre]:
            genreArtist_data[genre][artist] = duration
        else:
            genreArtist_data[genre][artist] += duration
    artist_data[strDate][artist] += duration
    
    song_data[strDate][song] += duration



def dictData_to_csv(data, path, fieldnames):
    rows = []
    for date, dataDict in data.items():
        row = {'date': date}
        row.update(dataDict)
        rows.append(row)
    
    with open(path, 'w') as file:
        writer = csv.DictWriter(file, fieldnames=["date"] + fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# create genre daily data
genre_data_path = '../static/data/daily-data/genre.csv'
dictData_to_csv(genre_data, genre_data_path, uniques['genres'])
print("genre data done")
# create artist daily data
artist_data_path = '../static/data/daily-data/artist.csv'
dictData_to_csv(artist_data, artist_data_path, uniques['artists'])
print("artist data done")

# create song daily data
song_data_path = '../static/data/daily-data/song.csv'
dictData_to_csv(song_data, song_data_path, uniques['songs'])
print("song data done")

songArtist_data_path = '../static/data/songToArtist.json'
with open(songArtist_data_path, 'w') as file:
    json.dump(songArtist_data, file)
print("song artist data done")

genreArtist_data_path = '../static/data/genreToArtist.json'
with open(genreArtist_data_path, 'w') as file:
    json.dump(genreArtist_data, file)
print("genre artist data done")
