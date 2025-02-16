window.addEventListener("load", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/src/pages/login.html";
  } else {
    console.log("Token encontrado:", token);

    // Chamar a api
  }
});

class ShoppingList {
  constructor() {
    this.items = JSON.parse(localStorage.getItem("shoppingList")) || [];
    this.loadItems();
    this.initEvents();
    this.updateCounter();
  }

  initEvents() {
    document
      .getElementById("add-item")
      .addEventListener("click", () => this.addItem());
    document
      .getElementById("product-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addItem();
      });
    document
      .getElementById("quantity-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addItem();
      });
    document
      .getElementById("clear-all")
      .addEventListener("click", () => this.clearAll());
  }

  addItem() {
    const productInput = document.getElementById("product-input");
    const quantityInput = document.getElementById("quantity-input");

    const product = productInput.value.trim();
    const quantity = quantityInput.value.trim();

    if (product && quantity) {
      const [amount, unit] = this.parseQuantity(quantity);

      const newItem = {
        id: Date.now(),
        product,
        amount,
        unit,
        purchased: false,
      };

      this.items.push(newItem);
      this.saveAndReload();

      productInput.value = "";
      quantityInput.value = "";
      productInput.focus();
    } else {
      Swal.fire("Ops!", "Preencha todos os campos corretamente!", "warning");
    }
  }

  parseQuantity(input) {
    const parts = input.split(" ");
    const amount = parts[0] || "";
    const unit = parts.slice(1).join(" ") || "un";
    return [amount, unit];
  }

  deleteItem(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.saveAndReload();
  }

  editItem(id) {
    const item = this.items.find((item) => item.id === id);
    Swal.fire({
      title: "Editar Item",
      html: `
        <input id="edit-product" class="swal2-input" value="${item.product}">
        <input id="edit-quantity" class="swal2-input" value="${item.amount} ${item.unit}">
      `,
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const product = document.getElementById("edit-product").value.trim();
        const quantity = document.getElementById("edit-quantity").value.trim();
        if (!product || !quantity) {
          Swal.showValidationMessage("Preencha todos os campos");
          return false;
        }
        const [amount, unit] = this.parseQuantity(quantity);
        return { product, amount, unit };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        item.product = result.value.product;
        item.amount = result.value.amount;
        item.unit = result.value.unit;
        this.saveAndReload();
      }
    });
  }

  togglePurchased(id) {
    const item = this.items.find((item) => item.id === id);
    item.purchased = !item.purchased;
    this.saveAndReload();
  }

  clearAll() {
    Swal.fire({
      title: "Limpar lista toda?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, limpar!",
    }).then((result) => {
      if (result.isConfirmed) {
        this.items = [];
        this.saveAndReload();
      }
    });
  }

  saveAndReload() {
    localStorage.setItem("shoppingList", JSON.stringify(this.items));
    this.loadItems();
    this.updateCounter();
  }

  loadItems() {
    const list = document.getElementById("shopping-list");
    list.innerHTML = this.items
      .map(
        (coisa) => `
      <li class="list-group-item d-flex justify-content-between align-items-center ${
        coisa.purchased ? "purchased" : ""
      }">
        <div class="form-check d-flex align-items-center gap-3">
          <input 
            class="form-check-input" 
            type="checkbox" 
            ${coisa.purchased ? "checked" : ""}
            onchange="shoppingList.togglePurchased(${coisa.id})"
          >
          <span class="product-name">${coisa.product}</span>
          <span class="badge bg-primary rounded-pill quantity-badge">
            ${coisa.amount} ${coisa.unit}
          </span>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary" onclick="shoppingList.editItem(${
            coisa.id
          })">
            ✏️
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="shoppingList.deleteItem(${
            coisa.id
          })">
            🗑️
          </button>
        </div>
      </li>
    `
      )
      .join("");
  }

  updateCounter() {
    const total = this.items.length;
    document.getElementById("total-items").textContent = `${total} ${
      total === 1 ? "item" : "itens"
    }`;
  }
}

const shoppingList = new ShoppingList();
