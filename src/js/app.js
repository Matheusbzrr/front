import Alertas from "./alerts.js";
const API_URL = "https://app-lista-compras.onrender.com/shopping";
const token = localStorage.getItem("token");
let listas = [];
let currentListId = null;
let currentEditItemId = null;

function sair() {
  Alertas.confirmacao("Fica na listinha ai pô").then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("token");
      window.location.href = "/index.html";
    }
  });
  return false;
}

async function carregarListasDoUsuario() {
  try {
    Alertas.loading("Carregando listas de usuário...");

    const response = await fetch(`${API_URL}/search`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    Swal.close();

    if (!response.ok) throw new Error("Erro ao carregar listas");

    listas = await response.json();
    const cardsContainer = document.getElementById("cardsContainer");
    cardsContainer.innerHTML = "";

    if (!listas || listas.length === 0) {
      cardsContainer.innerHTML = `
        <div class="col-12 text-center py-4">
          <h5 class="">Você ainda não tem listas criadas.</h5>
          <p class="">Clique no botão a baixo e crie sua primeira lista de compras.</p>
        </div>
      `;
      return;
    }

    const cardTemplate = document.getElementById("cardTemplate");

    listas.forEach((lista) => {
      const cardClone = cardTemplate.content.cloneNode(true);
      const cardElement = cardClone.querySelector(".col");
      cardElement.id = `card-listId-${lista.listId}`;
      cardElement.querySelector(".card-title").textContent =
        lista.nome || "Lista de Compras";
      cardElement.querySelector(
        ".data-criacao"
      ).textContent = `Criada em: ${new Date(
        lista.createdAt
      ).toLocaleDateString("pt-BR")}`;
      const editarBtn = cardElement.querySelector(".editar-btn");
      const deletarBtn = cardElement.querySelector(".deletar-btn");
      const verItensBtn = cardElement.querySelector(".ver-itens-btn");

      editarBtn.addEventListener("click", () => editarLista(lista.listId));
      deletarBtn.addEventListener("click", () => deletarLista(lista.listId));
      verItensBtn.addEventListener("click", () => verItensLista(lista.listId));

      cardsContainer.appendChild(cardClone);
    });
  } catch (error) {
    Swal.close();
    console.error("Erro ao carregar listas:", error);
    await Alertas.erro("Ocorreu um erro ao carregar suas listas.");
  }
}

function verItensLista(listId, editMode = false) {
  currentListId = listId;
  const lista = listas.find((l) => l.listId === listId);

  if (!lista) {
    Alertas.erro("Lista não encontrada");
    return;
  }

  document.getElementById("listaData").textContent = new Date(
    lista.createdAt
  ).toLocaleDateString("pt-BR");

  updateItemsList(lista.items);

  const modal = new bootstrap.Modal(document.getElementById("listaModal"));
  modal.show();
}
async function editarLista(listId) {
  await carregarListasDoUsuario();
  verItensLista(listId, true);
}
function updateItemsList(items) {
  const container = document.getElementById("listaItensModal");
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<li class="list-group-item text-muted">Nenhum item na lista</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <span>${item.nameItem} - ${item.amountItem} ${item.measurementUnit}</span>
      <div>
        <button onclick="startEditItem('${item.itemId}')" class="btn btn-sm btn-warning me-1">
          <i class="bi bi-pencil"></i>
        </button>
        <button onclick="deleteItem('${item.itemId}')" class="btn btn-sm btn-danger">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(li);
  });
}

function showAddItemForm() {
  currentEditItemId = null;
  document.getElementById("editArea").style.display = "block";
  document.getElementById("editNome").value = "";
  document.getElementById("editQuantidade").value = "1";
  document.getElementById("editUnidade").value = "Un";
  document.getElementById("editNome").focus();
}

function startEditItem(itemId) {
  const lista = listas.find((l) => l.listId === currentListId);
  const item = lista.items.find((i) => i.itemId === itemId);

  if (!item) return;

  currentEditItemId = itemId;
  document.getElementById("editArea").style.display = "block";
  document.getElementById("editNome").value = item.nameItem;
  document.getElementById("editQuantidade").value = item.amountItem;
  document.getElementById("editUnidade").value = item.measurementUnit;
}

function cancelEdit() {
  document.getElementById("editArea").style.display = "none";
}

document
  .getElementById("saveEditBtn")
  .addEventListener("click", async function () {
    const name = document.getElementById("editNome").value.trim();
    const amount = document.getElementById("editQuantidade").value;
    const unit = document.getElementById("editUnidade").value;

    if (!name || !amount) {
      Alertas.erro("Preencha todos os campos");
      return;
    }

    const payload = {
      nameItem: name,
      amountItem: parseFloat(amount),
      measurementUnit: unit,
    };

    if (currentEditItemId) {
      payload.itemId = currentEditItemId;
    }

    try {
      const endpoint = currentEditItemId
        ? `${API_URL}/update/${currentListId}`
        : `${API_URL}/update/${currentListId}`;

      const method = "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro na operação");
      }
      await Alertas.sucesso(
        currentEditItemId ? "Item atualizado!" : "Item adicionado!"
      );
      bootstrap.Modal.getInstance(document.getElementById("listaModal")).hide();

      document.getElementById("editArea").style.display = "none";
      carregarListasDoUsuario();
    } catch (error) {
      console.error("Erro:", error);
      Alertas.erro("Operação falhou");
    }
  });

async function deleteItem(itemId) {
  const result = await Alertas.confirmacao(
    "Tem certeza que deseja excluir este item?"
  );

  if (!result.isConfirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/item/${currentListId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId }),
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir");
    }

    await Alertas.sucesso("Item excluído!");
    bootstrap.Modal.getInstance(document.getElementById("listaModal")).hide();
    await carregarListasDoUsuario();
  } catch (error) {
    console.error("Erro:", error);
    await Alertas.erro("Falha ao excluir item");
  }
}
async function deletarLista(listId) {
  Alertas.confirmacao("Tem certeza que deseja deletar esta lista?").then(
    async (result) => {
      if (result.isConfirmed) {
        try {
          Alertas.loading("Deletando lista...");
          const response = await fetch(`${API_URL}/delete/${listId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          await new Promise((resolve) => setTimeout(resolve, 500));
          Swal.close();
          await Alertas.sucesso("Lista deletada com sucesso!");
          carregarListasDoUsuario();
        } catch (error) {
          Swal.close();
          console.error("Erro ao deletar lista:", error);
          await Alertas.erro("Ocorreu um erro ao deletar a lista.");
        }
      }
    }
  );
}

async function exportarLista() {
  const token = localStorage.getItem("token");
  if (!token) {
    Alertas.erro("Usuário não autenticado!");
    return;
  }

  const listaItens = document.querySelectorAll("#listaItens ul li");

  if (listaItens.length === 0) {
    Alertas.erro("Adicione pelo menos um item antes de salvar a lista.");
    return;
  }

  const items = Array.from(listaItens).map((li) => {
    return {
      nameItem: li.dataset.name,
      amountItem: parseFloat(li.dataset.amount),
      measurementUnit: li.dataset.unit,
    };
  });

  const payload = { items };

  try {
    Alertas.loading("Salvando lista...");

    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!response.ok) throw new Error("Erro ao salvar a lista");

    await Alertas.sucesso("Lista criada!");
    bootstrap.Modal.getInstance(
      document.getElementById("modalCriarNovaLista")
    ).hide();

    carregarListasDoUsuario();
    document
      .getElementById("modalCriarNovaLista")
      .addEventListener("hidden.bs.modal", () => {
        document.querySelector("#listaItens ul").innerHTML = "";
      });
  } catch (error) {
    Swal.close();
    console.error("Erro ao salvar a lista:", error);
    Alertas.erro("Ocorreu um erro ao salvar sua lista.");
  }
}

function adicionarItem() {
  const produtoInput = document.getElementById("produtoInput");
  const quantidadeInput = document.getElementById("quantidadeInput");
  const unidadeSelect = document.getElementById("unidadeSelect");
  const listaItens = document.querySelector("#listaItens ul");

  const nomeProduto = produtoInput.value.trim();
  const quantidade = parseFloat(quantidadeInput.value);
  const unidade = unidadeSelect.value;

  if (!nomeProduto || quantidade <= 0) {
    Alertas.erro("Preencha o nome e uma quantidade válida!");
    return;
  }

  const li = document.createElement("li");
  li.classList.add(
    "list-group-item",
    "d-flex",
    "justify-content-between",
    "align-items-center"
  );
  li.dataset.name = nomeProduto;
  li.dataset.amount = quantidade;
  li.dataset.unit = unidade;
  li.innerHTML = `
    ${nomeProduto} - ${quantidade} ${unidade}
    <button class="btn btn-danger btn-sm" onclick="removerItem(this)">❌</button>
  `;

  listaItens.appendChild(li);
  produtoInput.value = "";
  quantidadeInput.value = "1";
}
function removerItem(botao) {
  botao.parentElement.remove();
}

window.exportarLista = exportarLista;
window.adicionarItem = adicionarItem;
window.showAddItemForm = showAddItemForm;
window.sair = sair;
window.startEditItem = startEditItem;
window.cancelEdit = cancelEdit;
window.removerItem = removerItem;
window.deleteItem = deleteItem;
carregarListasDoUsuario();
