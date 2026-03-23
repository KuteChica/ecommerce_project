import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, setDoc, getDoc, doc, addDoc, collection, getDocs, query, orderBy, updateDoc, deleteDoc, where } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyC99VhGen0dD4ci-fsYdXyIZzj5SytyvMQ",
authDomain: "ecommercesite-93a4d.firebaseapp.com",
databaseURL: "https://ecommercesite-93a4d-default-rtdb.firebaseio.com",
projectId: "ecommercesite-93a4d",
storageBucket: "ecommercesite-93a4d.firebasestorage.app",
messagingSenderId: "939662322490",
appId: "1:939662322490:web:e3f97e9622f9ecd021be03"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



export async function signUp(name, email, phone, password) {  
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
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

        const profileDoc = await getDoc(doc(db, "users", user.uid));
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

        await setDoc(doc(db, "admins", user.uid), {
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

        const adminDocRef = doc(db, "admins", user.uid);
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

        const productRef = await addDoc(collection(db, "products"), {
            name: name.trim(),
            description: description.trim(),
            category: category.trim(),
            price: cleanPrice,
            imageUrl: imageUrl.trim(),
            inStock: cleanStock,
            ratingAverage: 3,
            ratingCount: 0,
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
        const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
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

        await updateDoc(doc(db, "products", productId), {
            inStock: cleanStock
        });

        return { ok: true };
    } catch (error) {
        console.log("updateInventory error:", error);
        return { ok: false, message: "Failed to update inventory." };
    }
}

export async function deleteProduct(productId) {
    try {
        if (!productId) {
            return { ok: false, message: "Invalid product id." };
        }

        await deleteDoc(doc(db, "products", productId));
        return { ok: true };
    } catch (error) {
        console.log("deleteProduct error:", error);
        return { ok: false, message: "Failed to delete product." };
    }
}

export async function createOrder(orderPayload) {
    try {
        const customer = orderPayload?.customer || {};
        const purchaserEmail = (orderPayload?.purchaserEmail || customer.email || "").trim().toLowerCase();
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

        const orderRef = await addDoc(collection(db, "orders"), {
            customer: {
                ...customer,
                email: (customer.email || "").trim(),
                emailLower: (customer.email || "").trim().toLowerCase()
            },
            purchaserEmail,
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
        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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

export async function getCustomerOrders(email) {
    try {
        const rawEmail = (email || "").trim();
        if (!rawEmail) return [];
        const normalizedEmail = rawEmail.toLowerCase();
        const merged = new Map();

        const lookups = [
            query(collection(db, "orders"), where("purchaserEmail", "==", normalizedEmail)),
            query(collection(db, "orders"), where("customer.emailLower", "==", normalizedEmail)),
            query(collection(db, "orders"), where("customer.email", "==", rawEmail))
        ];

        for (const ordersQuery of lookups) {
            const snapshot = await getDocs(ordersQuery);
            for (const entry of snapshot.docs) {
                merged.set(entry.id, {
                    id: entry.id,
                    ...entry.data()
                });
            }
        }

        return Array.from(merged.values()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    } catch (error) {
        console.log("getCustomerOrders error:", error);
        return [];
    }
}

export async function updateOrderStatus(orderId, status) {
    try {
        const allowed = ["pending", "processing", "completed"];
        if (!orderId || !allowed.includes(status)) {
            return { ok: false, message: "Invalid order status update." };
        }

        await updateDoc(doc(db, "orders", orderId), {
            status
        });

        return { ok: true };
    } catch (error) {
        console.log("updateOrderStatus error:", error);
        return { ok: false, message: "Could not update order." };
    }
}

export async function hasPurchasedProduct(email, productId) {
    try {
        if (!email || !productId) return false;
        const normalizedEmail = email.trim().toLowerCase();

        const lookups = [
            query(collection(db, "orders"), where("purchaserEmail", "==", normalizedEmail)),
            query(collection(db, "orders"), where("customer.emailLower", "==", normalizedEmail)),
            query(collection(db, "orders"), where("customer.email", "==", email.trim()))
        ];

        for (const ordersQuery of lookups) {
            const snapshot = await getDocs(ordersQuery);

            for (const entry of snapshot.docs) {
                const order = entry.data();
                const items = Array.isArray(order.items) ? order.items : [];
                const matched = items.some((item) => item.productId === productId);
                if (matched) return true;
            }
        }

        return false;
    } catch (error) {
        console.log("hasPurchasedProduct error:", error);
        return false;
    }
}

export async function getProductReviews(productId) {
    try {
        if (!productId) return [];
        const reviewsQuery = query(
            collection(db, "products", productId, "reviews"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(reviewsQuery);

        return snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data()
        }));
    } catch (error) {
        console.log("getProductReviews error:", error);
        return [];
    }
}

export async function addProductReview(productId, reviewerName, reviewerEmail, rating, comment) {
    try {
        if (!productId || !reviewerEmail) {
            return { ok: false, message: "Missing review details." };
        }

        const cleanRating = Number(rating);
        if (Number.isNaN(cleanRating) || cleanRating < 1 || cleanRating > 5) {
            return { ok: false, message: "Rating must be between 1 and 5." };
        }

        const canReview = await hasPurchasedProduct(reviewerEmail, productId);
        if (!canReview) {
            return { ok: false, message: "Only customers who purchased this product can review it." };
        }

        const reviewText = (comment || "").trim();
        await addDoc(collection(db, "products", productId, "reviews"), {
            reviewerName: (reviewerName || reviewerEmail || "Customer").trim(),
            reviewerEmail: reviewerEmail.trim(),
            rating: cleanRating,
            comment: reviewText,
            createdAt: Date.now()
        });

        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        const productData = productSnap.exists() ? productSnap.data() : {};
        const currentCount = Number(productData.ratingCount || 0);
        const currentAverage = Number(productData.ratingAverage || 3);
        const nextCount = currentCount + 1;
        const nextAverage = ((currentAverage * currentCount) + cleanRating) / nextCount;

        await updateDoc(productRef, {
            ratingAverage: Number(nextAverage.toFixed(2)),
            ratingCount: nextCount
        });

        return { ok: true };
    } catch (error) {
        console.log("addProductReview error:", error);
        return { ok: false, message: "Failed to add review." };
    }
}
