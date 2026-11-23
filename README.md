# Cat Attack

A game invented by Kit. Play it at https://jsholmes.github.io/cat-attack/

Steer with your finger (or mouse, or arrow keys). Eat eggs and little dragons to grow, and crunch all 15 dragon bosses to win.
On an iPad, open the link in Safari, tap Share, then "Add to Home Screen" to get a full-screen Cat Attack icon.

# Dino Attack

A second game, invented by Kit. Play it at https://jsholmes.github.io/cat-attack/dinos/

Pick from 15 dinosaurs (T-Rex, Spinosaurus, Velociraptor, Allosaurus, Dilophosaurus, Carnotaurus, Triceratops, Ankylosaurus, Duckbill, Brachiosaurus, Stegosaurus, Pachycephalosaurus, Iguanodon, Therizinosaurus, Gallimimus) and start as a baby. Drag your finger (or use the arrow keys) to walk and tap a dinosaur to walk over and attack it (or press the Space bar). Eat 3 that are your size to get a star and grow. At size 10, follow the blue arrow to the egg: it hatches your own baby, which follows you around and eats the food you kill. Lakes and rivers have fish that meat eaters can catch.

# Dino Attack in 3D

Since 2026-11-23 the main Dino Attack at /dinos/ is the 3D version: the same game drawn with Three.js, with all 15 dinosaurs built as 3D models in code. Rocks, boulders and tree trunks are solid. Add `?fps` to the link to see the frame rate. The old 2D version is still at https://jsholmes.github.io/cat-attack/dinos-2d/, and the old /dinos-3d/ link redirects to /dinos/.
`dinos/build.py` builds `dinos/index.html` from the 2D page (`dinos-2d/index.html`: markup, styles, species and ground data) plus `dinos/src/*.js`; run `python3 dinos/build.py` after editing either.
