import os
import json

def explore(path, indent=0):
    prefix = "  " * indent
    for item in sorted(os.listdir(path)):
        if item.startswith('.'):
            continue
        full = os.path.join(path, item)
        if os.path.isdir(full):
            print(f"{prefix}{item}/")
            explore(full, indent + 1)
        else:
            print(f"{prefix}{item}")

print("=== agape-sovereign project structure ===")
explore("/Users/aarondavid/Documents/agape-sovereign")

# Check key config files
for fname in ["firebase.json", ".firebaserc", "firestore.rules", "firestore.indexes.json"]:
    path = f"/Users/aarondavid/Documents/agape-sovereign/{fname}"
    if os.path.exists(path):
        print(f"\n=== {fname} ===")
        with open(path) as f:
            print(f.read())

for fname in ["functions/package.json", "functions/src/index.ts", "functions/index.ts"]:
    path = f"/Users/aarondavid/Documents/agape-sovereign/{fname}"
    if os.path.exists(path):
        print(f"\n=== {fname} ===")
        with open(path) as f:
            print(f.read()[:2000])