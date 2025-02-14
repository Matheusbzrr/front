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
        const token = localStorage.getItem("token");

        if (token) {
          window.location.href = "/src/pages/app.html";
        } else {
          alert("Token não encontrado. Por favor, faça login novamente.");
        }
      } else {
        alert("Erro no login: " + (data.message || "Credenciais inválidas"));
      }
    } catch (error) {
      console.error("Erro ao logar:", error);
      alert("Ocorreu um erro ao tentar logar.");
    }
  });
