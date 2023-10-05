const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");

  fetch("/admin/delete-product/" + prodId, {
    method: "DELETE",
    headers: { "csrf-token": csrf },
  })
    .then((result) => result.json())
    .then((data) => {
      console.log(data);
      //   productElement.remove();
      productElement.parentNode.removeChild(productElement);
    })
    .catch((err) => console.log(err));
};

const menuBtn = document.getElementById("nav_button");
const menu = document.querySelector(".drop_down");

menuBtn.addEventListener("click", () => {
  menu.classList.toggle("visible");
});
