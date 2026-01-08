import csv

def load_csv(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            tags_list = r["tags"].split(";") if r["tags"] else []
            content = f"{r['title']}. {r['description']}. Tags: {', '.join(tags_list)}."
            rows.append({
                "id": r["id"],
                "type": r["type"],
                "title": r["title"],
                "description": r["description"],
                "tags": tags_list,
                "severity": int(r["severity"]),
                "created_at": r["created_at"],
                "content": content
            })
    return rows

if __name__ == "__main__":
    data = load_csv("data/rag_knowledge_base.csv")
    print(f"Loaded {len(data)} rows")
    print(data[0])