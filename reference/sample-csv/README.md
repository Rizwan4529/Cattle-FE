# Sample CSV files

Try these in the dashboard: **Owner dashboard → Import → Choose a file** (or drag one onto the box).

| File | What it shows |
|---|---|
| `1-herd-import-template.csv` | The blank template, same as **Download the template** in the app. Our column names, two example rows. |
| `2-clean-spring-calves.csv` | 12 spring calves (HCR-2620 to HCR-2631), every column filled in, no problems. Imports as 12 new animals. Import it a second time and all 12 come in as updates instead. |
| `3-messy-sale-barn-sheet.csv` | A hand-typed sheet with different column names (`Ear Tag`, `Wt (lbs)`, `DOB`, `RFID`…) and the usual mistakes. Shows column matching and every validation rule: a tag without the HCR prefix, a short RFID, a missing weight, a tag entered twice, a BCS of 12, a blank line, "calf" as the sex, an unknown coat and date, a weight with extra zeros, and a reweigh of an animal already in the herd (HCR-2417). Result: 8 new, 1 update, 4 left out. The app's **Try it with a sample file** button loads this same file. |
| `4-chute-scan-export.csv` | The file the chute scan page downloads (`scanned_at`, `station`, `flag` columns included). Shows that a scan file imports as-is: the extra columns are listed as "not imported". 8 heifers, one flagged for a rescan. |

The import accepts dates as `2026-03-14` or `3/14/2026`, tags as `HCR-2417` or `2417`, and common shorthand for sex (`S`, `hfr`) and coat (`BLK`, `BWF`).
