document
  .getElementById("login-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("app-lista-compras.vercel.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      });

      const data = await response.json();
      console.log("Resposta do backend:", data);

      if (response.ok) {
        localStorage.setItem("token", data.token);

        Swal.fire({
          icon: "success",
          title: "Login realizado com sucesso!",
          text: "Redirecionando para a aplicação...",
          background: "#FEFAF6",
          color: "#242424",
          confirmButtonColor: "#4A2C2A",
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          window.location.href = "/src/pages/app.html";
        }, 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: data.message || "Tente o login novamente!",
          background: "#FEFAF6",
          color: "#242424",
          confirmButtonColor: "#118C5F",
        });
      }
    } catch (error) {
      console.error("Erro ao logar:", error);
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      });
    }
  });
