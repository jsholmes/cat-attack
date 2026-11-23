# Builds dinos/index.html (the 3D game) from the 2D game's page (../dinos-2d/) (markup, styles, rules data) plus the 3D source files in src/.
import re,os
here=os.path.dirname(os.path.abspath(__file__))
orig=open(os.path.join(here,'..','dinos-2d','index.html')).read().split('\n')
head='\n'.join(orig[:120])  # up to (not incl.) <script>
head=re.sub(r'<!-- Dino Attack v6.*?-->','<!-- Dino Attack 3D: same game as the 2D v6 (now at /dinos-2d/), drawn with Three.js and 3D dinosaur models built in code. Built by build.py from ../dinos/index.html + src/*.js -->',head,flags=re.S)
head=head.replace('#cv{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}','#gl,#cv{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}\n#gl{background:#8e9688}')
head=head.replace('<canvas id="cv" aria-label="Dino Attack game"></canvas>','<canvas id="gl"></canvas>\n<canvas id="cv" aria-label="Dino Attack game"></canvas>')
head=re.sub(r'<button class="claw".*?</button>\n','',head,flags=re.S)
# the 3D game is called Big Chomp (2026-11-23); the URL stays /dinos/
for o,n in [('<title>Dino Attack</title>','<title>Big Chomp</title>'),('content="Dino Attack"','content="Big Chomp"'),('aria-label="Dino Attack game"','aria-label="Big Chomp game"'),('<h1>DINO <em>ATTACK</em></h1>','<h1>BIG <em>CHOMP</em></h1>')]:
    assert o in head,o;head=head.replace(o,n)
# a bigger, labelled pause button, and a note on the pause screen about the shared world
for o,n in [('<button class="menu" id="menuBtn" aria-label="Pause" hidden>&#10074;&#10074;</button>','<button class="menu" id="menuBtn" aria-label="Pause" hidden><span>&#10074;&#10074;</span> Pause</button>'),
            ('  <h1>PAUSED</h1>\n','  <h1>PAUSED</h1>\n  <h2 id="pauseNote">Everything stops until you tap Keep playing.</h2>\n')]:
    assert o in head,o;head=head.replace(o,n)
head=head.replace('</style>','.menu{width:auto;height:52px;padding:0 16px;display:flex;align-items:center;gap:8px;font-family:var(--body);font-weight:800;font-size:18px;background:#3a3226;border:2px solid var(--amber);box-shadow:0 4px 0 #17130d}.menu span{font-size:16px;letter-spacing:-2px}\n</style>',1)
src=lambda n:open(os.path.join(here,'src',n)).read()
lines=orig
def block(a,b): return '\n'.join(lines[a-1:b])
basics=block(124,156)   # basics + species
ground=block(491,530)   # plantH, noise, ground colours, water, biome, chunk constants, mulberry
assert basics.startswith('const TAU') and 'PLAYABLE' in basics and ground.startswith('const plantH') and 'mulberry' in ground.split('\n')[-1]
out=head+'\n<script type="module">\nimport * as THREE from "./three.module.min.js";\n'+basics+'\n'+ground+'\n'+src('models.js')+'\n'+src('world3d.js')+'\n'+src('game3d.js')+'\n'+src('net.js')+'\n</script>\n</body>\n</html>\n'
open(os.path.join(here,'index.html'),'w').write(out)
print(len(out))
