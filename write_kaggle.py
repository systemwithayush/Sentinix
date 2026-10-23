import os, json
p = os.path.expanduser('~/.kaggle/kaggle.json')
os.makedirs(os.path.dirname(p), exist_ok=True)
data = {"username": "ayush", "key": "KGAT_6f47e0d1d24dd9eacdee0a06c495f053"}
with open(p, 'w') as f:
    json.dump(data, f)
print("Written properly")
