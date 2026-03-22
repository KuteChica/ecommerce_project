import { addProduct, getProducts, updateInventory, isAdminLoggedIn, logout } from "../../backend/server.js";

function asMoney(value) {
    return `GH₵${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function readAdminProfile() {
    try {
        const cached = localStorage.getItem("adminProfile");
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
}

function paintInventory(products) {
    const body = document.getElementById("inventoryBody");
    if (!body) return;

    if (!products.length) {
        body.innerHTML = "<tr><td colspan=\"7\">No products yet. Add your first product above.</td></tr>";
        return;
    }

    body.innerHTML = products.map((product) => {
        const name = product.name || "Untitled";
        const category = product.category || "Uncategorized";
        const description = product.description || "";
        const image = product.imageUrl || "";
        const stockCount = Number(product.inStock || 0);

        return `
        <tr>
          <td><img src="${image}" alt="${name}" class="inventory-thumb"></td>
          <td>${name}</td>
          <td>${category}</td>
          <td>${asMoney(product.price || 0)}</td>
          <td class="inventory-description">${description}</td>
          <td>
            <input type="number" min="0" value="${stockCount}" class="stock-input" data-stock-id="${product.id}">
          </td>
          <td>
            <button class="btn primary inventory-save" data-save-id="${product.id}">Save</button>
          </td>
        </tr>
        `;
    }).join("");
}

async function loadInventory() {
    const allProducts = await getProducts();
    paintInventory(allProducts);
}

async function onAddProduct(evt) {
    evt.preventDefault();

    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const category = document.getElementById("productCategory").value;
    const price = document.getElementById("productPrice").value;
    const imageUrl = document.getElementById("productImageUrl").value;
    const stock = document.getElementById("productStock").value;

    const addRes = await addProduct(name, description, category, price, imageUrl, stock);
    if (!addRes.ok) {
        alert(addRes.message || "Could not add product.");
        return;
    }

    evt.target.reset();
    alert("Product added successfully.");
    await loadInventory();
}

async function onInventoryAction(evt) {
    const saveBtn = evt.target.closest("[data-save-id]");
    if (!saveBtn) return;

    const id = saveBtn.dataset.saveId;
    const stockInput = document.querySelector(`[data-stock-id="${id}"]`);
    const nextStock = stockInput ? stockInput.value : "";

    const updateRes = await updateInventory(id, nextStock);
    if (!updateRes.ok) {
        alert(updateRes.message || "Could not update stock.");
        return;
    }

    alert("Inventory updated.");
    await loadInventory();
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

    const admin = readAdminProfile();
    const adminName = document.getElementById("adminName");
    if (adminName) {
        adminName.textContent = admin?.name || admin?.email || "Admin";
    }

    const form = document.getElementById("addProductForm");
    if (form) form.addEventListener("submit", onAddProduct);

    const inventoryBody = document.getElementById("inventoryBody");
    if (inventoryBody) inventoryBody.addEventListener("click", onInventoryAction);

    await loadInventory();
});
