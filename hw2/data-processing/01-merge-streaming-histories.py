import json, os

directoryPath = "../static/data/streaming-histories"

files = os.listdir(directoryPath)

merged_data = []
for file in files:
    if file.endswith("json"):
        file_path = os.path.join(directoryPath, file)
        with open(file_path, 'r') as f:
            merged_data += json.load(f)

new_path = "../static/data/StreamingHistory.json"
with open(new_path, 'w') as f:
    json.dump(merged_data, f)