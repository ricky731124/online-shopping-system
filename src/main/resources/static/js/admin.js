/**
 * 後台管理頁面 Vue.js 應用程式
 * 處理商品管理、訂單管理和統計資料展示
 */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 當前頁面標籤
            activeTab: 'dashboard',

            // 載入狀態
            loadingProducts: false,
            loadingOrders: false,
            submittingProduct: false,

            // 統計資料
            stats: {},

            // 商品管理
            products: [],
            categories: [],
            productFilters: {
                category: '',
                search: '',
                isActive: ''
            },
            editingProduct: {
                id: null,
                name: '',
                category: '',
                price: 0,
                stockQuantity: 0,
                description: '',
                isActive: true
            },

            // 訂單管理
            orders: [],
            orderFilters: {
                status: '',
                customerName: '',
                customerPhone: ''
            },

            // Toast 訊息
            toastMessage: ''
        };
    },

    async mounted() {
        // 頁面載入時初始化
        await this.loadDashboardStats();

        // 設定全域 app 參考（供 ToastUtils 使用）
        window.app = this;
    },

    methods: {
        /**
         * 設定活動標籤
         * @param {string} tab - 標籤名稱
         */
        async setActiveTab(tab) {
            this.activeTab = tab;

            // 根據標籤載入對應資料
            switch (tab) {
                case 'dashboard':
                    await this.loadDashboardStats();
                    break;
                case 'products':
                    await this.loadProducts();
                    break;
                case 'orders':
                    await this.loadOrders();
                    break;
            }
        },

        /**
         * 載入儀表板統計資料
         */
        async loadDashboardStats() {
            try {
                const response = await ApiUtils.get('/admin/dashboard');
                if (response.success) {
                    this.stats = response.data;
                }
            } catch (error) {
                console.error('載入統計資料失敗:', error);
                this.toastMessage = '載入統計資料失敗';
                ToastUtils.showError(this.toastMessage);
            }
        },

        // ===== 商品管理方法 =====

        /**
         * 載入商品列表
         */
        async loadProducts() {
            try {
                this.loadingProducts = true;
                const response = await ApiUtils.get('/admin/products', this.productFilters);

                if (response.success) {
                    this.products = response.data;
                    this.categories = response.categories;
                }
            } catch (error) {
                console.error('載入商品失敗:', error);
                this.toastMessage = '載入商品失敗';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.loadingProducts = false;
            }
        },

        /**
         * 清除商品篩選
         */
        clearProductFilters() {
            this.productFilters = {
                category: '',
                search: '',
                isActive: ''
            };
            this.loadProducts();
        },

        /**
         * 顯示新增商品表單
         */
        showAddProduct() {
            this.editingProduct = {
                id: null,
                name: '',
                category: '',
                price: 0,
                stockQuantity: 0,
                description: '',
                isActive: true
            };

            const productModal = new bootstrap.Modal(document.getElementById('productModal'));
            productModal.show();
        },

        /**
         * 編輯商品
         * @param {Object} product - 商品物件
         */
        editProduct(product) {
            this.editingProduct = {
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                stockQuantity: product.stockQuantity,
                description: product.description || '',
                isActive: product.isActive
            };

            const productModal = new bootstrap.Modal(document.getElementById('productModal'));
            productModal.show();
        },

        /**
         * 儲存商品
         */
        async saveProduct() {
            try {
                this.submittingProduct = true;

                const productData = { ...this.editingProduct };
                let response;

                if (productData.id) {
                    // 更新商品
                    response = await ApiUtils.put(`/admin/products/${productData.id}`, productData);
                } else {
                    // 新增商品
                    response = await ApiUtils.post('/admin/products', productData);
                }

                if (response.success) {
                    this.toastMessage = response.message;
                    ToastUtils.showSuccess(this.toastMessage);

                    // 關閉模態框
                    const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                    productModal.hide();

                    // 重新載入商品列表
                    await this.loadProducts();
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('儲存商品失敗:', error);
                this.toastMessage = error.response?.data?.message || '儲存商品失敗';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.submittingProduct = false;
            }
        },

        /**
         * 刪除商品
         * @param {number} productId - 商品ID
         */
        async deleteProduct(productId) {
            try {
                if (!confirm('確定要刪除這個商品嗎？')) {
                    return;
                }

                const response = await ApiUtils.delete(`/admin/products/${productId}`);

                if (response.success) {
                    this.toastMessage = response.message;
                    ToastUtils.showSuccess(this.toastMessage);

                    // 重新載入商品列表
                    await this.loadProducts();
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('刪除商品失敗:', error);
                this.toastMessage = error.response?.data?.message || '刪除商品失敗';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 切換商品上架狀態
         * @param {number} productId - 商品ID
         */
        async toggleProductStatus(productId) {
            try {
                const response = await ApiUtils.patch(`/admin/products/${productId}/toggle-status`);

                if (response.success) {
                    this.toastMessage = response.message;
                    ToastUtils.showSuccess(this.toastMessage);

                    // 更新本地商品狀態
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        product.isActive = response.data.isActive;
                    }
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('切換商品狀態失敗:', error);
                this.toastMessage = error.response?.data?.message || '切換商品狀態失敗';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 更新商品庫存
         * @param {number} productId - 商品ID
         * @param {string} stockValue - 庫存值（字串）
         */
        async updateStock(productId, stockValue) {
            try {
                const stock = parseInt(stockValue);
                if (isNaN(stock) || stock < 0) {
                    this.toastMessage = '庫存數量必須為非負整數';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                const response = await ApiUtils.patch(`/admin/products/${productId}/stock`, { stock });

                if (response.success) {
                    // 更新本地商品庫存
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        product.stockQuantity = stock;
                    }
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('更新庫存失敗:', error);
                this.toastMessage = error.response?.data?.message || '更新庫存失敗';
                ToastUtils.showError(this.toastMessage);

                // 重新載入商品列表以恢復原值
                await this.loadProducts();
            }
        },

        // ===== 訂單管理方法 =====

        /**
         * 載入訂單列表
         */
        async loadOrders() {
            try {
                this.loadingOrders = true;
                const response = await ApiUtils.get('/admin/orders', this.orderFilters);

                if (response.success) {
                    this.orders = response.data;
                }
            } catch (error) {
                console.error('載入訂單失敗:', error);
                this.toastMessage = '載入訂單失敗';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.loadingOrders = false;
            }
        },

        /**
         * 清除訂單篩選
         */
        clearOrderFilters() {
            this.orderFilters = {
                status: '',
                customerName: '',
                customerPhone: ''
            };
            this.loadOrders();
        },

        /**
         * 更新訂單狀態
         * @param {number} orderId - 訂單ID
         * @param {string} status - 新狀態
         */
        async updateOrderStatus(orderId, status) {
            try {
                const response = await ApiUtils.patch(`/admin/orders/${orderId}/status`, { status });

                if (response.success) {
                    this.toastMessage = response.message;
                    ToastUtils.showSuccess(this.toastMessage);

                    // 更新本地訂單狀態
                    const order = this.orders.find(o => o.id === orderId);
                    if (order) {
                        order.status = status;
                    }
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('更新訂單狀態失敗:', error);
                this.toastMessage = error.response?.data?.message || '更新訂單狀態失敗';
                ToastUtils.showError(this.toastMessage);

                // 重新載入訂單列表以恢復原值
                await this.loadOrders();
            }
        },

        /**
         * 檢視訂單詳情
         * @param {number} orderId - 訂單ID
         */
        async viewOrder(orderId) {
            try {
                const response = await ApiUtils.get(`/orders/${orderId}`);

                if (response.success) {
                    const order = response.data;
                    // 這裡可以顯示訂單詳情模態框或跳轉到詳情頁面
                    alert(`訂單詳情：#${order.id}\n客戶：${order.customerName}\n金額：NT$ ${this.formatPrice(order.totalAmount)}`);
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('載入訂單詳情失敗:', error);
                this.toastMessage = '載入訂單詳情失敗';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 取消訂單
         * @param {number} orderId - 訂單ID
         */
        async cancelOrder(orderId) {
            try {
                if (!confirm('確定要取消這筆訂單嗎？')) {
                    return;
                }

                const response = await ApiUtils.patch(`/admin/orders/${orderId}/cancel`);

                if (response.success) {
                    this.toastMessage = response.message;
                    ToastUtils.showSuccess(this.toastMessage);

                    // 更新本地訂單狀態
                    const order = this.orders.find(o => o.id === orderId);
                    if (order) {
                        order.status = 'CANCELLED';
                    }
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('取消訂單失敗:', error);
                this.toastMessage = error.response?.data?.message || '取消訂單失敗';
                ToastUtils.showError(this.toastMessage);
            }
        },

        // ===== 工具方法 =====

        /**
         * 獲取訂單狀態顯示文字
         * @param {string} status - 狀態代碼
         * @returns {string} 顯示文字
         */
        getOrderStatusText(status) {
            return OrderStatusUtils.getStatusText(status);
        },

        /**
         * 獲取訂單狀態 CSS 類別
         * @param {string} status - 狀態代碼
         * @returns {string} CSS 類別
         */
        getOrderStatusClass(status) {
            return OrderStatusUtils.getStatusClass(status);
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
        },

        /**
         * 格式化日期時間顯示
         * @param {string} dateString - 日期時間字串
         * @returns {string} 格式化後的日期時間
         */
        formatDateTime(dateString) {
            return formatDateTime(dateString);
        },

        /**
         * 截斷文字
         * @param {string} text - 原始文字
         * @param {number} maxLength - 最大長度
         * @returns {string} 截斷後的文字
         */
        truncateText(text, maxLength = 50) {
            return truncateText(text, maxLength);
        }
    },

    watch: {
        // 監聽篩選條件變化，自動重新載入資料
        productFilters: {
            handler() {
                if (this.activeTab === 'products') {
                    // 使用防抖避免過於頻繁的請求
                    clearTimeout(this.productFilterTimeout);
                    this.productFilterTimeout = setTimeout(() => {
                        this.loadProducts();
                    }, 500);
                }
            },
            deep: true
        },

        orderFilters: {
            handler() {
                if (this.activeTab === 'orders') {
                    // 使用防抖避免過於頻繁的請求
                    clearTimeout(this.orderFilterTimeout);
                    this.orderFilterTimeout = setTimeout(() => {
                        this.loadOrders();
                    }, 500);
                }
            },
            deep: true
        }
    }
});

// 掛載 Vue 應用程式
app.mount('#app');