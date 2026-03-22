import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, getDoc, doc, addDoc, collection, getDocs, query, orderBy, updateDoc } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyC99VhGen0dD4ci-fsYdXyIZzj5SytyvMQ",
authDomain: "ecommercesite-93a4d.firebaseapp.com",
databaseURL: "https://ecommercesite-93a4d-default-rtdb.firebaseio.com",
projectId: "ecommercesite-93a4d",
storageBucket: "ecommercesite-93a4d.firebasestorage.app",
messagingSenderId: "939662322490",
appId: "1:939662322490:web:e3f97e9622f9ecd021be03"
};


const server = initializeApp(firebaseConfig);
const auth = getAuth(server);
const database = getFirestore(server);



export async function signUp(name, email, phone, password) {  
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(database, "users", user.uid), {
            name,
            email,
            phone
        });

        const profile = { name, email, phone };
        localStorage.setItem("userProfile", JSON.stringify(profile));

        return { ok: true };

    } catch (error) {
        console.log("signUp error:", error);
        return { ok: false, code: error?.code || "signup/unknown", message: error?.message || "Signup failed" };
    }
}




export async function login(email , password) {
    try {

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await userCredential.user.getIdToken();

        localStorage.setItem("token", token) ;

        const profileDoc = await getDoc(doc(database, "users", user.uid));
        const profileData = profileDoc.exists() ? profileDoc.data() : {};
        const profile = {
            name: profileData.name || "",
            email: profileData.email || user.email || "",
            phone: profileData.phone || ""
        };

        localStorage.setItem("userProfile", JSON.stringify(profile));

        return 1 ;

    } catch(error){
        return 0 ;
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.log("logout error:", error);
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        localStorage.removeItem("adminProfile");
        localStorage.removeItem("isAdmin");
    }
}



export function isLoggedIn (){
    const token = localStorage.getItem("token");
    return token ? 1 : 0 ;
}

export async function adminSignUp(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

        await setDoc(doc(database, "admins", user.uid), {
            name: name.trim(),
            email: email.trim(),
            role: "admin"
        });

        localStorage.setItem("token", token);
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminProfile", JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role: "admin"
        }));

        return { ok: true };
    } catch (error) {
        console.log("adminSignUp error:", error);
        return { ok: false, message: "Admin signup failed." };
    }
}

export async function adminLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

        const adminDocRef = doc(database, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
            await signOut(auth);
            return { ok: false, message: "This account is not an admin account." };
        }

        const adminData = adminDoc.data();
        const adminProfile = {
            name: adminData.name || "",
            email: adminData.email || user.email || "",
            role: "admin"
        };

        localStorage.setItem("token", token);
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminProfile", JSON.stringify(adminProfile));

        return { ok: true };
    } catch (error) {
        console.log("adminLogin error:", error);
        return { ok: false, message: "Invalid admin login." };
    }
}

export function isAdminLoggedIn() {
    return localStorage.getItem("isAdmin") === "true" && !!localStorage.getItem("token");
}

export async function addProduct(name, description, category, price, imageUrl, inStock) {
    try {
        const cleanPrice = Number(price);
        const cleanStock = Number(inStock);

        if (!name || !description || !category || !imageUrl) {
            return { ok: false, message: "All fields are required." };
        }

        if (Number.isNaN(cleanPrice) || cleanPrice < 0) {
            return { ok: false, message: "Price must be a valid number." };
        }

        if (Number.isNaN(cleanStock) || cleanStock < 0) {
            return { ok: false, message: "Stock must be a valid number." };
        }

        const productRef = await addDoc(collection(database, "products"), {
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price: cleanPrice,
            imageUrl: imageUrl.trim(),
            inStock: cleanStock,
            createdAt: Date.now()
        });

        return { ok: true, id: productRef.id };
    } catch (error) {
        console.log("addProduct error:", error);
        return { ok: false, message: "Failed to add product." };
    }
}

export async function getProducts() {
    try {
        const productsQuery = query(collection(database, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(productsQuery);

        return snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data()
        }));
    } catch (error) {
        console.log("getProducts error:", error);
        return [];
    }
}

export async function updateInventory(productId, inStock) {
    try {
        const cleanStock = Number(inStock);

        if (!productId || Number.isNaN(cleanStock) || cleanStock < 0) {
            return { ok: false, message: "Invalid inventory update." };
        }

        await updateDoc(doc(database, "products", productId), {
            inStock: cleanStock
        });

        return { ok: true };
    } catch (error) {
        console.log("updateInventory error:", error);
        return { ok: false, message: "Failed to update inventory." };
    }
}

export async function createOrder(orderPayload) {
    try {
        const customer = orderPayload?.customer || {};
        const items = Array.isArray(orderPayload?.items) ? orderPayload.items : [];
        const total = Number(orderPayload?.total || 0);

        if (!customer.name || !customer.email || !customer.phone || !customer.city || !customer.address) {
            return { ok: false, message: "Customer details are incomplete." };
        }

        if (!items.length) {
            return { ok: false, message: "Cannot place an empty order." };
        }

        if (Number.isNaN(total) || total <= 0) {
            return { ok: false, message: "Order total is invalid." };
        }

        const orderRef = await addDoc(collection(database, "orders"), {
            customer,
            items,
            total,
            status: "pending",
            createdAt: Date.now()
        });

        return { ok: true, id: orderRef.id };
    } catch (error) {
        console.log("createOrder error:", error);
        return { ok: false, message: "Failed to place order." };
    }
}

export async function getOrders() {
    try {
        const ordersQuery = query(collection(database, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(ordersQuery);

        return snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data()
        }));
    } catch (error) {
        console.log("getOrders error:", error);
        return [];
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        const allowed = ["pending", "processing", "completed"];
        if (!orderId || !allowed.includes(status)) {
            return { ok: false, message: "Invalid order status update." };
        }

        await updateDoc(doc(database, "orders", orderId), {
            status
        });

        return { ok: true };
    } catch (error) {
        console.log("updateOrderStatus error:", error);
        return { ok: false, message: "Could not update order." };
    }
}
