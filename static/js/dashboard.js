import { addProduct, getProducts, updateInventory, deleteProduct, isAdminLoggedIn, logout } from "../../backend/server.js";

const CURATED_CATEGORIES = [
    "Phones & Tablets",
    "Laptops & Computers",
    "Audio & Headphones",
    "TV & Home Entertainment",
    "Kitchen Appliances",
    "Home Appliances",
    "Power & Electrical",
    "Smart Home Devices",
    "Computer Accessories",
    "Gaming & Consoles"
];

function asMoney(value) {
    return `GH₵${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeCategoryLabel(rawCategory) {
    const cleaned = String(rawCategory || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    const exactMatch = CURATED_CATEGORIES.find(
        (category) => category.toLowerCase() === cleaned.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    return cleaned
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
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
            <div class="inventory-actions">
              <button class="btn primary inventory-save" data-save-id="${product.id}">Save</button>
              <button class="btn danger inventory-delete" data-delete-id="${product.id}" type="button">Delete</button>
            </div>
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
    const category = normalizeCategoryLabel(document.getElementById("productCategory").value);
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
    if (saveBtn) {
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
        return;
    }

    const deleteBtn = evt.target.closest("[data-delete-id]");
    if (!deleteBtn) return;

    const id = deleteBtn.dataset.deleteId;
    if (!id) return;

    const shouldDelete = window.confirm("Delete this product from inventory? This cannot be undone.");
    if (!shouldDelete) return;

    const deleteRes = await deleteProduct(id);
    if (!deleteRes.ok) {
        alert(deleteRes.message || "Could not delete product.");
        return;
    }

    alert("Product deleted.");
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
