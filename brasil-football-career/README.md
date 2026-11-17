# Brasil Football Career 3.0

Abra `Brasil_Football_Career_3.0.html` no navegador (arquivo único, funciona offline e no celular).

## Estrutura
- `src/head.html`: estilos e telas (HTML/CSS)
- `src/core.js`: dados, clubes, save (v4), áudio, ícones
- `src/sprites.js`: jogadores, árbitro, retratos e escudos em pixel art
- `src/stadium.js`: estádios, torcida, iluminação, redes, efeitos
- `src/career.js`: calendário, competições, desenvolvimento, treinador, lesões, mercado, eventos, save/exportar/importar
- `src/match.js`: partida (escolhas + barra de tempo), tipos de lance, árbitro, cartões, pênaltis
- `src/ui.js`: menus e telas
- `python3 build.py` remonta o HTML final a partir de `src/`.

## Testador automático
`node tools/autotest.js [semanas] [--mobile] [--shots=pasta]`

Joga a carreira pela interface como um jogador. A cada semana confere as regras do save
(atributos, energia, tabela, gols, histórico, rolagem horizontal). Também testa os espaços de salvamento,
o backup automático, a exportação/importação e a migração de saves antigos. Sai com código 1 se achar problemas.
O parâmetro `?speed=` no endereço do jogo só acelera o relógio para esses testes.

## Saves
Autosave na chave `bfc2` do `localStorage`, com backup automático (`bfc2_bak`), 3 espaços manuais e exportação
em arquivo `.json`. Carreiras das versões 2.0, 3.0 e 3.1 são migradas automaticamente.
