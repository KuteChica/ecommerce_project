import { getOrders, updateOrderStatus, isAdminLoggedIn, logout } from "../../backend/server.js";

function formatPrice(amount) {
    return `GH₵${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(timestamp) {
    if (!timestamp) return "Unknown time";
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function getStatusClass(status) {
    if (status === "completed") return "status-pill status-completed";
    if (status === "processing") return "status-pill status-processing";
    return "status-pill status-pending";
}

function renderOrders(orders) {
    const body = document.getElementById("ordersTableBody");
    if (!body) return;

    if (!orders.length) {
        body.innerHTML = "<tr><td colspan=\"7\">No orders yet.</td></tr>";
        return;
    }

    body.innerHTML = orders.map((order) => {
        const customer = order.customer || {};
        const items = Array.isArray(order.items) ? order.items : [];
        const itemSummary = items.map((item) => `${item.name} x${item.quantity}`).join(", ");
        const status = order.status || "pending";

        return `
        <tr>
          <td>#${order.id.slice(0, 8)}<br><small>${formatDate(order.createdAt)}</small></td>
          <td>${customer.name || "Unknown"}</td>
          <td>
            <div>${customer.email || "-"}</div>
            <div>${customer.phone || "-"}</div>
            <div>${customer.city || "-"}, ${customer.address || "-"}</div>
          </td>
          <td class="inventory-description">${itemSummary || "No items"}</td>
          <td>${formatPrice(order.total)}</td>
          <td><span class="${getStatusClass(status)}">${status}</span></td>
          <td>
            <select data-order-id="${order.id}" class="stock-input">
              <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
              <option value="processing" ${status === "processing" ? "selected" : ""}>Processing</option>
              <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
            </select>
            <button class="btn primary inventory-save" data-save-order="${order.id}">Update</button>
          </td>
        </tr>
        `;
    }).join("");
}

async function refreshOrders() {
    const orders = await getOrders();
    renderOrders(orders);
}

async function handleStatusUpdate(event) {
    const button = event.target.closest("[data-save-order]");
    if (!button) return;

    const orderId = button.dataset.saveOrder;
    const select = document.querySelector(`select[data-order-id="${orderId}"]`);
    const status = select ? select.value : "";

    const result = await updateOrderStatus(orderId, status);
    if (!result.ok) {
        alert(result.message || "Could not update order.");
        return;
    }

    alert("Order status updated.");
    await refreshOrders();
}

window.handleAdminOrdersLogout = async function () {
    await logout();
    window.location.href = "/pages/admin-login.html";
};

document.addEventListener("DOMContentLoaded", async function () {
    if (!isAdminLoggedIn()) {
        window.location.href = "/pages/admin-login.html";
        return;
    }

    const tableBody = document.getElementById("ordersTableBody");
    if (tableBody) {
        tableBody.addEventListener("click", handleStatusUpdate);
    }

    await refreshOrders();
});
