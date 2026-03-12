

const products = [
  {
    name: "Running Shoes",
    price: "$45",
    image: "html/images/shoe.jpg"
  },
  {
    name: "Smart Phone",
    price: "$320",
    image: "html/images/products/headphone.jpg"
  },
  {
    name: "Leather Bag",
    price: "$60",
    image: "html/images/products/sh.jpg"
  },
  {
    name: "Wireless Headphones",
    price: "$80",
    image: "html/images/products/watch.jpg"
  }
];

const productGrid = document.getElementById("product-grid");

products.forEach(product => {

  const productCard = `
  
  <div class="col-md-3">
    <div class="card h-100 shadow-sm">
      <img src="${product.image}" class="card-img-top" alt="${product.name}">

      <div class="card-body text-center">
        <h5 class="card-title">${product.name}</h5>
        <p class="text-danger fw-bold">${product.price}</p>
        <button class="btn btn-warning w-100">Add to Cart</button>
      </div>
    </div>
  </div>
  
  `;

  productGrid.innerHTML += productCard;

});