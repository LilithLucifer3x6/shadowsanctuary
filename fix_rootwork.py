import sys

with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Markers
silver_toll = '<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Silver Toll <SpeakerButton text="The Silver Toll" /></h3>'
echo = '<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Echo <SpeakerButton text="The Echo" /></h3>'
waning = '<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Waning <SpeakerButton text="The Waning" /></h3>'
summon = '<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll <SpeakerButton text="The Summoning Scroll" /></h3>'
grid_end = '</div>\n        </div>\n      </div>\n\n      {modalState && ('

# Extract blocks based on these exact markers
idx_toll = text.find(silver_toll)
idx_echo = text.find(echo)
idx_waning = text.find(waning)
idx_summon = text.find(summon)
idx_grid_end = text.find(grid_end)

if -1 in [idx_toll, idx_echo, idx_waning, idx_summon, idx_grid_end]:
    print("Failed to find one or more markers")
    sys.exit(1)

block_toll = text[idx_toll:idx_echo]

# Find the end of echo block
echo_end = text.find('<div className="rites2 mt-4" style={{ width: \'100%\' }}>')
block_echo = text[idx_echo:echo_end].strip() + '\n          </div>' # Reconstruct closing div of echo since it was stripped before rites2

# Rites2 wrapper div ends at idx_grid_end
block_waning = text[idx_waning:idx_summon]

# Find end of summon
block_summon = text[idx_summon:idx_grid_end]

# Extract before and after
tome_grid_start = text.find('<div className="tome-grid mt-4" style={{ width: \'100%\' }}>')
before = text[:tome_grid_start + 60]
after = text[idx_grid_end:]

new_layout = f"""
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {block_summon.strip()}
          {block_waning.strip()}
          {block_toll.strip()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {block_echo.strip()}
        </div>
"""

with open('src/screens/Rootwork.jsx', 'w', encoding='utf-8') as f:
    f.write(before + new_layout + after)

print("Success")
