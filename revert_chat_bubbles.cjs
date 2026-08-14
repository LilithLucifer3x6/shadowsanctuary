const fs=require('fs');

const p1='src/screens/Grimoire.jsx';
let c1=fs.readFileSync(p1,'utf8');
c1=c1.replace(/textAlign: 'center', \n\s*border: msg\.role === 'user'/g, "textAlign: msg.role === 'user' ? 'right' : 'left', \n                    border: msg.role === 'user'");
fs.writeFileSync(p1,c1);

const p2='src/screens/Intake.jsx';
let c2=fs.readFileSync(p2,'utf8');
c2=c2.replace(/textAlign: 'center'\n\s*}}/g, "textAlign: msg.role === 'user' ? 'right' : 'left'\n                  }}");
fs.writeFileSync(p2,c2);

const p3='src/screens/Rootwork.jsx';
let c3=fs.readFileSync(p3,'utf8');
c3=c3.replace(/textAlign: 'center', \n\s*border: msg\.role === 'user'/g, "textAlign: msg.role === 'user' ? 'right' : 'left', \n                      border: msg.role === 'user'");
fs.writeFileSync(p3,c3);
