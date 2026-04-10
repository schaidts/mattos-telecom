var map = L.map('map').setView([-19.9, -44.0], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
.addTo(map);

let marcadores = [];
let empresasAtivas = { HIGHLINE:true, SBA:true, TBSA:true };

// GPS
navigator.geolocation?.getCurrentPosition(pos => {
  L.marker([pos.coords.latitude, pos.coords.longitude])
  .addTo(map)
  .bindPopup("📍 Você");
});

// Carregar torres
fetch('torres.json')
.then(res => res.json())
.then(data => {

  data.forEach(t => {

    let salvo = localStorage.getItem(t.nome);
    if (salvo) t.status = salvo;

    let cor = t.status === "feito" ? "gray" :
              t.empresa === "HIGHLINE" ? "blue" :
              t.empresa === "SBA" ? "red" : "green";

    let marker = L.circleMarker([t.lat, t.lng], { color: cor, radius: 8 }).addTo(map);

    marker.dados = t;

    marker.bindPopup(`
      <b>${t.nome}</b><br>
      ${t.cidade}<br><br>

      <a href="https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=driving" target="_blank">
      🚗 Ir até torre
      </a><br><br>

      Status: <b>${t.status}</b><br><br>

      <button onclick="marcarFeito('${t.nome}')">
      ✔ Concluir
      </button>
    `);

    marcadores.push(marker);
  });

  atualizarContador();
});

// Funções

function marcarFeito(nome) {
  marcadores.forEach(m => {
    if (m.dados.nome === nome) {
      m.dados.status = "feito";
      localStorage.setItem(nome, "feito");
    }
  });
  location.reload();
}

function atualizarContador() {
  let total = marcadores.length;
  let feitos = marcadores.filter(m => m.dados.status === "feito").length;
  let pendentes = total - feitos;

  document.getElementById("contador").innerText = `${feitos}/${total}`;
  document.getElementById("totalTorres").innerText = total;
  document.getElementById("torresFeitas").innerText = feitos;
  document.getElementById("torresPendentes").innerText = pendentes;
}

function toggleEmpresa(emp) {
  empresasAtivas[emp] = !empresasAtivas[emp];

  marcadores.forEach(m => {
    if (m.dados.empresa === emp) {
      empresasAtivas[emp] ? map.addLayer(m) : map.removeLayer(m);
    }
  });
}

function buscarCidade(cidade) {
  marcadores.forEach(m => {
    if (m.dados.cidade.toLowerCase().includes(cidade.toLowerCase())) {
      map.addLayer(m);
    } else {
      map.removeLayer(m);
    }
  });
}

function proximaTorre() {
  navigator.geolocation.getCurrentPosition(pos => {

    let menor = Infinity;
    let destino;

    marcadores.forEach(m => {
      if (m.dados.status !== "feito") {
        let d = Math.hypot(
          pos.coords.latitude - m.dados.lat,
          pos.coords.longitude - m.dados.lng
        );
        if (d < menor) {
          menor = d;
          destino = m.dados;
        }
      }
    });

    if (destino) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}`);
    }
  });
}

function resetarDia() {
  if(confirm("Resetar tudo?")) {
    localStorage.clear();
    location.reload();
  }
}

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}