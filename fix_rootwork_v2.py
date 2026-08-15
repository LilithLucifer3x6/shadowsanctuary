import sys

with open('src/screens/Rootwork.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = '<div className="tome-grid mt-4" style={{ width: \'100%\' }}>\n          <div className="tome-main-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>\n            <div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>'

replacement1 = '<div className="tome-grid mt-4" style={{ width: \'100%\' }}>\n            <div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>'

target2 = '            <div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n              <h3 style={{ justifyContent: \'center\' }}>The Waning'

replacement2 = '            <div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n              <h3 style={{ justifyContent: \'center\' }}>The Waning'
# Actually wait, Waning is nested deeper because it's inside tome-main-col.
# Let's just use string finding.

idx1 = text.find('<div className="tome-main-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>')
if idx1 == -1:
    print("tome-main-col not found")
    sys.exit(1)

text = text[:idx1] + text[idx1 + len('<div className="tome-main-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>'):]

# The waning block ends before rites2.
rites2_idx = text.find('<div className="rites2 mt-4" style={{ width: \'100%\' }}>')
if rites2_idx == -1:
    print("rites2 not found")
    sys.exit(1)

# Find the </div> just before rites2_idx
end_div_idx = text.rfind('</div>', 0, rites2_idx)
text = text[:end_div_idx] + text[end_div_idx + 6:]

with open('src/screens/Rootwork.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Success")
