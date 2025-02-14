window.addEventListener("load", function () {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/src/pages/login.html";
  } else {
    console.log("Token encontrado:", token);

    // Chamar a api
  }
});
