/**
 * 訂單查詢頁面 Vue.js 應用程式
 * 處理客戶訂單查詢和詳情檢視功能
 */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 搜尋狀態
            searching: false,
            searchPerformed: false,

            // 搜尋表單
            searchForm: {
                email: '',
                phone: ''
            },

            // 訂單資料
            orders: [],
            selectedOrder: null,

            // 購物車數量（頁面顯示用）
            cartItemCount: 0,

            // Toast 訊息
            toastMessage: ''
        };
    },

    mounted() {
        // 頁面載入時初始化
        this.updateCartCount();

        // 設定全域 app 參考（供 ToastUtils 使用）
        window.app = this;

        // 檢查是否有剛下單的訂單資訊
        const lastOrderEmail = StorageUtils.getItem('lastOrderEmail', '');
        const lastOrderPhone = StorageUtils.getItem('lastOrderPhone', '');

        if (lastOrderEmail || lastOrderPhone) {
            // 自動填入並搜尋
            this.searchForm.email = lastOrderEmail;
            this.searchForm.phone = lastOrderPhone;

            // 自動執行搜尋
            this.searchOrders();

            // 清除 localStorage 中的訂單資訊（只自動搜尋一次）
            StorageUtils.removeItem('lastOrderEmail');
            StorageUtils.removeItem('lastOrderPhone');
            StorageUtils.removeItem('lastOrderId');
        }
    },

    methods: {
        /**
         * 搜尋訂單
         */
        async searchOrders() {
            try {
                // 驗證搜尋條件
                if (!this.searchForm.email && !this.searchForm.phone) {
                    this.toastMessage = '請至少填入一項聯絡資訊';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                // 驗證 Email 格式（如果有填）
                if (this.searchForm.email && !ValidationUtils.isValidEmail(this.searchForm.email)) {
                    this.toastMessage = '請輸入有效的Email地址';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                this.searching = true;

                // 發送搜尋請求
                const response = await ApiUtils.get('/orders/customer', {
                    email: this.searchForm.email || undefined,
                    phone: this.searchForm.phone || undefined
                });

                if (response.success) {
                    this.orders = response.data;
                    this.searchPerformed = true;

                    if (this.orders.length === 0) {
                        this.toastMessage = '沒有找到相關訂單';
                        ToastUtils.showError(this.toastMessage);
                    }
                } else {
                    throw new Error(response.message || '搜尋失敗');
                }

            } catch (error) {
                console.error('搜尋訂單失敗:', error);

                let errorMessage = '搜尋失敗，請稍後再試';
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }

                this.toastMessage = errorMessage;
                ToastUtils.showError(this.toastMessage);

            } finally {
                this.searching = false;
            }
        },

        /**
         * 清除搜尋條件
         */
        clearSearch() {
            this.searchForm.email = '';
            this.searchForm.phone = '';
            this.orders = [];
            this.searchPerformed = false;
        },

        /**
         * 檢視訂單詳情
         * @param {number} orderId - 訂單ID
         */
        async viewOrderDetail(orderId) {
            try {
                const response = await ApiUtils.get(`/orders/${orderId}`);

                if (response.success) {
                    this.selectedOrder = response.data;

                    // 顯示訂單詳情模態框
                    const detailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
                    detailModal.show();

                } else {
                    throw new Error(response.message || '載入訂單詳情失敗');
                }

            } catch (error) {
                console.error('載入訂單詳情失敗:', error);
                this.toastMessage = '載入訂單詳情失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 列印訂單
         */
        printOrder() {
            if (!this.selectedOrder) return;

            // 簡單的列印功能
            const printContent = this.generatePrintContent(this.selectedOrder);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        },

        /**
         * 產生列印內容
         * @param {Object} order - 訂單物件
         * @returns {string} HTML 內容
         */
        generatePrintContent(order) {
            const itemsHtml = order.orderItems.map(item => `
                <tr>
                    <td>${item.productName}</td>
                    <td>NT$ ${this.formatPrice(item.unitPrice)}</td>
                    <td>${item.quantity}</td>
                    <td>NT$ ${this.formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
            `).join('');

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>訂單明細 #${order.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .info-table { width: 100%; margin-bottom: 20px; }
                        .info-table td { padding: 8px; border-bottom: 1px solid #ddd; }
                        .items-table { width: 100%; border-collapse: collapse; }
                        .items-table th, .items-table td {
                            padding: 8px; border: 1px solid #ddd; text-align: left;
                        }
                        .total { font-weight: bold; font-size: 1.2em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>訂單明細</h1>
                        <h2>訂單編號：#${order.id}</h2>
                        <p>下單時間：${this.formatDateTime(order.orderDate)}</p>
                    </div>

                    <table class="info-table">
                        <tr><td><strong>收件人：</strong></td><td>${order.customerName}</td></tr>
                        <tr><td><strong>聯絡電話：</strong></td><td>${order.customerPhone}</td></tr>
                        <tr><td><strong>Email：</strong></td><td>${order.customerEmail || '未提供'}</td></tr>
                        <tr><td><strong>收件地址：</strong></td><td>${order.customerAddress}</td></tr>
                        <tr><td><strong>訂單狀態：</strong></td><td>${this.getStatusText(order.status)}</td></tr>
                    </table>

                    <h3>訂購商品</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>商品名稱</th>
                                <th>單價</th>
                                <th>數量</th>
                                <th>小計</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr class="total">
                                <td colspan="3">總計</td>
                                <td>NT$ ${this.formatPrice(order.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    ${order.notes ? `<p><strong>備註：</strong>${order.notes}</p>` : ''}
                </body>
                </html>
            `;
        },

        /**
         * 獲取搜尋資訊顯示
         * @returns {string} 搜尋條件描述
         */
        getSearchInfo() {
            const conditions = [];
            if (this.searchForm.email) {
                conditions.push(`Email: ${this.searchForm.email}`);
            }
            if (this.searchForm.phone) {
                conditions.push(`電話: ${this.searchForm.phone}`);
            }
            return conditions.join(', ');
        },

        /**
         * 更新購物車數量顯示
         */
        updateCartCount() {
            this.cartItemCount = CartUtils.getCartItemCount();
        },

        /**
         * 獲取訂單狀態顯示文字
         * @param {string} status - 狀態代碼
         * @returns {string} 顯示文字
         */
        getStatusText(status) {
            return OrderStatusUtils.getStatusText(status);
        },

        /**
         * 獲取訂單狀態 CSS 類別
         * @param {string} status - 狀態代碼
         * @returns {string} CSS 類別
         */
        getStatusClass(status) {
            return OrderStatusUtils.getStatusClass(status);
        },

        /**
         * 獲取訂單狀態圖示
         * @param {string} status - 狀態代碼
         * @returns {string} 圖示類別
         */
        getStatusIcon(status) {
            return OrderStatusUtils.getStatusIcon(status);
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
        }
    }
});

// 掛載 Vue 應用程式
app.mount('#app');