import { getOrders, updateOrderStatus, isAdminLoggedIn, logout } from "../../backend/server.js";

function asPrice(value) {
    return `GH₵${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function asDate(value) {
    if (!value) return "Unknown time";
    return new Date(value).toLocaleString();
}

function statusClass(status) {
    if (status === "completed") return "status-pill status-completed";
    if (status === "processing") return "status-pill status-processing";
    return "status-pill status-pending";
}

function drawOrders(orderList) {
    const tableBody = document.getElementById("ordersTableBody");
    if (!tableBody) return;

    if (!orderList.length) {
        tableBody.innerHTML = "<tr><td colspan=\"7\">No orders yet.</td></tr>";
        return;
    }

    tableBody.innerHTML = orderList.map((order) => {
        const customer = order.customer || {};
        const items = Array.isArray(order.items) ? order.items : [];
        const shortItems = items.map((it) => `${it.name} x${it.quantity}`).join(", ");
        const currentStatus = order.status || "pending";

        return `
        <tr>
          <td>#${order.id.slice(0, 8)}<br><small>${asDate(order.createdAt)}</small></td>
          <td>${customer.name || "Unknown"}</td>
          <td>
            <div>${customer.email || "-"}</div>
            <div>${customer.phone || "-"}</div>
            <div>${customer.city || "-"}, ${customer.address || "-"}</div>
          </td>
          <td class="inventory-description">${shortItems || "No items"}</td>
          <td>${asPrice(order.total)}</td>
          <td><span class="${statusClass(currentStatus)}">${currentStatus}</span></td>
          <td>
            <select data-order-id="${order.id}" class="stock-input">
              <option value="pending" ${currentStatus === "pending" ? "selected" : ""}>Pending</option>
              <option value="processing" ${currentStatus === "processing" ? "selected" : ""}>Processing</option>
              <option value="completed" ${currentStatus === "completed" ? "selected" : ""}>Completed</option>
            </select>
            <button class="btn primary inventory-save" data-save-order="${order.id}">Update</button>
          </td>
        </tr>
        `;
    }).join("");
}

async function refreshOrderTable() {
    const allOrders = await getOrders();
    drawOrders(allOrders);
}

async function onOrderTableClick(evt) {
    const updateBtn = evt.target.closest("[data-save-order]");
    if (!updateBtn) return;

    const orderId = updateBtn.dataset.saveOrder;
    const picker = document.querySelector(`select[data-order-id="${orderId}"]`);
    const nextStatus = picker ? picker.value : "";

    const updateRes = await updateOrderStatus(orderId, nextStatus);
    if (!updateRes.ok) {
        alert(updateRes.message || "Could not update order.");
        return;
    }

    alert("Order status updated.");
    await refreshOrderTable();
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

    const body = document.getElementById("ordersTableBody");
    if (body) body.addEventListener("click", onOrderTableClick);

    await refreshOrderTable();
});
