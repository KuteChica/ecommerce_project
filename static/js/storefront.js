import { getProducts, createOrder, getProductReviews, addProductReview, hasPurchasedProduct } from "../../backend/server.js";

const CART_KEY = "cartItems";
let storefrontProducts = [];
let activeModalProductId = "";
let activeCategoryFilter = "";
let showAllProducts = false;

function formatPrice(amount) {
    return `GH₵${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const cart = raw ? JSON.parse(raw) : [];
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId) {
    const cart = getCart();
    const existing = cart.find((item) => item.productId === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }

    saveCart(cart);
}

function updateCartQuantity(productId, nextQty) {
    const cart = getCart();
    const index = cart.findIndex((item) => item.productId === productId);
    if (index === -1) return;

    if (nextQty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = nextQty;
    }

    saveCart(cart);
}

function mapById(products) {
    const result = {};
    for (const product of products) {
        result[product.id] = product;
    }
    return result;
}

function safeText(value, fallback) {
    if (!value || typeof value !== "string") return fallback;
    return value;
}

function getUserProfile() {
    try {
        const raw = localStorage.getItem("userProfile");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function renderStars(ratingValue) {
    const rating = Math.max(0, Math.min(5, Number(ratingValue || 0)));
    const rounded = Math.round(rating);
    return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function getRatingAverage(product) {
    return Number(product?.ratingAverage ?? 3);
}

function getRatingCount(product) {
    return Number(product?.ratingCount || 0);
}

function getRatingLabel(product) {
    const avg = getRatingAverage(product);
    const count = getRatingCount(product);
    const reviewWord = count === 1 ? "review" : "reviews";
    return `${renderStars(avg)} (${avg.toFixed(1)} • ${count} ${reviewWord})`;
}

function ensureProductModal() {
    if (document.getElementById("productDetailsModal")) return;

    const modal = document.createElement("div");
    modal.id = "productDetailsModal";
    modal.className = "product-modal";
    modal.innerHTML = `
      <div class="product-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="productModalTitle">
        <button type="button" class="product-modal-close" aria-label="Close" data-close-modal>&times;</button>
        <img id="productModalImage" class="product-modal-image" src="" alt="Product image">
        <h3 id="productModalTitle">Product</h3>
        <p class="label" id="productModalCategory">Category</p>
        <p class="product-rating" id="productModalRating">★★★☆☆ (3.0 • 0 reviews)</p>
        <p class="product-modal-price" id="productModalPrice">GH₵0.00</p>
        <p id="productModalStock">In stock: 0</p>
        <p id="productModalDescription">Description</p>
        <div class="review-section">
          <h4>Customer Reviews</h4>
          <div id="productReviewsList" class="review-list">
            <p class="review-empty">No reviews yet.</p>
          </div>
          <form id="productReviewForm" class="review-form">
            <label for="reviewRating">Your Rating</label>
            <select id="reviewRating">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3" selected>3 - Okay</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Bad</option>
            </select>
            <label for="reviewComment">Review</label>
            <textarea id="reviewComment" placeholder="Share a quick review..."></textarea>
            <button type="submit" class="btn primary">Submit Review</button>
            <p id="reviewHint" class="review-hint"></p>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
        if (event.target === modal || event.target.closest("[data-close-modal]")) {
            modal.classList.remove("open");
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            modal.classList.remove("open");
        }
    });

    const reviewForm = document.getElementById("productReviewForm");
    if (reviewForm) {
        reviewForm.addEventListener("submit", handleReviewSubmit);
    }
}

function renderModalReviews(reviews) {
    const list = document.getElementById("productReviewsList");
    if (!list) return;

    if (!reviews.length) {
        list.innerHTML = "<p class=\"review-empty\">No reviews yet. Be the first reviewer.</p>";
        return;
    }

    list.innerHTML = reviews.map((review) => `
      <article class="review-item">
        <p><strong>${safeText(review.reviewerName, "Customer")}</strong></p>
        <p class="review-stars">${renderStars(review.rating)} (${Number(review.rating || 0).toFixed(1)})</p>
        <p>${safeText(review.comment, "No comment provided.")}</p>
      </article>
    `).join("");
}

async function updateReviewFormAccess(productId) {
    const profile = getUserProfile();
    const reviewForm = document.getElementById("productReviewForm");
    const hint = document.getElementById("reviewHint");
    const submitButton = reviewForm?.querySelector("button[type=\"submit\"]");

    if (!reviewForm || !hint || !submitButton) return;

    if (!profile?.email) {
        hint.textContent = "Login and complete a purchase to leave a review.";
        submitButton.disabled = false;
        return;
    }

    const eligible = await hasPurchasedProduct(profile.email, productId);
    if (!eligible) {
        hint.textContent = "Only customers who purchased this product can review it.";
        submitButton.disabled = false;
        return;
    }

    hint.textContent = "You can review this product.";
    submitButton.disabled = false;
}

async function openProductModal(product) {
    const modal = document.getElementById("productDetailsModal");
    if (!modal) return;

    const image = document.getElementById("productModalImage");
    const title = document.getElementById("productModalTitle");
    const category = document.getElementById("productModalCategory");
    const rating = document.getElementById("productModalRating");
    const price = document.getElementById("productModalPrice");
    const stock = document.getElementById("productModalStock");
    const description = document.getElementById("productModalDescription");

    if (image) image.src = safeText(product.imageUrl, "https://via.placeholder.com/400x300?text=Product");
    if (image) image.alt = safeText(product.name, "Product image");
    if (title) title.textContent = safeText(product.name, "Untitled Product");
    if (category) category.textContent = safeText(product.category, "Uncategorized");
    if (rating) rating.textContent = getRatingLabel(product);
    if (price) price.textContent = formatPrice(product.price);
    if (stock) stock.textContent = `In stock: ${Number(product.inStock || 0)}`;
    if (description) description.textContent = safeText(product.description, "No description available.");

    activeModalProductId = product.id;
    const reviews = await getProductReviews(product.id);
    renderModalReviews(reviews);
    await updateReviewFormAccess(product.id);

    modal.classList.add("open");
}

async function handleReviewSubmit(event) {
    event.preventDefault();

    if (!activeModalProductId) return;

    const profile = getUserProfile();
    if (!profile?.email) {
        alert("Please login to submit a review.");
        return;
    }

    const ratingInput = document.getElementById("reviewRating");
    const commentInput = document.getElementById("reviewComment");

    const ratingValue = ratingInput ? Number(ratingInput.value || 3) : 3;
    const commentValue = commentInput ? commentInput.value.trim() : "";

    const result = await addProductReview(
        activeModalProductId,
        profile.name || profile.email,
        profile.email,
        ratingValue,
        commentValue
    );

    if (!result.ok) {
        alert(result.message || "Could not submit review.");
        return;
    }

    alert("Review submitted successfully.");

    if (commentInput) commentInput.value = "";
    if (ratingInput) ratingInput.value = "3";

    storefrontProducts = await getProducts();
    renderProducts(storefrontProducts);
    renderCategories(storefrontProducts);
    renderCart(storefrontProducts);
    renderCheckout(storefrontProducts);

    const refreshedProduct = storefrontProducts.find((item) => item.id === activeModalProductId);
    if (refreshedProduct) {
        await openProductModal(refreshedProduct);
    }
}

function renderProducts(products) {
    const productGrid = document.querySelector("[data-product-grid]");
    if (!productGrid) return;

    const normalizedFilter = activeCategoryFilter.trim().toLowerCase();
    const filteredProducts = normalizedFilter
        ? products.filter((item) => safeText(item.category, "Uncategorized").trim().toLowerCase() === normalizedFilter)
        : products;
    const visibleProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 9);

    if (!filteredProducts.length) {
        const filterLabel = activeCategoryFilter || "this category";
        productGrid.innerHTML = `<article class="product-card"><p>No products found for ${filterLabel}.</p></article>`;
        return;
    }

    if (!visibleProducts.length) {
        productGrid.innerHTML = "<article class=\"product-card\"><p>No products found in inventory yet.</p></article>";
        return;
    }

    productGrid.innerHTML = visibleProducts.map((item) => `
      <article class="product-card product-clickable" data-product-id="${item.id}">
        <img src="${safeText(item.imageUrl, "https://via.placeholder.com/400x300?text=Product")}" alt="${safeText(item.name, "Product")}">
        <p class="label">${safeText(item.category, "Uncategorized")}</p>
        <p class="product-rating">${getRatingLabel(item)}</p>
        <h3>${safeText(item.name, "Untitled Product")}</h3>
        <p>${safeText(item.description, "No description available.")}</p>
        <span>${formatPrice(item.price)}</span>
        <button class="btn primary product-action" data-add-to-cart="${item.id}" type="button" ${Number(item.inStock || 0) <= 0 ? "disabled" : ""}>
          ${Number(item.inStock || 0) <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </article>
    `).join("");
}

function renderCategories(products) {
    const categoryGrid = document.querySelector("[data-category-grid]");
    if (!categoryGrid) return;

    const grouped = {};
    for (const item of products) {
        const key = safeText(item.category, "Uncategorized");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    }

    const cards = Object.entries(grouped).slice(0, 3);
    if (!cards.length) {
        categoryGrid.innerHTML = "<article class=\"category-card\"><p>No categories yet.</p></article>";
        return;
    }

    const storePath = window.location.pathname.includes("/pages/home.html") ? "/pages/home.html" : "/index.html";

    categoryGrid.innerHTML = cards.map(([category, items]) => `
      <article class="category-card">
        <h3>${category}</h3>
        <p>${items.length} product(s) available in this category.</p>
        <a class="link" href="${storePath}?category=${encodeURIComponent(category)}#featured">View Products</a>
        <img src="${safeText(items[0].imageUrl, "https://via.placeholder.com/400x300?text=Category")}" alt="${category}">
      </article>
    `).join("");
}

function applyProductFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    activeCategoryFilter = (params.get("category") || "").trim();
    showAllProducts = (params.get("view") || "").toLowerCase() === "all";
}

function getLineItems(products) {
    const byId = mapById(products);
    const cart = getCart();
    const lineItems = [];

    for (const entry of cart) {
        const product = byId[entry.productId];
        if (!product) continue;
        const quantity = Number(entry.quantity || 0);
        if (quantity <= 0) continue;

        lineItems.push({
            productId: product.id,
            name: safeText(product.name, "Untitled Product"),
            imageUrl: safeText(product.imageUrl, "https://via.placeholder.com/120x120?text=Product"),
            unitPrice: Number(product.price || 0),
            quantity
        });
    }

    return lineItems;
}

function getStockForProduct(products, productId) {
    const item = products.find((product) => product.id === productId);
    return Number(item?.inStock || 0);
}

function renderCart(products) {
    const container = document.getElementById("cartItemsContainer");
    const totalEl = document.getElementById("cartTotalAmount");
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (!container || !totalEl) return;

    const lineItems = getLineItems(products);
    if (!lineItems.length) {
        container.innerHTML = "<div class=\"summary-item\"><span>Your cart is empty.</span></div>";
        totalEl.textContent = formatPrice(0);
        if (checkoutBtn) checkoutBtn.classList.add("disabled-btn");
        return;
    }

    if (checkoutBtn) checkoutBtn.classList.remove("disabled-btn");

    let total = 0;
    container.innerHTML = lineItems.map((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        total += lineTotal;
        return `
        <div class="summary-item">
          <div class="cart-product-meta">
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div>
            <strong>${item.name}</strong>
            <p>${formatPrice(item.unitPrice)} each</p>
            </div>
          </div>
          <div class="cart-actions">
            <button type="button" class="cart-qty-btn" data-cart-dec="${item.productId}">-</button>
            <span>${item.quantity}</span>
            <button type="button" class="cart-qty-btn" data-cart-inc="${item.productId}">+</button>
            <strong>${formatPrice(lineTotal)}</strong>
            <button type="button" class="cart-remove-btn" data-cart-remove="${item.productId}">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    totalEl.textContent = formatPrice(total);
}

function renderCheckout(products) {
    const itemsEl = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotalAmount");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (!itemsEl || !totalEl) return;

    const lineItems = getLineItems(products);
    if (!lineItems.length) {
        itemsEl.innerHTML = "<div class=\"summary-item\"><span>No items in cart. Add products first.</span></div>";
        totalEl.textContent = formatPrice(0);
        if (placeOrderBtn) placeOrderBtn.classList.add("disabled-btn");
        return;
    }

    if (placeOrderBtn) placeOrderBtn.classList.remove("disabled-btn");

    let total = 0;
    itemsEl.innerHTML = lineItems.map((item) => {
        const lineTotal = item.quantity * item.unitPrice;
        total += lineTotal;
        return `
        <div class="summary-item">
          <span>${item.name} x ${item.quantity}</span>
          <strong>${formatPrice(lineTotal)}</strong>
        </div>
      `;
    }).join("");
    totalEl.textContent = formatPrice(total);
}

function bindCartActions() {
    document.addEventListener("click", function (event) {
        const addBtn = event.target.closest("[data-add-to-cart]");
        if (addBtn) {
            const productId = addBtn.dataset.addToCart;
            const current = getCart().find((entry) => entry.productId === productId);
            const currentQty = Number(current?.quantity || 0);
            const stock = getStockForProduct(storefrontProducts, productId);

            if (stock <= 0) {
                alert("This product is out of stock.");
                return;
            }

            if (currentQty >= stock) {
                alert("No more units available in storage.");
                return;
            }

            addToCart(productId);
            addBtn.textContent = "Added";
            setTimeout(() => {
                addBtn.textContent = "Add to Cart";
            }, 600);
            renderCart(storefrontProducts);
            renderCheckout(storefrontProducts);
            return;
        }

        const incBtn = event.target.closest("[data-cart-inc]");
        if (incBtn) {
            const productId = incBtn.dataset.cartInc;
            const current = getCart().find((entry) => entry.productId === productId);
            const stock = getStockForProduct(storefrontProducts, productId);
            const nextQty = Number(current?.quantity || 0) + 1;

            if (nextQty > stock) {
                alert("No more units available in storage.");
                return;
            }

            updateCartQuantity(productId, nextQty);
            renderCart(storefrontProducts);
            renderCheckout(storefrontProducts);
            return;
        }

        const decBtn = event.target.closest("[data-cart-dec]");
        if (decBtn) {
            const productId = decBtn.dataset.cartDec;
            const current = getCart().find((entry) => entry.productId === productId);
            updateCartQuantity(productId, Number(current?.quantity || 0) - 1);
            renderCart(storefrontProducts);
            renderCheckout(storefrontProducts);
            return;
        }

        const removeBtn = event.target.closest("[data-cart-remove]");
        if (removeBtn) {
            const productId = removeBtn.dataset.cartRemove;
            updateCartQuantity(productId, 0);
            renderCart(storefrontProducts);
            renderCheckout(storefrontProducts);
        }
    });
}

function bindProductDetailsModal() {
    document.addEventListener("click", function (event) {
        const addBtn = event.target.closest("[data-add-to-cart]");
        if (addBtn) return;

        const productCard = event.target.closest("[data-product-id]");
        if (!productCard) return;

        const productId = productCard.dataset.productId;
        const product = storefrontProducts.find((item) => item.id === productId);
        if (!product) return;

        openProductModal(product);
    });
}

function bindCheckoutAction() {
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (!placeOrderBtn) return;

    placeOrderBtn.addEventListener("click", async function () {
        if (placeOrderBtn.classList.contains("disabled-btn")) return;

        const checkoutName = document.getElementById("checkoutName")?.value?.trim() || "";
        const checkoutPhone = document.getElementById("checkoutPhone")?.value?.trim() || "";
        const checkoutEmail = document.getElementById("checkoutEmail")?.value?.trim() || "";
        const checkoutCity = document.getElementById("checkoutCity")?.value?.trim() || "";
        const checkoutAddress = document.getElementById("checkoutAddress")?.value?.trim() || "";
        const profile = getUserProfile();
        const purchaserEmail = (profile?.email || checkoutEmail || "").trim().toLowerCase();

        if (!checkoutName || !checkoutPhone || !checkoutEmail || !checkoutCity || !checkoutAddress) {
            alert("Please complete all checkout details.");
            return;
        }

        const products = await getProducts();
        const lineItems = getLineItems(products).map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice
        }));

        if (!lineItems.length) {
            alert("Your cart is empty.");
            return;
        }

        const total = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const result = await createOrder({
            customer: {
                name: checkoutName,
                phone: checkoutPhone,
                email: checkoutEmail,
                city: checkoutCity,
                address: checkoutAddress
            },
            purchaserEmail,
            items: lineItems,
            total
        });

        if (!result.ok) {
            alert(result.message || "Could not place order.");
            return;
        }

        localStorage.setItem("lastOrderId", result.id);
        localStorage.removeItem(CART_KEY);
        alert("Order placed successfully. Admin has received your order details.");
        window.location.href = "/pages/account.html";
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    applyProductFiltersFromUrl();
    storefrontProducts = await getProducts();
    ensureProductModal();

    renderProducts(storefrontProducts);
    renderCategories(storefrontProducts);
    renderCart(storefrontProducts);
    renderCheckout(storefrontProducts);

    bindCartActions();
    bindProductDetailsModal();
    bindCheckoutAction();
});
