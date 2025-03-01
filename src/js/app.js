let listaCompras = [];
let listasSalvas = JSON.parse(localStorage.getItem("listasSalvas")) || [];

function adicionarItem() {
  const produto = document.getElementById("produtoInput").value;
  const quantidade = document.getElementById("quantidadeInput").value;
  const unidade = document.getElementById("unidadeSelect").value;

  if (!produto) {
    alert("Por favor, insira o nome do produto!");
    return;
  }

  const novoItem = { produto, quantidade, unidade, id: Date.now() };
  listaCompras.push(novoItem);
  atualizarLista();
  limparCampos();
}

function exportarLista() {
  if (listaCompras.length === 0) {
    alert("A lista está vazia!");
    return;
  }

  const novaLista = {
    id: Date.now(),
    data: new Date().toLocaleDateString("pt-BR"),
    itens: [...listaCompras],
  };

  listasSalvas.push(novaLista);
  localStorage.setItem("listasSalvas", JSON.stringify(listasSalvas));
  criarCardLista(novaLista);

  listaCompras = [];
  atualizarLista();

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("staticBackdrop")
  );
  if (modal) modal.hide();
}

function deletarLista(id) {
  if (confirm("Tem certeza que deseja excluir esta lista?")) {
    listasSalvas = listasSalvas.filter((lista) => lista.id !== id);
    localStorage.setItem("listasSalvas", JSON.stringify(listasSalvas));
    document.getElementById(`card-${id}`).remove();
  }
}

function criarCardLista(lista) {
  const cardsContainer = document.getElementById("cardsContainer");
  const cardHTML = `
    <div class="col" id="card-${lista.id}">
      <div class="card h-100 lista-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title">Lista de Compras</h5>
            <button class="btn btn-danger btn-sm" onclick="deletarLista(${lista.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <p class="card-text"><small class="text-muted">Criada em: ${lista.data}</small></p>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-link" onclick="abrirModalLista(${lista.id})">
            Ver Itens <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>`;
  cardsContainer.insertAdjacentHTML("afterbegin", cardHTML);
}

function abrirModalLista(id) {
  const lista = listasSalvas.find((l) => l.id === id);
  document.getElementById("listaData").textContent = lista.data;
  const listaItens = document.getElementById("listaItensModal");
  listaItens.innerHTML = "";

  lista.itens.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${index + 1}. ${item.produto} - ${item.quantidade}${
      item.unidade
    }`;
    listaItens.appendChild(li);
  });

  new bootstrap.Modal(document.getElementById("listaModal")).show();
}

function carregarListasSalvas() {
  listasSalvas.forEach(criarCardLista);
}

function limparCampos() {
  document.getElementById("produtoInput").value = "";
  document.getElementById("quantidadeInput").value = 1;
  document.getElementById("unidadeSelect").value = "un";
}

function atualizarLista() {
  const lista = document.querySelector("#listaItens ul");
  lista.innerHTML = "";
  listaCompras.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
                    ${item.produto} - ${item.quantidade}${item.unidade}
                    <button onclick="removerItem(${item.id})" class="btn btn-danger btn-sm">
                        <i class="bi bi-trash"></i>
                    </button>`;
    lista.appendChild(li);
  });
}

function removerItem(id) {
  listaCompras = listaCompras.filter((item) => item.id !== id);
  atualizarLista();
}
