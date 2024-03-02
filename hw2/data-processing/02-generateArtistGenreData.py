import spotipy
from spotipy.oauth2 import SpotifyOAuth
import json



def get_artist_id_by_name(artist_name):
    results = sp.search(q='artist:' + artist_name, type='artist')
    items = results['artists']['items']
    if items:
        artist_id = items[0]['id']
        return artist_id

def get_artists_by_ids(artistIds):
    artistNames = list(artistIds.keys())
    artists = {}
    i = 0
    for i in range(0, len(artistIds.items()), 50):
        batchArtistNames = artistNames[i : i + 50]
        batchArtistIds = [artistIds[name] for name in batchArtistNames if
                          artistIds[name] is not None]
        for item in batchArtistIds:
            if not isinstance(item, str): breakpoint()
        batchArtists = sp.artists(batchArtistIds)
        
        for artist in batchArtists['artists']:
            artists[artist['name']] = artist
        i+=1
        print(f"Artists: Done with batch {i} - {i + 50}/{nUniqueArtists}")
    
    return artists

sp = spotipy.Spotify(
    auth_manager=SpotifyOAuth(
        client_id="9a490ebd9b27451b85b289d6c14466f9",
        client_secret="secret",
        redirect_uri="http://localhost:3000",
        scope="user-library-read"
    )
)

path = '../static/data/StreamingHistory.json'

with open(path, 'r') as file:
    data = json.load(file)

uniqueArtists = set()
for item in data:
    uniqueArtists.add(item['artistName'])
nUniqueArtists = len(uniqueArtists)

print(f'{nUniqueArtists=}')

i = 0
artistIds = {}
for artistName in list(uniqueArtists):
    artistIds[artistName] = get_artist_id_by_name(artistName)
    i+=1
    print(f"ID: Done with {artistName} {i}/{nUniqueArtists}")
path = '../static/data/artistIDs.json'
with open(path, 'w') as file:
    json.dump(artistIds, file)

path = '../static/data/artistIDs.json'
with open(path, 'r') as file:
    artistIds = json.load(file)

artists = get_artists_by_ids(artistIds)

artistGenres = {}
for artist in artists:
    artistGenres[artist] = artists[artist]['genres']

path = '../static/data/artistData.json'
with open(path, 'w') as file:
    json.dump(artists, file)

path = '../static/data/artistGenreData.json'
with open(path, 'w') as file:
    json.dump(artistGenres, file)