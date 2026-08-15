import sys

with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Instead of parsing everything manually, I will just extract the cards cleanly.
# I will find the start of each card.
s_summon = text.find('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll')
s_waning = text.find('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Waning')
s_toll = text.find('<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ textAlign: \'center\' }}>The Silver Toll')
s_echo = text.find('<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Echo')

# Now find the end of each card.
# The card ends where the next card begins, or where the outer wrapper ends.
# For Summon, it ends at Waning.
card_summon = text[s_summon:s_waning].strip()
# Waning ends at Toll? No, Waning is followed by `</div>\n        </div>\n\n        <div style...`
end_waning = text.find('          </div>\n        </div>', s_waning)
card_waning = text[s_waning:end_waning].strip()

# Toll ends at the end of its outer wrapper.
end_toll = text.find('            })()}\n          </div>\n        </div>', s_toll)
if end_toll != -1:
    end_toll += len('            })()}\n          </div>\n        </div>') - 14 # roughly
else:
    end_toll = text.find('          </div>\n        </div>\n      </div>\n\n      {showAddModal', s_toll)
# Let's just find the closing </div> of the card by counting.
def extract_div(s, start_idx):
    # simple counting to find matching </div>
    count = 0
    i = start_idx
    while i < len(s):
        if s[i:i+4] == '<div':
            count += 1
            i += 4
        elif s[i:i+6] == '</div>':
            count -= 1
            i += 6
            if count == 0:
                return s[start_idx:i]
        else:
            i += 1
    return ""

c_summon = extract_div(text, s_summon)
c_waning = extract_div(text, s_waning)
c_toll = extract_div(text, s_toll)
c_echo = extract_div(text, s_echo)

grid_start = text.find('<div className="tome-grid mt-4"')
after_grid = text.find('{showAddModal && (')

# the tome-grid currently ends with </div></div></div>
# let's rebuild it entirely
new_grid = f"""<div className="tome-grid mt-4" style={{{{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}}}>
        {c_echo}
        {c_toll}
        {c_summon}
        {c_waning}
      </div>

      """

with open('src/screens/Rootwork.jsx', 'w', encoding='utf-8') as f:
    f.write(text[:grid_start] + new_grid + text[after_grid:])

print("Success")
