
let itemEditando = null; 
let itensLista = []; 

function sair() {
  Swal.fire({
    title: "Tem certeza que deseja sair?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#6e6d6d",
    cancelButtonColor: "#118C5F",
    confirmButtonText: "Sim, sair!",
    cancelButtonText: "Ficar na listinha",
    background: "#FEFAF6",
    color: "#242424",
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove o token do localStorage
      localStorage.removeItem("token");

      // Redireciona para a página inicial
      window.location.href = "/index.html";
    }
  });

  // Prevenir que o link seja seguido imediatamente
  return false;
}

function adicionarItem() {
  const produto = document.getElementById("produtoInput").value.trim();
  const quantidade = parseFloat(
    document.getElementById("quantidadeInput").value
  );
  const unidade = document.getElementById("unidadeSelect").value;

  const novoItem = {
    nameItem: produto,
    amountItem: quantidade,
    measurementUnit: unidade,
  };

  itensLista.push(novoItem);
  atualizarListaExibida();

  // Limpa os inputs após adicionar
  document.getElementById("produtoInput").value = "";
  document.getElementById("quantidadeInput").value = "1";
  document.getElementById("produtoInput").focus();
}

function atualizarListaExibida() {
  const listaItens = document.querySelector("#listaItens ul");
  listaItens.innerHTML = "";

  itensLista.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center"
    );

    li.innerHTML = `
      <span><strong>${item.nameItem}</strong> - ${item.amountItem} ${item.measurementUnit}</span>
      <div>
        <button class="btn btn-primary btn-sm me-2" title="Editar item" onclick="editarItem(${index})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-danger btn-sm" title="Remover item" onclick="removerItem(${index})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;

    listaItens.appendChild(li);
  });
}

function removerItem(index) {
  itensLista.splice(index, 1);
  atualizarListaExibida();
}

function criarCardLista(lista) {
  const cardsContainer = document.getElementById("cardsContainer");
  const cardHTML = `
    <div class="col" id="card-${lista.listId}">
      <div class="card h-100 lista-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title">Lista de Compras</h5>
            <button class="btn btn-danger btn-sm" onclick="deletarLista('${
              lista.listId
            }')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <p class="card-text"><small class="text-muted">Criada em: ${new Date(
            lista.createdAt
          ).toLocaleDateString("pt-BR")}</small></p>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-link" onclick="abrirModalLista('${
            lista.listId
          }')">
            Ver Itens <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>`;
  cardsContainer.insertAdjacentHTML("afterbegin", cardHTML);
}


function editarItem(index) {
  if (index < 0 || index >= itensLista.length) return;
  
  itemEditando = index;
  const item = itensLista[index];
  
  // Preenche o modal com os dados atuais
  document.getElementById('editProduto').value = item.nameItem;
  document.getElementById('editQuantidade').value = item.amountItem;
  document.getElementById('editUnidade').value = item.measurementUnit;
  
  // Abre o modal
  const modal = new bootstrap.Modal(document.getElementById('modalEdicao'));
  modal.show();
}

// Adicione este evento depois que o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('salvarEdicao').addEventListener('click', function() {
    const produto = document.getElementById('editProduto').value.trim();
    const quantidade = parseFloat(document.getElementById('editQuantidade').value);
    const unidade = document.getElementById('editUnidade').value;
    
    // Validações
    if (!produto) {
      alert('Por favor, insira o nome do produto!');
      return;
    }
    
    if (isNaN(quantidade)) {
      alert('Por favor, insira uma quantidade válida!');
      return;
    }
    
    // Atualiza o item
    itensLista[itemEditando] = {
      nameItem: produto,
      amountItem: quantidade,
      measurementUnit: unidade
    };
    
    atualizarListaExibida();
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEdicao'));
    modal.hide();
  });
});
const API_URL = "http://localhost:3000/shopping";
const token = localStorage.getItem("token");

if (!token) {
  Swal.fire({
    title: "Atenção!",
    text: "Você precisa estar logado para acessar suas listas!",
    icon: "warning",
    confirmButtonColor: "#6e6d6d",
  }).then(() => {
    window.location.href = "/login.html";
  });
}

async function carregarListasDoUsuario() {
  try {
    // Exibe o alerta de carregamento e armazena a referência
    Swal.fire({
      title: "Carregando listas...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Realiza a requisição para buscar as listas
    const response = await fetch(`${API_URL}/search`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Adiciona um delay de 1.5s para melhor experiência do usuário
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fecha o Swal de carregamento
    Swal.close();

    if (!response.ok) {
      throw new Error("Erro ao carregar listas");
    }

    const listas = await response.json();
    document.getElementById("cardsContainer").innerHTML = ""; // Limpa os cards existentes
    listas.forEach(criarCardLista);
  } catch (error) {
    // Fecha o Swal de carregamento antes de exibir erro
    Swal.close();

    console.error("Erro ao carregar listas:", error);

    // Exibe alerta de erro
    await Swal.fire({
      title: "Erro!",
      text: "Ocorreu um erro ao carregar suas listas.",
      icon: "error",
      confirmButtonColor: "#6e6d6d",
    });
  }
}

async function exportarLista() {
  if (itensLista.length === 0) {
    await Swal.fire({
      title: "Atenção!",
      text: "A lista está vazia! Adicione itens antes de enviar.",
      icon: "warning",
      confirmButtonColor: "#6e6d6d",
    });
    return;
  }

  const listaCompleta = { items: itensLista };

  // Exibe o alerta de carregamento e armazena a referência
  Swal.fire({
    title: "Salvando lista...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(listaCompleta),
    });

    // Adiciona um delay de 1.5s para melhor experiência do usuário
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fecha o Swal de carregamento
    Swal.close();

    if (!response.ok) {
      throw new Error("Erro ao enviar lista");
    }

    // Fecha o modal antes de exibir o sucesso
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("staticBackdrop")
    );
    modal.hide();

    // Aguarda um pequeno delay para evitar sobreposição visual
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Exibe alerta de sucesso
    await Swal.fire({
      title: "Sucesso!",
      text: "Lista criada com sucesso!",
      icon: "success",
      confirmButtonColor: "#118C5F",
    });

    // Limpa a lista temporária
    itensLista = [];
    document.querySelector("#listaItens ul").innerHTML = "";

    // Recarrega as listas do usuário
    await carregarListasDoUsuario();
  } catch (error) {
    // Fecha o Swal de carregamento antes de exibir erro
    Swal.close();

    console.error("Erro ao enviar lista:", error);

    // Exibe alerta de erro
    await Swal.fire({
      title: "Erro!",
      text: "Ocorreu um erro ao criar a lista.",
      icon: "error",
      confirmButtonColor: "#6e6d6d",
    });
  }
}

async function deletarLista(id) {
  // Confirmação de exclusão
  const result = await Swal.fire({
    title: "Tem certeza?",
    text: "Você não poderá reverter isso!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#6e6d6d",
    cancelButtonColor: "#118C5F",
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    // Exibe o alerta de carregamento de exclusão
    const loadingSwal = Swal.fire({
      title: "Excluindo lista...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Realiza a requisição para excluir a lista
    const response = await fetch(`${API_URL}/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Adiciona um delay de 1.5 segundos para melhorar a experiência do usuário
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fecha o Swal de carregamento
    Swal.close();

    if (!response.ok) {
      throw new Error("Erro ao excluir lista");
    }

    // Exibe alerta de sucesso
    await Swal.fire({
      title: "Excluído!",
      text: "Sua lista foi excluída.",
      icon: "success",
      confirmButtonColor: "#118C5F",
    });

    // Remove o card da lista na interface
    document.getElementById(`card-${id}`).remove();
  } catch (error) {
    // Fecha o Swal de carregamento em caso de erro
    Swal.close();

    console.error("Erro ao excluir lista:", error);
    // Exibe alerta de erro
    Swal.fire({
      title: "Erro!",
      text: "Ocorreu um erro ao excluir a lista.",
      icon: "error",
      confirmButtonColor: "#6e6d6d",
    });
  }
}

async function abrirModalLista(id) {
  try {
    const loadingSwal = Swal.fire({
      title: "Carregando lista...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await fetch(`${API_URL}/search`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await loadingSwal.close();

    if (!response.ok) {
      throw new Error("Erro ao carregar lista");
    }

    const listas = await response.json();
    console.log(listas);
    const lista = listas.find((l) => l.listId === id);

    if (!lista) {
      Swal.fire({
        title: "Erro!",
        text: "Lista não encontrada!",
        icon: "error",
        confirmButtonColor: "#6e6d6d",
      });
      return;
    }

    document.getElementById("listaData").textContent = new Date(
      lista.createdAt
    ).toLocaleDateString("pt-BR");
    const listaItens = document.getElementById("listaItensModal");
    listaItens.innerHTML = "";

    lista.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${index + 1}. ${item.nameItem} - ${item.amountItem} ${
        item.measurementUnit
      }`;
      listaItens.appendChild(li);
    });

    const modal = new bootstrap.Modal(document.getElementById("listaModal"));
    modal.show();
  } catch (error) {
    console.error("Erro ao abrir lista:", error);
    Swal.fire({
      title: "Erro!",
      text: "Ocorreu um erro ao carregar a lista.",
      icon: "error",
      confirmButtonColor: "#6e6d6d",
    });
  }
}

document
  .getElementById("staticBackdrop")
  .addEventListener("hidden.bs.modal", function () {
    itensLista = [];
    document.querySelector("#listaItens ul").innerHTML = "";
    document.getElementById("produtoInput").value = "";
    document.getElementById("quantidadeInput").value = "1";
    document.getElementById("unidadeSelect").value = "Un";
  });

document.addEventListener("DOMContentLoaded", () => {
  carregarListasDoUsuario();
  document
    .getElementById("staticBackdrop")
    .addEventListener("shown.bs.modal", function () {
      document.getElementById("produtoInput").focus();
    });
});
