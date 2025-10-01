/**
 * 共用工具函數
 * 包含所有頁面共用的工具方法和常量
 */

// API 基礎路徑
const API_BASE_URL = '/api';

// 購物車 localStorage 鍵名
const CART_STORAGE_KEY = 'shopping_cart';

/**
 * 格式化價格顯示
 * @param {number} price - 價格
 * @returns {string} 格式化後的價格字串
 */
function formatPrice(price) {
    if (!price) return '0';
    return Number(price).toLocaleString('zh-TW');
}

/**
 * 格式化日期顯示
 * @param {string} dateString - 日期字串
 * @returns {string} 格式化後的日期
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 格式化日期時間顯示
 * @param {string} dateString - 日期時間字串
 * @returns {string} 格式化後的日期時間
 */
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 截斷文字
 * @param {string} text - 原始文字
 * @param {number} maxLength - 最大長度
 * @returns {string} 截斷後的文字
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 購物車工具類別
 */
class CartUtils {
    /**
     * 從 localStorage 獲取購物車
     * @returns {Object} 購物車物件 {productId: quantity}
     */
    static getCart() {
        try {
            const cart = localStorage.getItem(CART_STORAGE_KEY);
            return cart ? JSON.parse(cart) : {};
        } catch (error) {
            console.error('獲取購物車失敗:', error);
            return {};
        }
    }

    /**
     * 儲存購物車到 localStorage
     * @param {Object} cart - 購物車物件
     */
    static saveCart(cart) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('儲存購物車失敗:', error);
        }
    }

    /**
     * 加入商品到購物車
     * @param {number} productId - 商品ID
     * @param {number} quantity - 數量
     */
    static addToCart(productId, quantity = 1) {
        const cart = this.getCart();
        cart[productId] = (cart[productId] || 0) + quantity;
        this.saveCart(cart);
    }

    /**
     * 更新購物車商品數量
     * @param {number} productId - 商品ID
     * @param {number} quantity - 新數量
     */
    static updateCartItem(productId, quantity) {
        const cart = this.getCart();
        if (quantity <= 0) {
            delete cart[productId];
        } else {
            cart[productId] = quantity;
        }
        this.saveCart(cart);
    }

    /**
     * 從購物車移除商品
     * @param {number} productId - 商品ID
     */
    static removeFromCart(productId) {
        const cart = this.getCart();
        delete cart[productId];
        this.saveCart(cart);
    }

    /**
     * 清空購物車
     */
    static clearCart() {
        localStorage.removeItem(CART_STORAGE_KEY);
    }

    /**
     * 獲取購物車總數量
     * @returns {number} 總數量
     */
    static getCartItemCount() {
        const cart = this.getCart();
        return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
    }

    /**
     * 檢查購物車是否為空
     * @returns {boolean} 是否為空
     */
    static isCartEmpty() {
        const cart = this.getCart();
        return Object.keys(cart).length === 0;
    }
}

/**
 * API 請求工具類別
 */
class ApiUtils {
    /**
     * 發送 GET 請求
     * @param {string} url - API 路徑
     * @param {Object} params - 查詢參數
     * @returns {Promise} Axios Promise
     */
    static async get(url, params = {}) {
        try {
            const response = await axios.get(`${API_BASE_URL}${url}`, { params });
            return response.data;
        } catch (error) {
            console.error('GET 請求失敗:', error);
            throw error;
        }
    }

    /**
     * 發送 POST 請求
     * @param {string} url - API 路徑
     * @param {Object} data - 請求資料
     * @returns {Promise} Axios Promise
     */
    static async post(url, data = {}) {
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            console.error('POST 請求失敗:', error);
            throw error;
        }
    }

    /**
     * 發送 PUT 請求
     * @param {string} url - API 路徑
     * @param {Object} data - 請求資料
     * @returns {Promise} Axios Promise
     */
    static async put(url, data = {}) {
        try {
            const response = await axios.put(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            console.error('PUT 請求失敗:', error);
            throw error;
        }
    }

    /**
     * 發送 DELETE 請求
     * @param {string} url - API 路徑
     * @returns {Promise} Axios Promise
     */
    static async delete(url) {
        try {
            const response = await axios.delete(`${API_BASE_URL}${url}`);
            return response.data;
        } catch (error) {
            console.error('DELETE 請求失敗:', error);
            throw error;
        }
    }

    /**
     * 發送 PATCH 請求
     * @param {string} url - API 路徑
     * @param {Object} data - 請求資料
     * @returns {Promise} Axios Promise
     */
    static async patch(url, data = {}) {
        try {
            const response = await axios.patch(`${API_BASE_URL}${url}`, data);
            return response.data;
        } catch (error) {
            console.error('PATCH 請求失敗:', error);
            throw error;
        }
    }
}

/**
 * Toast 通知工具類別
 */
class ToastUtils {
    /**
     * 顯示成功訊息
     * @param {string} message - 訊息內容
     */
    static showSuccess(message) {
        this.showToast('successToast', message);
    }

    /**
     * 顯示錯誤訊息
     * @param {string} message - 訊息內容
     */
    static showError(message) {
        this.showToast('errorToast', message);
    }

    /**
     * 顯示 Toast 通知
     * @param {string} toastId - Toast 元素ID
     * @param {string} message - 訊息內容
     */
    static showToast(toastId, message) {
        const toastEl = document.getElementById(toastId);
        if (toastEl) {
            // 更新 Vue 的訊息（如果存在）
            if (window.app && window.app.toastMessage !== undefined) {
                window.app.toastMessage = message;
            }

            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }
}

/**
 * 表單驗證工具類別
 */
class ValidationUtils {
    /**
     * 驗證 Email 格式
     * @param {string} email - Email 地址
     * @returns {boolean} 是否有效
     */
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 驗證電話格式（台灣格式）
     * @param {string} phone - 電話號碼
     * @returns {boolean} 是否有效
     */
    static isValidPhone(phone) {
        if (!phone) return false;
        const phoneRegex = /^[0-9\-\(\)\s]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
    }

    /**
     * 驗證訂單編號格式（純數字）
     * @param {string} orderId - 訂單編號
     * @returns {boolean} 是否有效
     */
    static isValidOrderId(orderId) {
        if (!orderId) return false;
        const orderIdRegex = /^\d+$/;
        return orderIdRegex.test(orderId.toString().trim());
    }

    /**
     * 驗證必填欄位
     * @param {string} value - 值
     * @returns {boolean} 是否有效
     */
    static isRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    /**
     * 驗證數字範圍
     * @param {number} value - 數值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {boolean} 是否有效
     */
    static isInRange(value, min, max) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    }
}

/**
 * 訂單狀態工具類別
 */
class OrderStatusUtils {
    /**
     * 獲取訂單狀態顯示文字
     * @param {string} status - 狀態代碼
     * @returns {string} 顯示文字
     */
    static getStatusText(status) {
        const statusMap = {
            'PENDING': '待處理',
            'CONFIRMED': '已確認',
            'SHIPPED': '已出貨',
            'DELIVERED': '已送達',
            'CANCELLED': '已取消'
        };
        return statusMap[status] || status;
    }

    /**
     * 獲取訂單狀態 CSS 類別
     * @param {string} status - 狀態代碼
     * @returns {string} CSS 類別
     */
    static getStatusClass(status) {
        const classMap = {
            'PENDING': 'badge bg-warning text-dark',
            'CONFIRMED': 'badge bg-info',
            'SHIPPED': 'badge bg-primary',
            'DELIVERED': 'badge bg-success',
            'CANCELLED': 'badge bg-secondary'
        };
        return classMap[status] || 'badge bg-secondary';
    }

    /**
     * 獲取訂單狀態圖示
     * @param {string} status - 狀態代碼
     * @returns {string} 圖示類別
     */
    static getStatusIcon(status) {
        const iconMap = {
            'PENDING': 'bi bi-clock',
            'CONFIRMED': 'bi bi-check-circle',
            'SHIPPED': 'bi bi-truck',
            'DELIVERED': 'bi bi-check-square',
            'CANCELLED': 'bi bi-x-circle'
        };
        return iconMap[status] || 'bi bi-question-circle';
    }
}

/**
 * 本地儲存工具類別
 */
class StorageUtils {
    /**
     * 設定本地儲存
     * @param {string} key - 鍵
     * @param {*} value - 值
     */
    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('儲存資料失敗:', error);
        }
    }

    /**
     * 獲取本地儲存
     * @param {string} key - 鍵
     * @param {*} defaultValue - 預設值
     * @returns {*} 儲存的值
     */
    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('讀取資料失敗:', error);
            return defaultValue;
        }
    }

    /**
     * 移除本地儲存項目
     * @param {string} key - 鍵
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('移除資料失敗:', error);
        }
    }

    /**
     * 清空本地儲存
     */
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('清空資料失敗:', error);
        }
    }
}

// 全域錯誤處理
window.addEventListener('error', function(event) {
    console.error('全域錯誤:', event.error);
});

// 未處理的 Promise 拒絕
window.addEventListener('unhandledrejection', function(event) {
    console.error('未處理的 Promise 拒絕:', event.reason);
});

// 匯出到全域（供其他 JavaScript 檔案使用）
window.CartUtils = CartUtils;
window.ApiUtils = ApiUtils;
window.ToastUtils = ToastUtils;
window.ValidationUtils = ValidationUtils;
window.OrderStatusUtils = OrderStatusUtils;
window.StorageUtils = StorageUtils;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.truncateText = truncateText;