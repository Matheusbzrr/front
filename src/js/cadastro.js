document
  .getElementById("cadastro-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("emailCadastro").value.trim();
    const password = document.getElementById("passwordCadastro").value.trim();

    if (!name || !email || !password) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Todos os campos são obrigatórios!",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      });
      return;
    }

    try {
      const response = await fetch(
        "app-lista-compras.vercel.app/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao cadastrar. Tente novamente.");
      }

      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Cadastro realizado com sucesso!",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      }).then(() => {
        // Fechar o modal se ele existir
        const modalElement = document.getElementById("cadastroModal");
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) modal.hide();
        }

        // Resetar o formulário
        document.getElementById("cadastro-form").reset();
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      });
    }
  });
