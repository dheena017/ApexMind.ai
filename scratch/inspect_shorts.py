import requests
import json
import re
import urllib.parse

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

clean_query = urllib.parse.quote("trending shorts")
target_url = f"https://www.youtube.com/results?search_query={clean_query}"
resp = requests.get(target_url, headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"}, timeout=8)
match = re.search(r"var ytInitialData = (\{.*?\});</script>", resp.text)
if match:
    data = json.loads(match.group(1))
    sections = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
    item_types = {}
    for sec in sections:
        items = sec.get("itemSectionRenderer", {}).get("contents", [])
        for item in items:
            for k in item.keys():
                item_types[k] = item_types.get(k, 0) + 1
    print("Found item types:", item_types)

    # Check reelShelfRenderer
    reels_count = 0
    for sec in sections:
        items = sec.get("itemSectionRenderer", {}).get("contents", [])
        for item in items:
            if "reelShelfRenderer" in item:
                reels = item["reelShelfRenderer"].get("items", [])
                reels_count += len(reels)
                print(f"reelShelfRenderer items: {len(reels)}")
                if reels:
                    print("First reel sample keys:", list(reels[0].keys()))
                    first = list(reels[0].values())[0]
                    print("Sample reel content:", list(first.keys()))
    print("Total reels:", reels_count)
