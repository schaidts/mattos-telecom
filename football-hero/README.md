# CRAQUE · Rumo à Glória

Jogo de futebol 3D de carreira para navegador (celular e desktop), focado em **jogadas de ataque desenhadas com o dedo ou o mouse**. Identidade, interface, modelos, texturas e sons são 100% originais e gerados proceduralmente — nenhum asset externo.

## Como rodar

Os módulos ES precisam de um servidor HTTP (abrir o `index.html` direto pelo `file://` não funciona):

```bash
cd football-hero
npx http-server -p 8080 .      # ou: python3 -m http.server 8080
# abra http://localhost:8080
```

Funciona offline: o Three.js (r160, licença MIT) está em `js/lib/`. As fontes do Google têm fallback para fontes do sistema. Para publicar, basta servir a pasta (ex.: GitHub Pages).

## Como jogar

- **Passe:** arraste a partir do jogador com a bola até um companheiro (o anel amarelo confirma o alvo).
- **Enfiada:** desenhe no espaço vazio à frente de um companheiro em corrida; ele corre até a bola.
- **Cruzamento / lançamento:** passes longos (>21 m) ou cruzamentos para a área saem pelo alto.
- **Chute:** termine a linha **sobre o gol**: o ponto onde você solta é o ponto da meta. Curve a linha para curvar o chute; deslize mais rápido para mais força.
- **De primeira:** com a bola no ar (câmera lenta), desenhe a partir do receptor: cabeçada, voleio ou bicicleta, conforme a altura e a direção da bola.
- Atalhos: `Esc`/`P` pausar · `R` reiniciar · `F` tela cheia · `M` mudo · `Enter` confirmar.

## Conteúdo

- 5 capítulos × 5 fases (25 fases): jogadas abertas, escanteios e faltas com barreira.
- Objetivos: marcar, marcar com seu jogador, de cabeça, de primeira, N passes e marcar, assistência, chute de longe, limite de ações. Até 3 estrelas por fase e 3 tentativas.
- IA: zagueiros marcam, fecham linhas de passe, planejam interceptações, dão carrinho e cabeceiam; barreira salta; goleiro fecha o ângulo, sai nos cruzamentos e defende conforme alcance, tempo de reação e colocação do chute. Companheiros fazem infiltrações e tabelas.
- Física: voo roteirizado a partir do desenho e, perto do gol ou com bola solta, simulação livre (gravidade, quique, atrito, efeito Magnus, traves/travessão, rede).
- Menu, Carreira (capítulos, temporada, histórico), Meu Jogador (personalização com prévia 3D), Estatísticas, Conquistas (18), Configurações (volumes, qualidade gráfica, guias, câmera lenta, tremor de câmera, reinício de progresso).
- Progresso salvo em `localStorage`.

## Estrutura

```
index.html
css/  style.css · menu.css · gameplay.css · responsive.css
js/   main.js (boot e loop) · game.js (máquina de estados) · scene.js (estádio)
      camera.js · player.js (rig e animações) · ball.js · physics.js
      trajectory.js (desenho → plano de voo) · ai.js · goalkeeper.js
      levels.js · levelManager.js · career.js · saveSystem.js · audio.js
      ui.js · icons.js · config.js · utils.js · lib/three.module.min.js
assets/icons/icon.svg
```

Ganchos de depuração: `window.CRAQUE` (game, ui, save, career, stage, audio) e `CRAQUE.game.debugState()`.
