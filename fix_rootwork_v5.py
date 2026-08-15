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
b2_end = text.find('</div>\n          </div>\n\n          <div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>', waning)
# wait, actually let's just find where waning ends by looking for the toll block.
# waning ends at the closing tag of the card.
# The card ends before `</div>\n        </div>\n\n        <div style={{ display: 'flex'` No, waning ends where toll begins but toll is OUTSIDE the flex wrapper?
# Let's just use string parsing to find the exact cards.
# b1: summon to waning
# b2: waning to toll
b2 = text[waning:toll].strip()
# We need to strip the extra `</div>` that closes tome-main-col at the end of waning.
if b2.endswith('</div>\n        </div>'):
    b2 = b2[:-15].strip()
elif b2.endswith('</div>\n          </div>'):
    b2 = b2[:-17].strip()

# b3: toll to echo
# Wait, toll doesn't go to echo. toll is at the bottom of tome-main-col or what?
# Actually toll goes to the closing div of its col, then echo starts.
# Let's just find where echo starts.
b3 = text[toll:text.find('</div>\n        </div>', toll)].strip()

# b4: echo to the end of echo's card
b4 = text[echo:text.find('</div>\n        </div>', echo)].strip()

# Construct new tome grid
new_grid = f"""<div className="tome-grid mt-4" style={{{{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}}}>
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
