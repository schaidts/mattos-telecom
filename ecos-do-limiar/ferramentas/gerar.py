"""Gera as páginas HTML do site a partir de dados/capitulo1.json.

Uso:  python3 ferramentas/gerar.py

O texto do roteiro fica só no JSON; as imagens ficam em artes/. Quando uma arte
nova for colocada na pasta certa (artes/paginas/ep1-p01.png, artes/interface/capa.png...),
basta rodar o script de novo e o site passa a usá-la no lugar do aviso de "arte pendente".
"""
import json
from html import escape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = json.loads((RAIZ / "dados/capitulo1.json").read_text(encoding="utf-8"))
ARTES = RAIZ / "artes"


def existe(rel):
    return (RAIZ / rel).is_file()


def arte_interface(nome):
    """Arte final de interface (capa, retratos, miniaturas), se já existir."""
    for ext in ("png", "jpg", "webp"):
        rel = f"artes/interface/{nome}.{ext}"
        if existe(rel):
            return rel
    return None


def arte_pagina(pid):
    for ext in ("png", "jpg", "webp"):
        rel = f"artes/paginas/{pid}.{ext}"
        if existe(rel):
            return rel
    return None


def retrato(pid):
    return arte_interface(pid) or f"artes/web/retrato-{pid}.jpg"


ICONE_LIVRO = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z" '
               'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6v13.5" stroke="currentColor" stroke-width="1.6"/></svg>')
SETA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

FILTRO_TREMIDO = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="tremor">'
                  '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/>'
                  '<feDisplacementMap in="SourceGraphic" scale="7"/></filter></svg>')


def logo(classe=""):
    return (f'<span class="logo {classe}" aria-label="Ecos do Limiar">'
            '<span class="logo-ecos">Ecos</span><span class="logo-do">do</span><span class="logo-limiar">Limiar</span></span>')


def cabecalho(ativo):
    links = [("index.html", "Início", "inicio"), ("ep1.html", "Mangá", "manga"), ("personagens.html", "Personagens", "personagens")]
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if k == ativo else ""}>{t}</a>' for h, t, k in links)
    return (f'<header class="topo"><a class="marca" href="index.html">{ICONE_LIVRO}<span>Ecos do Limiar</span></a>'
            f'<nav class="menu">{nav}</nav></header>')


def documento(titulo, corpo, ativo, descricao=""):
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0d0a12">
<meta name="description" content="{escape(descricao or DADOS['sinopse'])}">
<title>{escape(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bangers&family=Cinzel:wght@600;700&family=Comic+Neue:wght@700&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="estilo.css">
</head>
<body>
{cabecalho(ativo)}
{corpo}
<footer class="rodape"><p>Ecos do Limiar · {escape(DADOS['capitulo'])}</p><p>História e roteiro: {escape(DADOS['autora'])}</p></footer>
</body>
</html>
"""


# ---------------------------------------------------------------- início
def episodio_linha(ep):
    thumb = arte_interface(f"ep{ep['n']}-thumb")
    midia = (f'<img src="{thumb}" alt="" loading="lazy">' if thumb
             else f'<span class="ep-num" aria-hidden="true">{ep["n"]:02d}</span>')
    return (f'<li><a class="ep-linha" href="ep{ep["n"]}.html"><span class="ep-midia">{midia}</span>'
            f'<span class="ep-texto"><strong>Episódio {ep["n"]} — {escape(ep["titulo"])}</strong>'
            f'<small>{escape(ep["resumo"])}</small><small class="ep-meta">{len(ep["paginas"])} páginas</small></span>{SETA}</a></li>')


def card_personagem(p):
    return (f'<li><a class="card" href="personagens.html#{p["id"]}"><img src="{retrato(p["id"])}" alt="Retrato de {escape(p["nome"])}" loading="lazy" width="480" height="480">'
            f'<span><strong>{escape(p["nome"])}</strong><small>{escape(p["bio"])}</small></span></a></li>')


def pagina_inicio():
    capa = arte_interface("capa")
    fundo = capa or "artes/web/hero-kael.jpg"
    classe = "hero tem-capa" if capa else "hero"
    tags = "".join(f"<li>{escape(g)}</li>" for g in DADOS["generos"])
    eps = "".join(episodio_linha(e) for e in DADOS["episodios"])
    principais = "".join(card_personagem(p) for p in DADOS["personagens"] if p["principal"])
    corpo = f"""<main>
<section class="{classe}" style="--fundo:url('{fundo}')">
  <div class="hero-conteudo">
    <h1>{logo('logo-grande')}</h1>
    <ul class="tags">{tags}<li>{escape(DADOS['classificacao'])}</li></ul>
    <p class="sinopse">{escape(DADOS['sinopse'])}</p>
    <div class="acoes"><a class="botao" href="ep1.html">{ICONE_LIVRO}Ler o mangá</a><a class="botao botao-sec" href="personagens.html">Personagens</a></div>
  </div>
</section>
<section class="bloco" id="capitulo">
  <div class="bloco-titulo"><h2>{escape(DADOS['capitulo'])}</h2><span>{len(DADOS['episodios'])} episódios</span></div>
  <ul class="episodios">{eps}</ul>
</section>
<section class="bloco">
  <div class="bloco-titulo"><h2>Personagens principais</h2><a href="personagens.html">Ver todos</a></div>
  <ul class="cards">{principais}</ul>
</section>
</main>"""
    return documento("Ecos do Limiar", corpo, "inicio")


# ---------------------------------------------------------------- personagens
def pagina_personagens():
    blocos = []
    for p in DADOS["personagens"]:
        idade = f'{p["idade"]} anos · ' if p["idade"] else ""
        fichas = "".join(
            f'<a href="artes/fichas/{f}.png" class="ficha"><img src="artes/web/ficha-{f}.jpg" alt="Ficha de referência de {escape(p["nome"])} ({"colorida" if f.endswith("cor") else "preto e branco"})" loading="lazy" width="1400" height="933">'
            f'<span>{"Colorida" if f.endswith("cor") else "Preto e branco"}</span></a>' for f in p["fichas"])
        blocos.append(f"""<article class="perfil" id="{p['id']}">
  <header><img src="{retrato(p['id'])}" alt="" width="480" height="480" loading="lazy"><div><h2>{escape(p['nome'])}</h2><p class="perfil-meta">{idade}{escape(p['papel'])}</p></div></header>
  <p>{escape(p['bio'])}</p>
  <div class="fichas">{fichas}</div>
</article>""")
    corpo = f'<main class="estreito"><a class="voltar" href="index.html">← Início</a><h1 class="titulo-pagina">Personagens</h1>{"".join(blocos)}</main>'
    return documento("Personagens — Ecos do Limiar", corpo, "personagens")


# ---------------------------------------------------------------- leitor
ROTULO = {"narr": "Narração", "sfx": "Som", "final": ""}


def fala_html(fala, i, posicionar=False):
    tipo, quem, texto = fala[0], fala[1], fala[2]
    pos = fala[3] if len(fala) > 3 else None
    estilo = f' style="left:{pos[0]}%;top:{pos[1]}%"' if (posicionar and pos) else ""
    lado = " direita" if (tipo not in ("narr", "sfx", "final") and i % 2) else ""
    rotulo = quem or ROTULO.get(tipo, "")
    quem_html = f'<span class="quem">{escape(rotulo)}</span>' if rotulo and tipo not in ("sfx", "final") else ""
    if tipo == "grito":
        miolo = f'<span class="grito-borda"><span class="grito-miolo">{escape(texto)}</span></span>'
    else:
        miolo = f'<span class="texto">{escape(texto)}</span>'
    return f'<p class="fala t-{tipo}{lado}"{estilo}>{quem_html}{miolo}</p>'


def arte_quadro(pid, n):
    for ext in ("jpg", "png", "webp"):
        rel = f"artes/quadros/{pid}-q{n}.{ext}"
        if existe(rel):
            return rel
    return None


# posições padrão dos balões sobre a arte (cantos alternados, como na referência)
CANTOS = [("8%", "7%", "esq topo"), ("auto", "7%", "dir base"), ("auto", "7%", "dir topo"), ("8%", "7%", "esq base")]


def quadro_html(pg, q, n):
    classes = ["quadro", q.get("tam", "normal")]
    if q.get("vermelho"):
        classes.append("vermelho")
    if q.get("flashback"):
        classes.append("flashback")
    arte = arte_quadro(pg["id"], n)
    if arte:
        classes.append("com-arte")
        foco = q.get("foco", "center")
        falas = "".join(
            fala_html(f, i).replace('<p class="fala ', f'<p class="fala canto-{(i if len(q["falas"]) > 1 or f[0] != "sfx" else 1) % 4} ', 1)
            for i, f in enumerate(q["falas"]))
        return (f'<div class="{" ".join(classes)}"><img src="{arte}" alt="{escape(q["cena"])}" loading="lazy" style="object-position:{foco}">'
                f'<div class="balao-camada">{falas}</div></div>')
    cor = (f'<span class="nota-cor">Vermelho carmesim: {escape(q["vermelho"])}</span>' if q.get("vermelho") else "")
    falas = "".join(fala_html(f, i) for i, f in enumerate(q["falas"]))
    return (f'<div class="{" ".join(classes)} pendente"><div class="cena"><span class="q-num">Q{n} · arte pendente</span>'
            f'<span class="q-desc">{escape(q["cena"])}</span>{cor}</div><div class="falas">{falas}</div></div>')


def pagina_html(ep, pg, idx, total):
    cab = f'<h2 class="pg-rotulo"><span>Página {idx}</span> de {total}</h2>'
    classe = "pagina impacto" if pg.get("impacto") else "pagina"
    arte = arte_pagina(pg["id"])
    if arte:
        # página inteira entregue pelo ChatGPT: balões com "pos" vão por cima; os sem posição ficam numa faixa abaixo
        todas = [f for q in pg["quadros"] for f in q["falas"]]
        sobre = "".join(fala_html(f, i, True) for i, f in enumerate(todas) if len(f) > 3)
        resto = [f for f in todas if len(f) <= 3]
        legenda = ('<div class="falas legenda">' + "".join(fala_html(f, i) for i, f in enumerate(resto)) + "</div>") if resto else ""
        alt = " ".join(q["cena"] for q in pg["quadros"])
        conteudo = (f'<figure class="arte"><img src="{arte}" alt="{escape(alt)}" loading="lazy">'
                    f'<div class="sobreposicao">{sobre}</div></figure>{legenda}')
        return f'<section class="{classe}" id="p{idx:02d}" aria-label="Página {idx}">{cab}{conteudo}</section>'
    conteudo = '<div class="quadros">' + "".join(quadro_html(pg, q, n) for n, q in enumerate(pg["quadros"], 1)) + "</div>"
    return f'<section class="{classe}" id="p{idx:02d}" aria-label="Página {idx}">{cab}{conteudo}</section>'


def pagina_episodio(ep):
    eps = DADOS["episodios"]
    n, total = ep["n"], len(ep["paginas"])
    abas = "".join(
        f'<a href="ep{e["n"]}.html" class="aba"{" aria-current=\"page\"" if e["n"] == n else ""}><strong>Episódio {e["n"]}</strong><small>{escape(e["titulo"])}</small></a>'
        for e in eps)
    salto = "".join(f'<a href="#p{i:02d}">{i}</a>' for i in range(1, total + 1))
    paginas = "".join(pagina_html(ep, pg, i, total) for i, pg in enumerate(ep["paginas"], 1))
    ant = (f'<a class="botao botao-sec" href="ep{n-1}.html">← Episódio anterior</a>' if n > 1
           else '<a class="botao botao-sec" href="index.html">← Início</a>')
    prox = (f'<a class="botao" href="ep{n+1}.html">Próximo episódio →</a>' if n < len(eps)
            else '<a class="botao" href="index.html">Voltar ao início</a>')
    qt = [(pg["id"], n) for pg in ep["paginas"] for n in range(1, len(pg["quadros"]) + 1)]
    pendentes = sum(1 for pid, n in qt if not (arte_quadro(pid, n) or arte_pagina(pid)))
    aviso = (f'<p class="aviso">{len(qt) - pendentes} de {len(qt)} quadros deste episódio já têm arte. '
             'Os demais mostram a cena do roteiro com os balões na ordem de leitura até a ilustração chegar.</p>') if pendentes else ""
    corpo = f"""{FILTRO_TREMIDO}<main class="leitor">
<a class="voltar" href="index.html">← Início</a>
<h1 class="titulo-pagina">{escape(DADOS['capitulo'])} <span>· Episódio {n} — {escape(ep['titulo'])}</span></h1>
<nav class="abas" aria-label="Episódios">{abas}</nav>
<details class="salto"><summary>Ir para a página</summary><div>{salto}</div></details>
{aviso}
{paginas}
<div class="fim-ep">{'<p class="fim-cap">Fim do Capítulo 1</p>' if n == len(eps) else ''}<div class="nav-ep">{ant}{prox}</div></div>
</main>"""
    return documento(f"Episódio {n} — {ep['titulo']} · Ecos do Limiar", corpo, "manga", ep["resumo"])


def main():
    saidas = {"index.html": pagina_inicio(), "personagens.html": pagina_personagens()}
    for ep in DADOS["episodios"]:
        saidas[f"ep{ep['n']}.html"] = pagina_episodio(ep)
    for nome, html in saidas.items():
        (RAIZ / nome).write_text(html, encoding="utf-8")
        print("gerado", nome)


if __name__ == "__main__":
    main()
