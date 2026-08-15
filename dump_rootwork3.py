with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find('<div className="tome-grid')
print(text[idx+4500:idx+9000])
