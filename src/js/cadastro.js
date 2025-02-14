document
  .getElementById("cadastro-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("emailCadastro").value;
    const password = document.getElementById("passwordCadastro").value;

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
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar");
      }

      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Cadastro realizado com sucesso!",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("cadastroModal")
        );
        modal.hide();
        document.getElementById("cadastro-form").reset();
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      });
    }
  });
