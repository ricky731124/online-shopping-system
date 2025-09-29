/**
 * 購物車頁面 Vue.js 應用程式
 * 處理購物車商品展示、數量調整和結帳功能
 */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 載入狀態
            loading: true,

            // 購物車資料
            cartItems: [],

            // Toast 訊息
            toastMessage: ''
        };
    },

    async mounted() {
        // 頁面載入時初始化
        await this.loadCartItems();

        // 設定全域 app 參考（供 ToastUtils 使用）
        window.app = this;
    },

    methods: {
        /**
         * 載入購物車商品資料
         */
        async loadCartItems() {
            try {
                this.loading = true;
                const cart = CartUtils.getCart();
                const productIds = Object.keys(cart);

                if (productIds.length === 0) {
                    this.cartItems = [];
                    return;
                }

                // 獲取購物車中的商品詳細資訊
                this.cartItems = [];

                for (const productId of productIds) {
                    try {
                        const response = await ApiUtils.get(`/products/${productId}`);
                        if (response.success) {
                            const product = response.data;
                            const quantity = cart[productId];

                            // 檢查商品是否仍然上架和有庫存
                            if (product.isActive) {
                                this.cartItems.push({
                                    product: product,
                                    quantity: quantity
                                });
                            } else {
                                // 商品已下架，從購物車移除
                                CartUtils.removeFromCart(productId);
                                this.toastMessage = `商品「${product.name}」已下架，已從購物車移除`;
                                ToastUtils.showError(this.toastMessage);
                            }
                        }
                    } catch (error) {
                        // 商品可能已被刪除，從購物車移除
                        CartUtils.removeFromCart(productId);
                        console.error(`載入商品 ${productId} 失敗:`, error);
                    }
                }

            } catch (error) {
                console.error('載入購物車失敗:', error);
                this.toastMessage = '載入購物車失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.loading = false;
            }
        },

        /**
         * 更新商品數量
         * @param {number} productId - 商品ID
         * @param {number} newQuantity - 新數量
         */
        async updateQuantity(productId, newQuantity) {
            try {
                // 找到對應的購物車項目
                const cartItem = this.cartItems.find(item => item.product.id === productId);
                if (!cartItem) return;

                // 驗證數量
                if (newQuantity <= 0) {
                    this.removeFromCart(productId);
                    return;
                }

                if (newQuantity > cartItem.product.stockQuantity) {
                    this.toastMessage = `商品「${cartItem.product.name}」庫存不足，目前庫存：${cartItem.product.stockQuantity}`;
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                // 更新購物車和 UI
                CartUtils.updateCartItem(productId, newQuantity);
                cartItem.quantity = newQuantity;

            } catch (error) {
                console.error('更新數量失敗:', error);
                this.toastMessage = '更新數量失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 從購物車移除商品
         * @param {number} productId - 商品ID
         */
        removeFromCart(productId) {
            try {
                // 找到商品名稱用於顯示
                const cartItem = this.cartItems.find(item => item.product.id === productId);
                const productName = cartItem ? cartItem.product.name : '商品';

                // 從購物車移除
                CartUtils.removeFromCart(productId);

                // 從 UI 移除
                this.cartItems = this.cartItems.filter(item => item.product.id !== productId);

                this.toastMessage = `已將「${productName}」移除購物車`;
                ToastUtils.showSuccess(this.toastMessage);

            } catch (error) {
                console.error('移除商品失敗:', error);
                this.toastMessage = '移除商品失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 清空購物車
         */
        clearCart() {
            try {
                if (!confirm('確定要清空購物車嗎？')) {
                    return;
                }

                CartUtils.clearCart();
                this.cartItems = [];

                this.toastMessage = '購物車已清空';
                ToastUtils.showSuccess(this.toastMessage);

            } catch (error) {
                console.error('清空購物車失敗:', error);
                this.toastMessage = '清空購物車失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 計算總數量
         * @returns {number} 總數量
         */
        getTotalQuantity() {
            return this.cartItems.reduce((total, item) => total + item.quantity, 0);
        },

        /**
         * 計算總金額
         * @returns {number} 總金額
         */
        getTotalAmount() {
            return this.cartItems.reduce((total, item) => {
                return total + (item.product.price * item.quantity);
            }, 0);
        },

        /**
         * 格式化價格顯示
         * @param {number} price - 價格
         * @returns {string} 格式化後的價格
         */
        formatPrice(price) {
            return formatPrice(price);
        },

        /**
         * 格式化日期顯示
         * @param {string} dateString - 日期字串
         * @returns {string} 格式化後的日期
         */
        formatDate(dateString) {
            return formatDate(dateString);
        }
    }
});

// 掛載 Vue 應用程式
app.mount('#app');