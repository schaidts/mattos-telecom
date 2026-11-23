"""Gera PROMPTS_QUADROS.md: um prompt pronto para cada quadro que ainda não tem arte.

Uso:  python3 ferramentas/prompts.py

Cada prompt junta o estilo base do roteiro, o visual fixo dos personagens que aparecem
na cena e a descrição do quadro. Gere a imagem (16:9, sem texto), salve com o nome indicado
em artes/quadros/ e rode  python3 ferramentas/gerar.py  para o site usar a arte.
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = json.loads((RAIZ / "dados/capitulo1.json").read_text(encoding="utf-8"))

ESTILO = ("Single wide manga panel, 16:9, modern shonen dark fantasy style, black and white ink with screentone, "
          "high detail, dramatic lighting and strong shadows. Absolutely no text, no letters, no speech bubbles, "
          "no sound effects, no panel borders. Leave some empty space in the corners where speech bubbles can be "
          "added later. Characters must match the attached reference sheets exactly.")
VERMELHO = "Black and white except the elements marked red, which glow in crimson red: "

# visual fixo, copiado do roteiro
VISUAL = {
    "Kael": ("kael-pb", "teenage boy, messy spiky black hair with long bangs over the forehead, sharp dark red eyes, lean athletic build, black hooded cloak over a dark tunic, brown leather belt and wrist wraps"),
    "Lyra": ("lyra-pb", "young woman, long straight lavender-silver hair with side bangs and one thin braid, violet eyes, calm expression, white and lilac mage robe with silver embroidery, crescent-shaped silver hairpin"),
    "Dorian": ("dorian-pb", "young man, short messy blond hair, amber eyes, confident smirk, brown leather jacket with rolled sleeves, two daggers on the belt"),
    "Sienna": ("sienna-pb", "young woman, shoulder-length crimson red hair, ruby eyes, determined look, light silver knight armor over a dark red tunic, long sword"),
    "Bram": ("bram-pb", "burly middle-aged man, short grey beard, bald head, burn scars on forearms, leather blacksmith apron"),
    "Pip": ("pip-pb", "small girl, short choppy dark hair, big eyes, oversized patched coat, basket of bread"),
    "Morvain": ("morvain-pb", "tall hooded figure in a tattered black robe, face hidden in shadow except glowing white eyes and a thin smile, long clawed pale fingers"),
    "Ecoante": (None, "shapeless creature of swirling black smoke, many glowing white eyes, jagged red cracks across the body, long smoky claws"),
}
MARCA = "glowing red crack-like mark on his left cheek running down the neck"


def arte_existe(pid, n):
    return any((RAIZ / f"artes/quadros/{pid}-q{n}.{e}").is_file() for e in ("jpg", "png", "webp"))


def main():
    linhas = ["# Prompts dos quadros — Ecos do Limiar", "",
              "Gerado por `ferramentas/prompts.py` a partir do roteiro. Formato: imagem 16:9, sem texto.",
              "Salve cada imagem em `artes/quadros/` com o nome indicado e rode `python3 ferramentas/gerar.py`.", ""]
    total = 0
    for ep in DADOS["episodios"]:
        linhas += [f"## Episódio {ep['n']} — {ep['titulo']}", ""]
        for pg in ep["paginas"]:
            for n, q in enumerate(pg["quadros"], 1):
                if arte_existe(pg["id"], n):
                    continue
                total += 1
                nomes = [k for k in VISUAL if k in q["cena"] or (k == "Ecoante" and "fumaça" in q["cena"] and "olhos brancos" in q["cena"])]
                if "encapuzada" in q["cena"] and "Morvain" not in nomes:
                    nomes.append("Morvain")
                fichas = [VISUAL[k][0] for k in nomes if VISUAL[k][0]]
                partes = [ESTILO]
                if q.get("vermelho"):
                    partes.append(VERMELHO + q["vermelho"] + ".")
                for k in nomes:
                    extra = ""
                    if k == "Kael":
                        marcado = ep["n"] == 3 or (ep["n"] == 2 and pg["id"] >= "ep2-p06")
                        extra = f", {MARCA}" if marcado else ", no mark on his face"
                    partes.append(f"{k}: {VISUAL[k][1]}{extra}.")
                partes.append(f"Cena: {q['cena']}")
                linhas += [f"### `{pg['id']}-q{n}.jpg`",
                           f"Anexar: {', '.join(f'artes/fichas/{f}.png' for f in fichas) or 'nenhuma ficha'}", "",
                           "```", "\n".join(partes), "```", ""]
    (RAIZ / "PROMPTS_QUADROS.md").write_text("\n".join(linhas), encoding="utf-8")
    print(f"{total} quadros sem arte -> PROMPTS_QUADROS.md")


if __name__ == "__main__":
    main()
