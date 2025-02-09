# Letterboxd CSV IMDb TMDB Mapper

A Node.js script that adds IMDb and TMDB IDs to a Letterboxd exported CSV file.

# Installation

1. Clone the repository or download it as a zip

```
git clone https://github.com/Tetrax-10/letterboxd-csv-imdb-tmdb-mapper.git
```

2. Install dependencies

```bash
npm install
```

# Usage

1. ### Export Your Letterboxd Data

    Create a `input` folder in the root of this repo and export your Letterboxd data, extract the zip file, and put your `watched.csv` file inside the `input` folder.

2. ### Run the Script to Add IMDb and TMDb IDs

    ```bash
    npm run scrape "watched.csv"
    ```

    After this you can see the output in the `output` folder.

    That's it! 🎉

> [!CAUTION]
> When scraping CSVs that don't have direct film links eg: `diary.csv`, add `nocache` argument. Else the script will fail to scrape the CSV.
>
> ```bash
> npm run scrape "diary.csv" nocache
> ```

#### Additional arguments:

```bash
npm run scrape "watched.csv" -- imdb b10
```

-   `imdb`: IMDb format output
-   `b10`: convert rating to base 10
