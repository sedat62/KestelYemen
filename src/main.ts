import './style.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1oSP3KPF3FZVEvUv8eBpoMwjmQcWOk-Y",
  authDomain: "bestofcafe-d3446.firebaseapp.com",
  projectId: "bestofcafe-d3446",
  storageBucket: "bestofcafe-d3446.firebasestorage.app",
  messagingSenderId: "194338847064",
  appId: "1:194338847064:web:b5d7ec844bc8009ddd8d2d",
  measurementId: "G-NFF58791TR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  type: 'yemek' | 'icecek' | 'nargile';
  popular?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// Sample Menu Data
const menuData: MenuItem[] = [
  // Yemekler
  { id: 'y1', name: 'Serpme Kahvaltı', description: 'Zengin kahvaltı tabağı, peynir çeşitleri, bal, tereyağı', price: 280, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80', category: 'kahvalti', type: 'yemek', popular: true },
  { id: 'y2', name: 'Menemen', description: 'Domates, biber ve yumurta ile hazırlanan geleneksel lezzet', price: 65, image: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&q=80', category: 'kahvalti', type: 'yemek' },
  { id: 'y3', name: 'Izgara Köfte', description: 'El yapımı ızgara köfte, pilav ve salata ile', price: 145, image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80', category: 'ana-yemek', type: 'yemek', popular: true },
  { id: 'y4', name: 'Tavuk Şiş', description: 'Marine edilmiş tavuk parçaları, özel baharatlarla', price: 125, image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', category: 'ana-yemek', type: 'yemek' },
  { id: 'y5', name: 'Adana Kebap', description: 'Acılı kıyma, lavash ekmek ve közlenmiş sebzeler', price: 155, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', category: 'ana-yemek', type: 'yemek' },
  { id: 'y6', name: 'Sezar Salata', description: 'Tavuk, marul, parmesan ve özel sos', price: 85, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80', category: 'salata', type: 'yemek' },
  { id: 'y7', name: 'Akdeniz Salata', description: 'Zeytinyağlı, domates, salatalık ve beyaz peynir', price: 75, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', category: 'salata', type: 'yemek' },
  { id: 'y8', name: 'Classic Burger', description: 'Dana eti, cheddar, marul, domates, özel sos', price: 135, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', category: 'burger', type: 'yemek', popular: true },
  { id: 'y9', name: 'Double Cheese Burger', description: 'Çift köfte, çift cheddar, karamelize soğan', price: 165, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80', category: 'burger', type: 'yemek' },
  { id: 'y10', name: 'Margarita Pizza', description: 'Domates sosu, mozzarella, fesleğen', price: 115, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', category: 'pizza', type: 'yemek' },
  { id: 'y11', name: 'Sucuklu Pizza', description: 'Sucuk, kaşar, mozzarella, yeşil biber', price: 130, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', category: 'pizza', type: 'yemek', popular: true },
  { id: 'y12', name: 'Künefe', description: 'Antep fıstıklı geleneksel künefe, kaymak ile', price: 95, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', category: 'tatli', type: 'yemek', popular: true },
  { id: 'y13', name: 'Sütlaç', description: 'Fırında pişirilmiş geleneksel sütlaç', price: 55, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', category: 'tatli', type: 'yemek' },
  { id: 'y14', name: 'Cheesecake', description: 'New York usulü cheesecake, meyve sosu ile', price: 75, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80', category: 'tatli', type: 'yemek' },

  // İçecekler
  { id: 'i1', name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi, lokum ile', price: 35, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', category: 'sicak-icecek', type: 'icecek', popular: true },
  { id: 'i2', name: 'Latte', description: 'Espresso ve kremsi süt köpüğü', price: 45, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', category: 'kahve', type: 'icecek', popular: true },
  { id: 'i3', name: 'Cappuccino', description: 'Espresso, süt ve sütlü köpük', price: 45, image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80', category: 'kahve', type: 'icecek' },
  { id: 'i4', name: 'Americano', description: 'Espresso ve sıcak su', price: 40, image: 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=400&q=80', category: 'kahve', type: 'icecek' },
  { id: 'i5', name: 'Mocha', description: 'Espresso, çikolata ve süt', price: 50, image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80', category: 'kahve', type: 'icecek' },
  { id: 'i6', name: 'Çay', description: 'Demlik çay, ince belli bardakta', price: 15, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', category: 'cay', type: 'icecek' },
  { id: 'i7', name: 'Yeşil Çay', description: 'Antioksidan bakımından zengin yeşil çay', price: 25, image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&q=80', category: 'cay', type: 'icecek' },
  { id: 'i8', name: 'Sahlep', description: 'Tarçın ve ceviz ile sıcak sahlep', price: 40, image: 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400&q=80', category: 'sicak-icecek', type: 'icecek' },
  { id: 'i9', name: 'Sıcak Çikolata', description: 'Belçika çikolatalı, marshmallow ile', price: 45, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80', category: 'sicak-icecek', type: 'icecek' },
  { id: 'i10', name: 'Limonata', description: 'Ev yapımı taze limonata', price: 35, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80', category: 'soguk-icecek', type: 'icecek', popular: true },
  { id: 'i11', name: 'Ice Latte', description: 'Soğuk espresso ve süt', price: 50, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80', category: 'soguk-icecek', type: 'icecek' },
  { id: 'i12', name: 'Mango Smoothie', description: 'Taze mango ve yoğurt ile', price: 55, image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80', category: 'smoothie', type: 'icecek', popular: true },
  { id: 'i13', name: 'Berry Smoothie', description: 'Karışık orman meyveleri', price: 55, image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&q=80', category: 'smoothie', type: 'icecek' },
  { id: 'i14', name: 'Taze Portakal Suyu', description: 'Günlük taze sıkılmış portakal', price: 40, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80', category: 'taze-sikilmis', type: 'icecek' },
  { id: 'i15', name: 'Karışık Meyve Suyu', description: 'Elma, havuç ve portakal', price: 45, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', category: 'taze-sikilmis', type: 'icecek' },

  // Nargile
  { id: 'n1', name: 'Çift Elma', description: 'Klasik çift elma aroması', price: 150, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80', category: 'meyve', type: 'nargile', popular: true },
  { id: 'n2', name: 'Şeftali', description: 'Tatlı şeftali aroması', price: 150, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80', category: 'meyve', type: 'nargile' },
  { id: 'n3', name: 'Karpuz', description: 'Yaz serinliği karpuz aroması', price: 150, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', category: 'meyve', type: 'nargile', popular: true },
  { id: 'n4', name: 'Mango', description: 'Egzotik mango aroması', price: 160, image: 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&q=80', category: 'meyve', type: 'nargile' },
  { id: 'n5', name: 'Üzüm', description: 'Tatlı üzüm aroması', price: 150, image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80', category: 'meyve', type: 'nargile' },
  { id: 'n6', name: 'Nane', description: 'Ferahlatıcı nane aroması', price: 150, image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&q=80', category: 'mint', type: 'nargile', popular: true },
  { id: 'n7', name: 'Nane Limon', description: 'Nane ve limon karışımı', price: 160, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', category: 'mint', type: 'nargile' },
  { id: 'n8', name: 'Ice Mint', description: 'Buz gibi nane aroması', price: 160, image: 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=400&q=80', category: 'mint', type: 'nargile' },
  { id: 'n9', name: 'Klasik Tütün', description: 'Geleneksel tütün aroması', price: 140, image: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&q=80', category: 'klasik', type: 'nargile' },
  { id: 'n10', name: 'Cappuccino', description: 'Kahve aromalı nargile', price: 160, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', category: 'klasik', type: 'nargile' },
  { id: 'n11', name: 'Best of Mix', description: 'Özel ev karışımımız', price: 180, image: 'https://images.unsplash.com/photo-1560024802-8137a6cb6c5c?w=400&q=80', category: 'ozel', type: 'nargile', popular: true },
  { id: 'n12', name: 'Tropical Mix', description: 'Tropik meyve karışımı', price: 180, image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&q=80', category: 'ozel', type: 'nargile' },
  { id: 'n13', name: 'Summer Breeze', description: 'Yaz esintisi özel karışım', price: 190, image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80', category: 'ozel', type: 'nargile' },
  { id: 'n14', name: 'Dubai Nights', description: 'Premium özel karışım', price: 200, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', category: 'ozel', type: 'nargile' },
];

// Cart State
let cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');

// DOM Elements
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartSidebar = document.getElementById('cartSidebar');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const orderModal = document.getElementById('orderModal');
const orderForm = document.getElementById('orderForm') as HTMLFormElement;
const cancelOrder = document.getElementById('cancelOrder');
const menuGrid = document.getElementById('menuGrid');
const popularItems = document.getElementById('popularItems');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const tableNumberInput = document.getElementById('tableNumberInput') as HTMLInputElement;
const tableNumberDisplay = document.getElementById('tableNumberDisplay');
const tableBadge = document.getElementById('tableBadge');

// Get table number from URL or default to 1
function getTableNumber(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('masa') || '1';
}

// Set table number in UI
function setTableNumber() {
  const tableNumber = getTableNumber();
  if (tableNumberInput) tableNumberInput.value = tableNumber;
  if (tableNumberDisplay) tableNumberDisplay.textContent = tableNumber;
  if (tableBadge) tableBadge.classList.remove('hidden');
}

// Determine current page type
function getCurrentPageType(): 'home' | 'yemek' | 'icecek' | 'nargile' {
  const path = window.location.pathname;
  if (path.includes('yemekler')) return 'yemek';
  if (path.includes('icecekler')) return 'icecek';
  if (path.includes('nargile')) return 'nargile';
  return 'home';
}

// Filter menu items
function getFilteredItems(category: string = 'all'): MenuItem[] {
  const pageType = getCurrentPageType();
  let items = menuData;

  if (pageType !== 'home') {
    items = menuData.filter(item => item.type === pageType);
  }

  if (category !== 'all') {
    items = items.filter(item => item.category === category);
  }

  return items;
}

// Render Menu Items
function renderMenuItems(category: string = 'all') {
  if (!menuGrid) return;

  const items = getFilteredItems(category);

  menuGrid.innerHTML = items.map(item => `
    <div class="menu-item-card animate-fade-in-up" data-category="${item.category}">
      <div class="relative overflow-hidden">
        <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover">
        ${item.popular ? `
          <div class="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            ⭐ Popüler
          </div>
        ` : ''}
      </div>
      <div class="p-5">
        <h3 class="font-bold text-gray-800 text-lg mb-1">${item.name}</h3>
        <p class="text-gray-500 text-sm mb-4 line-clamp-2">${item.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-amber-600">₺${item.price}</span>
          <button onclick="addToCart('${item.id}')" class="btn-shine bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all">
            Ekle
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Popular Items (Home Page)
function renderPopularItems() {
  if (!popularItems) return;

  const items = menuData.filter(item => item.popular).slice(0, 8);

  popularItems.innerHTML = items.map(item => `
    <div class="menu-item-card animate-fade-in-up">
      <div class="relative overflow-hidden">
        <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover">
        <div class="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          ⭐ Popüler
        </div>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-gray-800 text-lg mb-1">${item.name}</h3>
        <p class="text-gray-500 text-sm mb-4 line-clamp-2">${item.description}</p>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-amber-600">₺${item.price}</span>
          <button onclick="addToCart('${item.id}')" class="btn-shine bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg transition-all">
            Ekle
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Add to Cart
function addToCart(itemId: string) {
  const item = menuData.find(i => i.id === itemId);
  if (!item) return;

  const existingItem = cart.find(i => i.id === itemId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`${item.name} sepete eklendi!`);
}

// Remove from Cart
function removeFromCart(itemId: string) {
  cart = cart.filter(i => i.id !== itemId);
  saveCart();
  updateCartUI();
}

// Update Quantity
function updateQuantity(itemId: string, delta: number) {
  const item = cart.find(i => i.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(itemId);
  } else {
    saveCart();
    updateCartUI();
  }
}

// Save Cart to LocalStorage
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart UI
function updateCartUI() {
  // Update Badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = totalItems.toString();
    cartBadge.classList.toggle('hidden', totalItems === 0);
  }

  // Update Cart Items
  if (cartItems) {
    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p class="text-gray-500">Sepetiniz boş</p>
          <p class="text-gray-400 text-sm mt-1">Lezzetli ürünlerimizi keşfedin!</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="flex gap-4 py-4 border-b border-gray-100 last:border-0">
          <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
          <div class="flex-1">
            <h4 class="font-medium text-gray-800">${item.name}</h4>
            <p class="text-amber-600 font-bold">₺${item.price}</p>
            <div class="flex items-center gap-3 mt-2">
              <button onclick="updateQuantity('${item.id}', -1)" class="quantity-btn bg-gray-100 hover:bg-gray-200 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                </svg>
              </button>
              <span class="font-medium">${item.quantity}</span>
              <button onclick="updateQuantity('${item.id}', 1)" class="quantity-btn bg-gray-100 hover:bg-gray-200 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="text-red-400 hover:text-red-600 p-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      `).join('');
    }
  }

  // Update Total
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (cartTotal) {
    cartTotal.textContent = `₺${total}`;
  }

  // Update Checkout Button
  if (checkoutBtn) {
    (checkoutBtn as HTMLButtonElement).disabled = cart.length === 0;
  }
}

// Open/Close Cart
function openCart() {
  if (cartSidebar && cartPanel) {
    cartSidebar.classList.remove('hidden');
    setTimeout(() => {
      cartPanel.style.transform = 'translateX(0)';
    }, 10);
  }
}

function closeCartSidebar() {
  if (cartSidebar && cartPanel) {
    cartPanel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      cartSidebar.classList.add('hidden');
    }, 300);
  }
}

// Open/Close Order Modal
function openOrderModal() {
  if (orderModal) {
    orderModal.classList.remove('hidden');
  }
}

function closeOrderModal() {
  if (orderModal) {
    orderModal.classList.add('hidden');
  }
}

// Show Toast
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`;
  toast.innerHTML = `
    ${type === 'success' ?
      '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' :
      '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
    }
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Submit Order to Firebase
async function submitOrder(formData: FormData) {
  const orderData = {
    customerName: formData.get('customerName'),
    tableNumber: formData.get('tableNumber'),
    notes: formData.get('notes') || '',
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    })),
    total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    status: 'pending',
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, 'orders'), orderData);
    cart = [];
    saveCart();
    updateCartUI();
    closeOrderModal();
    closeCartSidebar();
    showToast('Siparişiniz başarıyla alındı!');
  } catch (error) {
    console.error('Order error:', error);
    showToast('Sipariş gönderilirken hata oluştu!', 'error');
  }
}

// Category Filter
function setupCategoryFilters() {
  const filters = document.querySelectorAll('.category-filter');
  const pageType = getCurrentPageType();

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      // Update active state
      filters.forEach(f => {
        f.classList.remove('bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'text-white');
        f.classList.add('bg-gray-100', 'text-gray-600');
      });

      // Set active filter color based on page
      const activeClass = pageType === 'icecek' ? 'bg-blue-500' :
        pageType === 'nargile' ? 'bg-purple-500' : 'bg-amber-500';
      filter.classList.remove('bg-gray-100', 'text-gray-600');
      filter.classList.add(activeClass, 'text-white');

      // Filter items
      const category = filter.getAttribute('data-category') || 'all';
      renderMenuItems(category);
    });
  });
}

// Initialize
function init() {
  // Check maintenance mode
  checkMaintenanceMode();

  // Set table number from URL
  setTableNumber();

  // Mobile Menu Toggle
  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  // Cart Events
  cartBtn?.addEventListener('click', openCart);
  closeCart?.addEventListener('click', closeCartSidebar);
  cartOverlay?.addEventListener('click', closeCartSidebar);
  checkoutBtn?.addEventListener('click', openOrderModal);

  // Order Events
  cancelOrder?.addEventListener('click', closeOrderModal);
  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(orderForm);
    await submitOrder(formData);
  });

  // Close modal on overlay click
  orderModal?.addEventListener('click', (e) => {
    if (e.target === orderModal) {
      closeOrderModal();
    }
  });

  // Setup Category Filters
  setupCategoryFilters();

  // Render Content
  const pageType = getCurrentPageType();
  if (pageType === 'home') {
    renderPopularItems();
  } else {
    renderMenuItems();
  }

  // Update Cart UI
  updateCartUI();
}

// Check Maintenance Mode
function checkMaintenanceMode() {
  onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
    if (snapshot.exists()) {
      const settings = snapshot.data();
      if (settings.maintenanceMode) {
        showMaintenanceOverlay();
      } else {
        hideMaintenanceOverlay();
      }
    }
  });
}

// Show Maintenance Overlay
function showMaintenanceOverlay() {
  let overlay = document.getElementById('maintenanceOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'maintenanceOverlay';
    overlay.className = 'fixed inset-0 bg-gray-900/95 z-[9999] flex items-center justify-center';
    overlay.innerHTML = `
      <div class="text-center text-white p-8">
        <div class="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold mb-4 font-display">Bakım Çalışması</h1>
        <p class="text-gray-400 max-w-md">Sitemiz şu anda bakım çalışması nedeniyle geçici olarak kapalıdır. En kısa sürede tekrar hizmetinizde olacağız.</p>
        <p class="text-amber-500 mt-6 font-medium">Best of Cafe</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('hidden');
}

// Hide Maintenance Overlay
function hideMaintenanceOverlay() {
  const overlay = document.getElementById('maintenanceOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Make functions globally available
(window as any).addToCart = addToCart;
(window as any).removeFromCart = removeFromCart;
(window as any).updateQuantity = updateQuantity;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', init);

