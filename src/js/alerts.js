const Alertas = {
  loading: function (titulo = "Carregando...") {
    return Swal.fire({
      title: titulo,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  },

  sucesso: function (texto, titulo = "Sucesso!") {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: "success",
      confirmButtonColor: "#118C5F",
    });
  },

  erro: function (texto, titulo = "Erro!") {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: "error",
      confirmButtonColor: "#6e6d6d",
    });
  },

  confirmacao: function (texto, titulo = "Tem certeza?") {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#6e6d6d",
      cancelButtonColor: "#118C5F",
      confirmButtonText: "Sim",
      cancelButtonText: "Cancelar",
    });
  },
};

export default Alertas;
