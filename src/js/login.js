document
  .getElementById("login-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Impede o envio real do formulário

    const formData = new FormData(this);
    const formObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
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
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: "Tente o login novamente!" || data.message,
          background: "#FEFAF6",
          color: "#242424",
          confirmButtonColor: "#4A2C2A",
        });
      }

      const token = localStorage.getItem("token");

      if (token) {
        window.location.href = "/src/pages/app.html";
      }
    } catch (error) {
      console.error("Erro ao logar:", error);
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Tente o login novamente!",
        background: "#FEFAF6",
        color: "#242424",
        confirmButtonColor: "#4A2C2A",
      });
    }
  });
