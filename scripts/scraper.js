import fs from "fs"
import path from "path"

import * as cheerio from "cheerio"

const fileName = process.argv.find((e) => e.includes(".csv"))
const imdbCompatible = process.argv.includes("imdb") ?? false
const convertRatingToBase10 = process.argv.includes("b10") ?? false
const isDiary = process.argv.includes("diary") ?? false

if (fileName === "diary.csv" && !isDiary) {
    console.warn("When processing diary.csv, please use the -- diary flag")
    process.exit(0)
}

function csvToJson(text, quoteChar = '"', delimiter = ",") {
    text = text.trim()
    let rows = text.split("\n")

    // Trim headers to remove any whitespace or carriage return characters
    let headers = rows[0].split(delimiter).map((header) => header.trim())

    const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, "gs")

    const match = (line) => {
        const matches = [...line.matchAll(regex)].map((m) => m[2])
        const paddedMatches = Array.from({ length: headers.length }, (_, i) => matches[i] ?? null)
        return paddedMatches
    }

    let lines = text.split("\n").slice(1)

    return lines.map((line) => {
        return match(line).reduce((acc, cur, i) => {
            const val = cur === null || cur.length <= 0 ? null : Number(cur) || cur
            const key = headers[i] ?? `{i}`
            return { ...acc, [key]: val }
        }, {})
    })
}

function jsonToCsv(json, quoteChar = '"', delimiter = ",") {
    if (!Array.isArray(json) || json.length === 0) {
        return ""
    }

    const escapeValue = (value) => {
        if (typeof value === "string" && (value.includes(delimiter) || value.includes(quoteChar) || value.includes("\n"))) {
            return `${quoteChar}${value.replace(new RegExp(quoteChar, "g"), `${quoteChar}${quoteChar}`)}${quoteChar}`
        }
        return value
    }

    // Extract headers from the keys of the first object in the array
    const headers = Object.keys(json[0])

    // Map over headers to create the CSV header row
    let csvHeader = headers.map(escapeValue).join(delimiter)
    if (imdbCompatible) {
        csvHeader = csvHeader.replace("ImdbId", "Const").replace("Rating", "Your Rating").replace("Name", "Title").replace("TmdbIdType", "Title Type")
        if (csvHeader.includes("Your Rating")) {
            csvHeader = csvHeader.replace("Date", "Date Rated")
        }
    }

    // Map over the JSON array to create each CSV row
    const csvRows = json.map((row) => {
        return headers
            .map((field) => {
                const value = row[field] != null ? row[field] : "" // Handle undefined or null values
                return escapeValue(value)
            })
            .join(delimiter)
    })

    // Combine the header and rows into a single CSV string
    return [csvHeader, ...csvRows].join("\n")
}

async function scrapeData(film) {
    try {
        // Fetch the page content with browser-like headers
        const response = await fetch(film["Letterboxd URI"] || film.URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                Connection: "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                DNT: "1", // Do Not Track Request Header
            },
        })

        const body = await response.text()

        // Load the page content into cheerio for parsing
        const $ = cheerio.load(body)

        const tmdbHref = $('.micro-button[data-track-action="TMDB"]')?.attr("href") || ""
        const imdbHref = $('.micro-button[data-track-action="IMDb"]')?.attr("href") || ""

        const TmdbIdType = tmdbHref.match(/\/(movie|tv)\/(\d+)\//)?.[1] || ""
        const TmdbId = tmdbHref.match(/\/(movie|tv)\/(\d+)\//)?.[2] || ""
        const ImdbId = imdbHref.match(/\/title\/(tt\d+)\/?/)?.[1] || ""

        console.log(`Processed ${film.Name} (${film.Year}): { ${TmdbIdType}, ${TmdbId}, ${ImdbId} }`)
        return { TmdbIdType, TmdbId, ImdbId }
    } catch (error) {
        console.warn(`Failed to process ${film.Name} (${film.Year}):`, error)
        return { TmdbIdType: "", TmdbId: "", ImdbId: "" }
    }
}

function findValueByPrefix(object, prefix) {
    for (const property in object) {
        if (object.hasOwnProperty(property) && property.toString().startsWith(prefix)) {
            return object[property]
        }
    }
}

;(async () => {
    console.log(`processing ${fileName}\n`)

    const inputPath = "./input"
    const outputPath = "./output"
    const inputFilePath = path.join(inputPath, fileName)
    const outputFilePath = path.join(outputPath, fileName)

    const cachePath = "./cache"
    const cacheFilePath = path.join(cachePath, "cache.json")

    // process input file
    const rawCSV = fs.readFileSync(inputFilePath, "utf8")?.replace(/[\s\S]*?(?=Position,Name,Year,URL,Description)/, "") // Remove list csv descriptions
    const rawCsvJson = csvToJson(rawCSV)

    // process cache
    let cache = {}
    if (fs.existsSync(cacheFilePath)) {
        cache = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"))
    } else {
        if (!fs.existsSync(cachePath)) {
            fs.mkdirSync(cachePath, { recursive: true })
        }
    }

    // delete output file
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
    }
    if (fs.existsSync(outputFilePath)) {
        fs.unlinkSync(outputFilePath)
    }

    for (let i = 0; i < rawCsvJson.length; i++) {
        let film = rawCsvJson[i]
        let idData = {}
        const filmUrl = film["Letterboxd URI"] || film.URL
        const cacheKey = `${film.Name}|:|${film.Year}|:|${filmUrl?.match(/boxd\.it\/([a-zA-Z0-9]+)/)?.[1] || ""}`
        const cacheValue = cache[cacheKey] || findValueByPrefix(cache, `${film.Name}|:|${film.Year}|:|`)

        if (cacheValue) {
            const [TmdbIdType = "", TmdbId = "", ImdbId = ""] = cacheValue.split("|")
            if ((!TmdbIdType || !TmdbId || !ImdbId) && !isDiary) {
                console.log(`Some cache value is missing for ${film.Name} (${film.Year}), trying to scrape again...`)
                idData = await scrapeData(film)
                cache[cacheKey] = `${idData.TmdbIdType}|${idData.TmdbId}|${idData.ImdbId}`
            } else {
                idData = { TmdbIdType, TmdbId, ImdbId }
            }
        } else if (!isDiary) {
            idData = await scrapeData(film)
            cache[cacheKey] = `${idData.TmdbIdType}|${idData.TmdbId}|${idData.ImdbId}`
        }

        if (convertRatingToBase10 && film.Rating) film.Rating = film.Rating * 2
        idData.TmdbIdType = idData.TmdbIdType === "movie" ? "Movie" : "TV Series"

        rawCsvJson[i] = {
            ...film,
            ...idData,
        }
    }

    // save cache
    if (!isDiary) fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2))

    // save output file
    const csv = jsonToCsv(rawCsvJson)
    fs.writeFileSync(outputFilePath, csv)

    console.log(`\n${fileName} Done!`)
})()
