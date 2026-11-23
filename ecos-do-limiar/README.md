# Ecos do Limiar — site de leitura (Capítulo 1)

História e roteiro: Débora. Site estático em HTML + CSS, pensado para celular.

## Abrir
Abra `index.html` no navegador (ou publique a pasta em qualquer hospedagem estática).

## Estrutura
- `dados/capitulo1.json` — todo o texto do roteiro (narrações, falas, SFX), separado das imagens.
- `artes/fichas/` — fichas de personagem originais (PNG). `artes/cenarios/` — cenários.
- `artes/quadros/` — arte de cada quadro, nomeada `ep1-p03-q2.jpg` (episódio, página, quadro). Imagem 16:9, sem texto.
- `artes/interface/` — (opcional) `capa.png`, `kael.png`, `ep1-thumb.png`… quando existirem, substituem os recortes das fichas.
- `estilo.css` — visual do site e dos balões.

## Ferramentas
- `python3 ferramentas/gerar.py` — gera `index.html`, `personagens.html` e `ep1-3.html`. Rode sempre que adicionar arte.
- `python3 ferramentas/prompts.py` — gera `PROMPTS_QUADROS.md` com o prompt pronto de cada quadro que ainda não tem arte.
- `python3 ferramentas/recortes.py` — refaz as versões web das fichas e os retratos.

Quadros sem arte aparecem com a descrição da cena e os balões na ordem de leitura, até a ilustração chegar.
