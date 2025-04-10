# Letterboxd CSV IMDb TMDB Mapper

A Node.js script that adds IMDb and TMDb IDs to a Letterboxd-exported CSV file.

</br>

# Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed. You can also use [Bun.js](https://bun.sh/).

2. Clone or [download this repository](https://github.com/Tetrax-10/letterboxd-csv-imdb-tmdb-mapper/archive/refs/heads/main.zip).

3. Open a terminal inside the `letterboxd-csv-imdb-tmdb-mapper` folder and run:

    ```bash
    npm install
    ```

</br>

# Usage

### 1. Export Your Letterboxd Data

Download your Letterboxd data as a ZIP file from [here](https://letterboxd.com/settings/data/). Extract it and place the `.csv` files you want to process inside the `input` folder.

> **Note:** Only put `.csv` files inside the `input` folder.  
> For example, if you want to process `likes/films.csv`, just copy `films.csv` into the `input` folder — do **not** place the entire `likes` folder.  
> The same applies for files under the `lists/` folder.

Your `input/` folder should look similar to this:

```
input/
├── your-list-name.csv
├── your-list-name-2.csv
├── diary.csv
├── watched.csv
├── watchlist.csv
├── films.csv
├── ratings.csv
└── ...
```

### 2. Run the Script to Add IMDb and TMDb IDs

#### Process `your-list-name.csv` or `films.csv`

```bash
npm run scrape "your-list-name.csv"
```

_or_

```bash
npm run scrape "films.csv"
```

so on...

✅ Done!

#### Process `diary.csv`

Since `diary.csv` doesn't contain direct film links, process `watched.csv` first:

```bash
npm run scrape "watched.csv"
```

Then process your diary:

```bash
npm run scrape "diary.csv" -- diary
```

✅ Done!

After processing, a new CSV file with IMDb and TMDb IDs will be created in the `output` folder.

</br>

# Additional Arguments

```bash
npm run scrape "ratings.csv" -- imdb b10
```

-   `imdb`: Outputs the CSV in IMDb format.  
    _(Useful when importing into IMDb using tools like [IMDb List Importer](https://greasyfork.org/en/scripts/23584-imdb-list-importer), [IMDb Ratings Importer](https://greasyfork.org/en/scripts/463836-imdb-ratings-importer), or any tools/website that supports IMDb format.)_

-   `b10`: Converts ratings from a 5-point scale to a 10-point scale.

</br>

# Supported CSV Format

This script supports CSV files exported from the [Letterboxd export page](https://letterboxd.com/settings/data/).

We follow Letterboxd’s naming scheme, so if you have a CSV from third-party tools like [Lizard Letterboxd List Downloader](https://lizard.streamlit.app/), make sure it follows this format:

```csv
Name,Year,Letterboxd URI
Kill Bill: Vol. 1,2003,https://boxd.it/70w
```

The script requires **only three fields**:

-   `Name`
-   `Year`
-   `Letterboxd URI` (direct link to the film page)

</br>

# Known Issues

-   `reviews.csv` is currently **not supported** due to limitations in the CSV parser.
