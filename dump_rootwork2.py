with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find('<div className="tome-grid')
print(text[idx:idx+4500])
