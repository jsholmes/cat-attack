# Builds dinos/index.html (the 3D game) from the 2D game's page (../dinos-2d/) (markup, styles, rules data) plus the 3D source files in src/.
import re,os
here=os.path.dirname(os.path.abspath(__file__))
orig=open(os.path.join(here,'..','dinos-2d','index.html')).read().split('\n')
head='\n'.join(orig[:120])  # up to (not incl.) <script>
head=re.sub(r'<!-- Dino Attack v6.*?-->','<!-- Dino Attack 3D: same game as the 2D v6 (now at /dinos-2d/), drawn with Three.js and 3D dinosaur models built in code. Built by build.py from ../dinos/index.html + src/*.js -->',head,flags=re.S)
head=head.replace('#cv{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}','#gl,#cv{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}\n#gl{background:#8e9688}')
head=head.replace('<canvas id="cv" aria-label="Dino Attack game"></canvas>','<canvas id="gl"></canvas>\n<canvas id="cv" aria-label="Dino Attack game"></canvas>')
head=re.sub(r'<button class="claw".*?</button>\n','',head,flags=re.S)
src=lambda n:open(os.path.join(here,'src',n)).read()
lines=orig
def block(a,b): return '\n'.join(lines[a-1:b])
basics=block(124,156)   # basics + species
ground=block(491,530)   # plantH, noise, ground colours, water, biome, chunk constants, mulberry
assert basics.startswith('const TAU') and 'PLAYABLE' in basics and ground.startswith('const plantH') and 'mulberry' in ground.split('\n')[-1]
out=head+'\n<script type="module">\nimport * as THREE from "./three.module.min.js";\n'+basics+'\n'+ground+'\n'+src('models.js')+'\n'+src('world3d.js')+'\n'+src('game3d.js')+'\n</script>\n</body>\n</html>\n'
open(os.path.join(here,'index.html'),'w').write(out)
print(len(out))
