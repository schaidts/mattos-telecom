"""Gera versões web (JPG) das fichas e retratos quadrados recortados das próprias fichas."""
from pathlib import Path
from PIL import Image
RAIZ = Path(__file__).resolve().parent.parent
F, W = RAIZ / "artes/fichas", RAIZ / "artes/web"
W.mkdir(exist_ok=True)
# caixa (x, y, lado) do retrato quadrado dentro da ficha 1536x1024
RETRATOS = {
    "kael": ("kael-pb", (20, 120, 360)),
    "lyra": ("lyra-cor", (765, 10, 330)),
    "dorian": ("dorian-cor", (715, 15, 340)),
    "sienna": ("sienna-cor", (715, 15, 340)),
    "bram": ("bram-cor", (705, 10, 350)),
    "pip": ("pip-cor", (745, 20, 330)),
    "morvain": ("morvain-cor", (715, 20, 350)),
}
for src in sorted(F.glob("*.png")):
    im = Image.open(src).convert("RGB")
    im.thumbnail((1400, 1400))
    im.save(W / f"ficha-{src.stem}.jpg", quality=82, optimize=True, progressive=True)
for nome, (ficha, (x, y, s)) in RETRATOS.items():
    im = Image.open(F / f"{ficha}.png").convert("RGB").crop((x, y, x + s, y + s))
    im.resize((480, 480), Image.LANCZOS).save(W / f"retrato-{nome}.jpg", quality=85, optimize=True, progressive=True)
# faixa do rosto de Kael (ficha aprovada) para o topo da página inicial enquanto capa.png não existe
Image.open(F / "kael-pb.png").convert("RGB").crop((0, 125, 372, 528)).save(W / "hero-kael.jpg", quality=85, optimize=True, progressive=True)
print("ok")
