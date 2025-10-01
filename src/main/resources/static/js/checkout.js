/**
 * 結帳頁面 Vue.js 應用程式
 * 處理結帳表單驗證、訂單建立功能
 */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 載入狀態
            loading: true,
            submitting: false,

            // 購物車資料
            cartItems: [],

            // 訂單表單
            orderForm: {
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                customerAddress: '',
                notes: ''
            },

            // 表單驗證錯誤
            errors: {},

            // 建立成功的訂單
            createdOrder: null,

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
                            if (product.isActive && quantity <= product.stockQuantity) {
                                this.cartItems.push({
                                    product: product,
                                    quantity: quantity
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`載入商品 ${productId} 失敗:`, error);
                    }
                }

                // 如果購物車變空了，跳轉回購物車頁面
                if (this.cartItems.length === 0) {
                    this.toastMessage = '購物車已變空，請重新選購商品';
                    ToastUtils.showError(this.toastMessage);
                    setTimeout(() => {
                        window.location.href = 'cart.html';
                    }, 2000);
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
         * 驗證表單
         * @returns {boolean} 是否通過驗證
         */
        validateForm() {
            this.errors = {};
            let isValid = true;

            // 驗證姓名
            if (!ValidationUtils.isRequired(this.orderForm.customerName)) {
                this.errors.customerName = '請輸入收件人姓名';
                isValid = false;
            }

            // 驗證電話
            if (!ValidationUtils.isRequired(this.orderForm.customerPhone)) {
                this.errors.customerPhone = '請輸入聯絡電話';
                isValid = false;
            } else if (!ValidationUtils.isValidPhone(this.orderForm.customerPhone)) {
                this.errors.customerPhone = '請輸入有效的電話號碼';
                isValid = false;
            }

            // 驗證 Email（選填，但如果有填就要檢查格式）
            if (this.orderForm.customerEmail && !ValidationUtils.isValidEmail(this.orderForm.customerEmail)) {
                this.errors.customerEmail = '請輸入有效的Email地址';
                isValid = false;
            }

            // 驗證地址
            if (!ValidationUtils.isRequired(this.orderForm.customerAddress)) {
                this.errors.customerAddress = '請輸入收件地址';
                isValid = false;
            }

            return isValid;
        },

        /**
         * 提交訂單
         */
        async submitOrder() {
            try {
                // 表單驗證
                if (!this.validateForm()) {
                    this.toastMessage = '請檢查表單資料';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                // 檢查購物車
                if (this.cartItems.length === 0) {
                    this.toastMessage = '購物車是空的';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                this.submitting = true;

                // 準備訂單資料
                const cart = CartUtils.getCart();
                const orderData = {
                    customerName: this.orderForm.customerName.trim(),
                    customerEmail: this.orderForm.customerEmail.trim() || null,
                    customerPhone: this.orderForm.customerPhone.trim(),
                    customerAddress: this.orderForm.customerAddress.trim(),
                    notes: this.orderForm.notes.trim() || null,
                    cartItems: cart
                };

                // 發送訂單建立請求
                const response = await ApiUtils.post('/orders', orderData);

                if (response.success) {
                    this.createdOrder = response.data;

                    // 儲存訂單資訊到 localStorage 供查詢使用
                    StorageUtils.setItem('lastOrderId', response.data.id);
                    //StorageUtils.setItem('lastOrderPhone', this.orderForm.customerPhone || '');

                    // 清空購物車
                    CartUtils.clearCart();

                    // 顯示成功模態框
                    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                    successModal.show();

                    this.toastMessage = '訂單建立成功！';
                    ToastUtils.showSuccess(this.toastMessage);

                } else {
                    throw new Error(response.message || '訂單建立失敗');
                }

            } catch (error) {
                console.error('提交訂單失敗:', error);

                let errorMessage = '訂單建立失敗，請稍後再試';

                // 處理特定錯誤
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.toastMessage = errorMessage;
                ToastUtils.showError(this.toastMessage);

                // 如果是庫存問題，重新載入購物車
                if (errorMessage.includes('庫存') || errorMessage.includes('下架')) {
                    await this.loadCartItems();
                }

            } finally {
                this.submitting = false;
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
        truncateText(text, maxLength = 30) {
            return truncateText(text, maxLength);
        }
    },

    watch: {
        // 監聽表單變化，清除對應的錯誤訊息
        'orderForm.customerName'() {
            if (this.errors.customerName) {
                delete this.errors.customerName;
            }
        },
        'orderForm.customerPhone'() {
            if (this.errors.customerPhone) {
                delete this.errors.customerPhone;
            }
        },
        'orderForm.customerEmail'() {
            if (this.errors.customerEmail) {
                delete this.errors.customerEmail;
            }
        },
        'orderForm.customerAddress'() {
            if (this.errors.customerAddress) {
                delete this.errors.customerAddress;
            }
        }
    }
});

// 掛載 Vue 應用程式
app.mount('#app');