import json

artistGenre_path = "../static/data/artistGenreData.json"
streamingHistory_path = "../static/data/StreamingHistory.json"

new_path = "../static/data/StreamingHistory_withGenres.json"

with open(streamingHistory_path, "r") as File:
    data = json.load(File)

with open(artistGenre_path, "r") as File:
    genreData = json.load(File)

for item in data:
    artistName = item["artistName"]
    if artistName in genreData:
        item['genre'] = genreData[artistName]
    else:
        item['genre'] = ['Unknown']

with open(new_path, "w") as File:
    json.dump(data, File)