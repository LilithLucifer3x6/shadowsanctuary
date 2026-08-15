import sys

with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Find the start of tome-grid
grid_start = text.find('<div className="tome-grid mt-4"')

# We know the markers
summon = text.find('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll')
waning = text.find('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Waning')
toll = text.find('<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ textAlign: \'center\' }}>The Silver Toll')
echo = text.find('<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Echo')

# Extract block 1 (Summoning Scroll)
b1 = text[summon:waning].strip()
# Extract block 2 (Waning)
b2 = text[waning:toll].strip()
# Extract block 3 (Silver Toll)
end_of_toll_col = text.find('</div>\n        </div>\n\n        <div style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>', toll)
b3 = text[toll:end_of_toll_col].strip()

# Extract block 4 (Echo)
end_of_echo_col = text.find('</div>\n        </div>\n      </div>\n\n      {showAddModal && (', echo)
b4 = text[echo:end_of_echo_col].strip()

# Construct new tome grid
new_grid = f"""<div className="tome-grid mt-4" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {b4}
        {b3}
        {b1}
        {b2}
      </div>

      {{showAddModal && ("""

before = text[:grid_start]
after_start = text.find('{showAddModal && (', echo)
after = text[after_start + 18:]

with open('src/screens/Rootwork.jsx', 'w', encoding='utf-8') as f:
    f.write(before + new_grid + after)

print("Success")
