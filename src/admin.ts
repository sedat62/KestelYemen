import './style.css';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    setDoc
} from 'firebase/firestore';

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
    id?: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    type: 'yemek' | 'icecek' | 'nargile';
    popular?: boolean;
}

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

interface Order {
    id?: string;
    customerName: string;
    tableNumber: string;
    notes?: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'preparing' | 'completed' | 'cancelled';
    createdAt: Timestamp;
}

interface SiteSettings {
    maintenanceMode: boolean;
    cafeName: string;
    cafePhone: string;
    cafeAddress: string;
    tableCount: number;
}

// State
let orders: Order[] = [];
let menuItems: MenuItem[] = [];
let settings: SiteSettings = {
    maintenanceMode: false,
    cafeName: 'Best of Cafe',
    cafePhone: '+90 (555) 123 45 67',
    cafeAddress: 'İstanbul, Türkiye',
    tableCount: 8
};
let currentOrderId: string | null = null;
let editingMenuItemId: string | null = null;

// DOM Elements
const tabOrders = document.getElementById('tabOrders');
const tabMenu = document.getElementById('tabMenu');
const tabSettings = document.getElementById('tabSettings');
const ordersContent = document.getElementById('ordersContent');
const menuContent = document.getElementById('menuContent');
const settingsContent = document.getElementById('settingsContent');
const tablesGrid = document.getElementById('tablesGrid');
const menuItemsList = document.getElementById('menuItemsList');
const orderDetailModal = document.getElementById('orderDetailModal');
const menuItemModal = document.getElementById('menuItemModal');

// Tab Navigation
function switchTab(tabName: 'orders' | 'menu' | 'settings') {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('border-amber-500', 'text-amber-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });

    const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    activeTab?.classList.remove('border-transparent', 'text-gray-500');
    activeTab?.classList.add('border-amber-500', 'text-amber-600');

    // Update content
    ordersContent?.classList.add('hidden');
    menuContent?.classList.add('hidden');
    settingsContent?.classList.add('hidden');

    if (tabName === 'orders') ordersContent?.classList.remove('hidden');
    if (tabName === 'menu') menuContent?.classList.remove('hidden');
    if (tabName === 'settings') settingsContent?.classList.remove('hidden');
}

// Render Tables
function renderTables() {
    if (!tablesGrid) return;

    const tableCount = settings.tableCount || 8;
    let html = '';

    for (let i = 1; i <= tableCount; i++) {
        const tableOrders = orders.filter(o => o.tableNumber === String(i) && o.status === 'pending');
        const hasOrders = tableOrders.length > 0;
        const totalAmount = tableOrders.reduce((sum, o) => sum + o.total, 0);

        html += `
      <div class="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${hasOrders ? 'ring-2 ring-orange-400' : ''}" 
           onclick="openTableOrders(${i})">
        <div class="flex items-center justify-between mb-4">
          <div class="w-14 h-14 rounded-xl flex items-center justify-center ${hasOrders ? 'bg-orange-100' : 'bg-gray-100'}">
            <span class="text-2xl font-bold ${hasOrders ? 'text-orange-600' : 'text-gray-400'}">${i}</span>
          </div>
          ${hasOrders ? `
            <span class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">${tableOrders.length} sipariş</span>
          ` : `
            <span class="text-gray-400 text-xs">Boş</span>
          `}
        </div>
        <h3 class="font-semibold text-gray-800">Masa ${i}</h3>
        ${hasOrders ? `
          <p class="text-orange-600 font-bold mt-1">₺${totalAmount}</p>
          <p class="text-gray-500 text-xs mt-1">${tableOrders[0].customerName}</p>
        ` : `
          <p class="text-gray-400 text-sm mt-1">Sipariş yok</p>
        `}
      </div>
    `;
    }

    tablesGrid.innerHTML = html;
}

// Open Table Orders Modal
function openTableOrders(tableNumber: number) {
    const tableOrders = orders.filter(o => o.tableNumber === String(tableNumber) && o.status === 'pending');

    if (tableOrders.length === 0) {
        showToast(`Masa ${tableNumber}'de bekleyen sipariş yok`, 'info');
        return;
    }

    const order = tableOrders[0];
    currentOrderId = order.id || null;

    const modalTitle = document.getElementById('orderModalTitle');
    const orderDetailContent = document.getElementById('orderDetailContent');

    if (modalTitle) modalTitle.textContent = `Masa ${tableNumber} - Sipariş Detayı`;

    if (orderDetailContent) {
        orderDetailContent.innerHTML = `
      <div class="mb-4">
        <p class="text-sm text-gray-500">Müşteri</p>
        <p class="font-semibold text-gray-800">${order.customerName}</p>
      </div>
      ${order.notes ? `
        <div class="mb-4 p-3 bg-amber-50 rounded-lg">
          <p class="text-sm text-amber-700"><strong>Not:</strong> ${order.notes}</p>
        </div>
      ` : ''}
      <div class="border-t border-gray-100 pt-4">
        <p class="text-sm text-gray-500 mb-3">Sipariş Detayları</p>
        ${order.items.map(item => `
          <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <div>
              <span class="font-medium text-gray-800">${item.name}</span>
              <span class="text-gray-500 text-sm ml-2">x${item.quantity}</span>
            </div>
            <span class="font-semibold text-gray-800">₺${item.total}</span>
          </div>
        `).join('')}
      </div>
      <div class="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <span class="text-lg font-bold text-gray-800">Toplam</span>
        <span class="text-xl font-bold text-amber-600">₺${order.total}</span>
      </div>
      <div class="mt-2 text-right">
        <span class="text-xs text-gray-400">${formatDate(order.createdAt)}</span>
      </div>
    `;
    }

    orderDetailModal?.classList.remove('hidden');
}

// Format Date
function formatDate(timestamp: Timestamp): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Complete Order
async function completeOrder() {
    if (!currentOrderId) return;

    try {
        await updateDoc(doc(db, 'orders', currentOrderId), { status: 'completed' });
        showToast('Sipariş tamamlandı!');
        closeOrderModal();
    } catch (error) {
        console.error('Error completing order:', error);
        showToast('Sipariş tamamlanırken hata oluştu!', 'error');
    }
}

// Cancel Order
async function cancelOrder() {
    if (!currentOrderId) return;

    try {
        await updateDoc(doc(db, 'orders', currentOrderId), { status: 'cancelled' });
        showToast('Sipariş iptal edildi!');
        closeOrderModal();
    } catch (error) {
        console.error('Error cancelling order:', error);
        showToast('Sipariş iptal edilirken hata oluştu!', 'error');
    }
}

// Close Order Modal
function closeOrderModal() {
    orderDetailModal?.classList.add('hidden');
    currentOrderId = null;
}

// Render Menu Items
function renderMenuItems(filter: string = 'all') {
    if (!menuItemsList) return;

    let items = menuItems;
    if (filter !== 'all') {
        items = menuItems.filter(item => item.type === filter);
    }

    if (items.length === 0) {
        menuItemsList.innerHTML = `
      <div class="p-12 text-center text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p>Henüz menü ürünü eklenmemiş</p>
      </div>
    `;
        return;
    }

    menuItemsList.innerHTML = `
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
          <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${items.map(item => `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover">
                <div>
                  <p class="font-medium text-gray-800">${item.name}</p>
                  <p class="text-gray-500 text-xs truncate max-w-xs">${item.description}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 text-xs font-medium rounded-full ${item.type === 'yemek' ? 'bg-amber-100 text-amber-700' :
            item.type === 'icecek' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
        }">${item.type === 'yemek' ? 'Yemek' : item.type === 'icecek' ? 'İçecek' : 'Nargile'}</span>
            </td>
            <td class="px-6 py-4 font-semibold text-gray-800">₺${item.price}</td>
            <td class="px-6 py-4">
              ${item.popular ? '<span class="text-amber-500">⭐ Popüler</span>' : '<span class="text-gray-400">Normal</span>'}
            </td>
            <td class="px-6 py-4 text-right">
              <button onclick="editMenuItem('${item.id}')" class="text-amber-600 hover:text-amber-700 p-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button onclick="deleteMenuItem('${item.id}')" class="text-red-500 hover:text-red-600 p-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Open Add Menu Item Modal
function openAddMenuItemModal() {
    editingMenuItemId = null;
    const modalTitle = document.getElementById('menuModalTitle');
    if (modalTitle) modalTitle.textContent = 'Yeni Ürün Ekle';

    // Reset form
    (document.getElementById('menuItemName') as HTMLInputElement).value = '';
    (document.getElementById('menuItemDesc') as HTMLTextAreaElement).value = '';
    (document.getElementById('menuItemPrice') as HTMLInputElement).value = '';
    (document.getElementById('menuItemType') as HTMLSelectElement).value = 'yemek';
    (document.getElementById('menuItemCategory') as HTMLInputElement).value = '';
    (document.getElementById('menuItemImage') as HTMLInputElement).value = '';
    (document.getElementById('menuItemPopular') as HTMLInputElement).checked = false;

    menuItemModal?.classList.remove('hidden');
}

// Edit Menu Item
function editMenuItem(id: string) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    editingMenuItemId = id;
    const modalTitle = document.getElementById('menuModalTitle');
    if (modalTitle) modalTitle.textContent = 'Ürünü Düzenle';

    (document.getElementById('menuItemName') as HTMLInputElement).value = item.name;
    (document.getElementById('menuItemDesc') as HTMLTextAreaElement).value = item.description;
    (document.getElementById('menuItemPrice') as HTMLInputElement).value = String(item.price);
    (document.getElementById('menuItemType') as HTMLSelectElement).value = item.type;
    (document.getElementById('menuItemCategory') as HTMLInputElement).value = item.category;
    (document.getElementById('menuItemImage') as HTMLInputElement).value = item.image;
    (document.getElementById('menuItemPopular') as HTMLInputElement).checked = item.popular || false;

    menuItemModal?.classList.remove('hidden');
}

// Delete Menu Item
async function deleteMenuItem(id: string) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
        await deleteDoc(doc(db, 'menuItems', id));
        showToast('Ürün silindi!');
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('Ürün silinirken hata oluştu!', 'error');
    }
}

// Save Menu Item
async function saveMenuItem(e: Event) {
    e.preventDefault();

    const itemData: MenuItem = {
        name: (document.getElementById('menuItemName') as HTMLInputElement).value,
        description: (document.getElementById('menuItemDesc') as HTMLTextAreaElement).value,
        price: Number((document.getElementById('menuItemPrice') as HTMLInputElement).value),
        type: (document.getElementById('menuItemType') as HTMLSelectElement).value as 'yemek' | 'icecek' | 'nargile',
        category: (document.getElementById('menuItemCategory') as HTMLInputElement).value,
        image: (document.getElementById('menuItemImage') as HTMLInputElement).value || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        popular: (document.getElementById('menuItemPopular') as HTMLInputElement).checked
    };

    try {
        if (editingMenuItemId) {
            await updateDoc(doc(db, 'menuItems', editingMenuItemId), itemData as any);
            showToast('Ürün güncellendi!');
        } else {
            await addDoc(collection(db, 'menuItems'), itemData);
            showToast('Ürün eklendi!');
        }
        closeMenuItemModal();
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast('Ürün kaydedilirken hata oluştu!', 'error');
    }
}

// Close Menu Item Modal
function closeMenuItemModal() {
    menuItemModal?.classList.add('hidden');
    editingMenuItemId = null;
}

// Update Stats
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate();
        return orderDate >= today;
    });

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedTodayOrders = todayOrders.filter(o => o.status === 'completed');
    const todayRevenue = completedTodayOrders.reduce((sum, o) => sum + o.total, 0);

    document.getElementById('todayOrders')!.textContent = String(todayOrders.length);
    document.getElementById('pendingOrders')!.textContent = String(pendingOrders.length);
    document.getElementById('todayRevenue')!.textContent = `₺${todayRevenue}`;
    document.getElementById('totalMenuItems')!.textContent = String(menuItems.length);
}

// Save Settings
async function saveSettings() {
    const newSettings: SiteSettings = {
        maintenanceMode: (document.getElementById('maintenanceToggle') as HTMLInputElement).checked,
        cafeName: (document.getElementById('cafeName') as HTMLInputElement).value,
        cafePhone: (document.getElementById('cafePhone') as HTMLInputElement).value,
        cafeAddress: (document.getElementById('cafeAddress') as HTMLInputElement).value,
        tableCount: Number((document.getElementById('tableCount') as HTMLInputElement).value)
    };

    try {
        await setDoc(doc(db, 'settings', 'site'), newSettings);
        settings = newSettings;
        updateMaintenanceStatus();
        renderTables();
        showToast('Ayarlar kaydedildi!');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Ayarlar kaydedilirken hata oluştu!', 'error');
    }
}

// Update Maintenance Status
function updateMaintenanceStatus() {
    const statusEl = document.getElementById('maintenanceStatus');
    const warningEl = document.getElementById('maintenanceWarning');

    if (settings.maintenanceMode) {
        if (statusEl) {
            statusEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span class="text-red-400">Bakımda</span>
      `;
        }
        warningEl?.classList.remove('hidden');
    } else {
        if (statusEl) {
            statusEl.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-green-500"></span>
        <span>Site Aktif</span>
      `;
        }
        warningEl?.classList.add('hidden');
    }
}

// Show Toast
function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const bgColor = type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-blue-600' : 'bg-gray-800';
    const toast = document.createElement('div');
    toast.className = `toast flex items-center gap-3 ${bgColor}`;
    toast.innerHTML = `
    ${type === 'success' ?
            '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' :
            type === 'error' ?
                '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' :
                '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        }
    <span>${message}</span>
  `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize Firebase Listeners
function initFirebaseListeners() {
    // Listen to orders
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    onSnapshot(ordersQuery, (snapshot) => {
        orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
        renderTables();
        updateStats();
    });

    // Listen to menu items
    onSnapshot(collection(db, 'menuItems'), (snapshot) => {
        menuItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as MenuItem[];
        renderMenuItems();
        updateStats();
    });

    // Listen to settings
    onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
        if (snapshot.exists()) {
            settings = snapshot.data() as SiteSettings;
            (document.getElementById('maintenanceToggle') as HTMLInputElement).checked = settings.maintenanceMode;
            (document.getElementById('cafeName') as HTMLInputElement).value = settings.cafeName;
            (document.getElementById('cafePhone') as HTMLInputElement).value = settings.cafePhone;
            (document.getElementById('cafeAddress') as HTMLInputElement).value = settings.cafeAddress;
            (document.getElementById('tableCount') as HTMLInputElement).value = String(settings.tableCount);
            updateMaintenanceStatus();
            renderTables();
        }
    });
}

// Initialize
function init() {
    // Tab Navigation
    tabOrders?.addEventListener('click', () => switchTab('orders'));
    tabMenu?.addEventListener('click', () => switchTab('menu'));
    tabSettings?.addEventListener('click', () => switchTab('settings'));

    // Order Modal
    document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('completeOrderBtn')?.addEventListener('click', completeOrder);
    document.getElementById('cancelOrderBtn')?.addEventListener('click', cancelOrder);
    orderDetailModal?.addEventListener('click', (e) => {
        if (e.target === orderDetailModal) closeOrderModal();
    });

    // Menu Item Modal
    document.getElementById('addMenuItemBtn')?.addEventListener('click', openAddMenuItemModal);
    document.getElementById('cancelMenuItemBtn')?.addEventListener('click', closeMenuItemModal);
    document.getElementById('menuItemForm')?.addEventListener('submit', saveMenuItem);
    menuItemModal?.addEventListener('click', (e) => {
        if (e.target === menuItemModal) closeMenuItemModal();
    });

    // Menu Filters
    document.querySelectorAll('.menu-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.menu-filter').forEach(b => {
                b.classList.remove('bg-amber-500', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-600');
            });
            btn.classList.remove('bg-gray-100', 'text-gray-600');
            btn.classList.add('bg-amber-500', 'text-white');
            renderMenuItems(btn.getAttribute('data-filter') || 'all');
        });
    });

    // Settings
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    document.getElementById('maintenanceToggle')?.addEventListener('change', () => {
        const isChecked = (document.getElementById('maintenanceToggle') as HTMLInputElement).checked;
        settings.maintenanceMode = isChecked;
        updateMaintenanceStatus();
    });

    // Initialize Firebase Listeners
    initFirebaseListeners();

    // Initial Render
    renderTables();
    updateStats();
}

// Make functions globally available
(window as any).openTableOrders = openTableOrders;
(window as any).editMenuItem = editMenuItem;
(window as any).deleteMenuItem = deleteMenuItem;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', init);
