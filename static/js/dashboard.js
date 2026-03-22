import { addProduct, getProducts, updateInventory, isAdminLoggedIn, logout } from "../../backend/server.js";

function formatPrice(amount) {
    return `GH₵${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getProfile() {
    try {
        const raw = localStorage.getItem("adminProfile");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function renderInventory(products) {
    const inventoryBody = document.getElementById("inventoryBody");
    if (!inventoryBody) return;

    if (!products.length) {
        inventoryBody.innerHTML = "<tr><td colspan=\"7\">No products yet. Add your first product above.</td></tr>";
        return;
    }

    inventoryBody.innerHTML = products.map((item) => {
        const safeName = item.name || "Untitled";
        const safeCategory = item.category || "Uncategorized";
        const safeDescription = item.description || "";
        const safeImage = item.imageUrl || "";
        const safePrice = formatPrice(item.price || 0);
        const safeStock = Number(item.inStock || 0);

        return `
        <tr>
          <td><img src="${safeImage}" alt="${safeName}" class="inventory-thumb"></td>
          <td>${safeName}</td>
          <td>${safeCategory}</td>
          <td>${safePrice}</td>
          <td class="inventory-description">${safeDescription}</td>
          <td>
            <input type="number" min="0" value="${safeStock}" class="stock-input" data-stock-id="${item.id}">
          </td>
          <td>
            <button class="btn primary inventory-save" data-save-id="${item.id}">Save</button>
          </td>
        </tr>
        `;
    }).join("");
}

async function refreshInventory() {
    const products = await getProducts();
    renderInventory(products);
}

async function handleAddProduct(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const category = document.getElementById("productCategory").value;
    const price = document.getElementById("productPrice").value;
    const imageUrl = document.getElementById("productImageUrl").value;
    const inStock = document.getElementById("productStock").value;

    const result = await addProduct(name, description, category, price, imageUrl, inStock);

    if (!result.ok) {
        alert(result.message || "Could not add product.");
        return;
    }

    event.target.reset();
    alert("Product added successfully.");
    await refreshInventory();
}

async function handleInventoryClick(event) {
    const saveButton = event.target.closest("[data-save-id]");
    if (!saveButton) return;

    const productId = saveButton.dataset.saveId;
    const stockInput = document.querySelector(`[data-stock-id="${productId}"]`);
    const nextStock = stockInput ? stockInput.value : "";

    const result = await updateInventory(productId, nextStock);
    if (!result.ok) {
        alert(result.message || "Could not update stock.");
        return;
    }

    alert("Inventory updated.");
    await refreshInventory();
}

window.handleDashboardLogout = async function () {
    await logout();
    alert("Logged out.");
    window.location.href = "/pages/login.html";
};

document.addEventListener("DOMContentLoaded", async function () {
    if (!isAdminLoggedIn()) {
        window.location.href = "/pages/admin-login.html";
        return;
    }

    const profile = getProfile();
    const adminName = document.getElementById("adminName");
    if (adminName) {
        adminName.textContent = profile?.name || profile?.email || "Admin";
    }

    const addForm = document.getElementById("addProductForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddProduct);
    }

    const inventoryBody = document.getElementById("inventoryBody");
    if (inventoryBody) {
        inventoryBody.addEventListener("click", handleInventoryClick);
    }

    await refreshInventory();
});
