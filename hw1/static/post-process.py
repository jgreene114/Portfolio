import csv, pandas as pd, datetime as dt

current_year = dt.datetime.now().year
first_day_of_year = dt.datetime(current_year, 1, 1)

def passes_filter(row):
    # Filter criteria:
    date = row['PlantDate']
    #   Only listed trees for which date is not NA
    if pd.isna(date):
        return False
    #   Only listed trees for which date is not an empty string
    elif date == "":
        return False
    # Only trees planted before the beginning of this year
    elif dt.datetime.strptime(date, '%m/%d/%y %H:%M') >= first_day_of_year:
        return False
    else:
        return True


# import and run passes_filter
data = {}
header = ["Month", "Month_i", "Count"]
with open('data/Street_Tree_List-2022-01-30_RAW.csv', 'r') as f:
    reader = csv.DictReader(f)
    # header = reader.fieldnames
    for row in reader:
        if passes_filter(row):
            # Convert PlantDate into datetime object
            date = dt.datetime.strptime(row['PlantDate'], '%m/%d/%y %H:%M')
            month = date.strftime("%B")
            
            # Add to monthly count
            if month in data:
                data[month] += 1
            else:
                data[month] = 1


# Converting the data to a sorted dictionary (sorted by month)
monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
              'August', 'September', 'October', 'November', 'December']
data = [{"Month": month, "Month_i": monthOrder.index(month), "Count": count} for month, count in data.items()]
data = sorted(data, key=lambda x: monthOrder.index(x['Month']))

# export to new CSV
with open('data/Monthly_Street_Tree_Counts-2022-01-30_FILTERED.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=header)
    writer.writeheader()
    writer.writerows(data)

#%%
