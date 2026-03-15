// all our products for the products page//
const products = [
  { name: "shoe", price: "$19.99", image: "html/images/products/sh.jpg" },
  { name: "laptop", price: "$49.99", image: "html/images/products/laptop.jpg" },
    { name: "laptop", price: "$49.99", image: "html/images/categories/Computing/keyboard.jpg" },
      { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/headphone.jpg" },
        { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png" },
        


];


const grid = document.getElementById("grid");


products.forEach(product => {
  const col = document.createElement("div");
  col.className = "col-6 col-sm-4 col-md-3 col-lg-2"; 

  col.innerHTML = `
    <div class="card h-100">
      <img src="${product.image}" class="card-img-top" alt="${product.name}">
      <div class="card-body text-center">
        <h5 class="card-title">${product.name}</h5>
        <p class="text-danger fw-bold">${product.price}</p>
        <button class="btn btn-primary w-100">Add to Cart</button>
      </div>
    </div>
  `;

  grid.appendChild(col);
});

// for the sixt section//


const savedProducts = [
{ name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
{ name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
{ name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
   { name: "laptop", price: "$49.99", image: "html/images/categories/Electronics/camera.png"},
];

const savedgrid = document.getElementById("savedgrid");


savedProducts.forEach(product => {
  const col = document.createElement("div");
  col.className = "col-6 col-sm-4 col-md-3 col-lg-2"; 

  col.innerHTML = `
    <div class="card h-100">
      <img src="${product.image}" class="card-img-top" alt="${product.name}">
      <div class="card-body text-center">
        <h5 class="card-title">${product.name}</h5>
        <p class="text-danger fw-bold">${product.price}</p>
        <button class="btn btn-primary w-100">Add to Cart</button>
      </div>
    </div>
  `;

  savedgrid.appendChild(col);
});



// testing//
