/**
 * 首頁 Vue.js 應用程式
 * 處理商品瀏覽、搜尋、篩選和購物車功能
 * 新增：即時搜尋建議功能
 */

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // 載入狀態
            loading: true,

            // 商品資料
            allProducts: [],
            filteredProducts: [],
            categories: [],

            // 搜尋和篩選
            searchKeyword: '',
            selectedCategories: [],

            // 搜尋建議功能
            searchSuggestions: [],
            selectedSuggestionIndex: -1,
            showSuggestions: false,
            searchInputTimer: null,

            // 購物車
            cartItemCount: 0,

            // Toast 訊息
            toastMessage: ''
        };
    },

    async mounted() {
        // 頁面載入時初始化
        await this.loadProducts();
        this.updateCartCount();

        // 設定全域 app 參考（供 ToastUtils 使用）
        window.app = this;

        // 點擊頁面其他地方時關閉建議清單
        document.addEventListener('click', (e) => {
            const searchContainer = this.$refs.searchContainer;
            if (searchContainer && !searchContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    },

    methods: {
        /**
         * 載入商品資料
         */
        async loadProducts() {
            try {
                this.loading = true;
                const response = await ApiUtils.get('/products');

                if (response.success) {
                    this.allProducts = response.data;
                    this.categories = response.categories;
                    this.filteredProducts = [...this.allProducts];
                } else {
                    throw new Error(response.message || '載入商品失敗');
                }
            } catch (error) {
                console.error('載入商品失敗:', error);
                this.toastMessage = '載入商品失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.loading = false;
            }
        },

        /**
         * 搜尋輸入事件處理（即時建議）
         */
        onSearchInput() {
            // 清除之前的計時器
            if (this.searchInputTimer) {
                clearTimeout(this.searchInputTimer);
            }

            // 如果輸入為空，隱藏建議
            if (!this.searchKeyword || this.searchKeyword.trim() === '') {
                this.hideSuggestions();
                return;
            }

            // 使用防抖，300ms 後執行搜尋建議
            this.searchInputTimer = setTimeout(() => {
                this.getSuggestions();
            }, 300);
        },

        /**
         * 獲取搜尋建議
         */
        getSuggestions() {
            const keyword = this.searchKeyword.trim().toLowerCase();

            if (!keyword) {
                this.hideSuggestions();
                return;
            }

            // 從所有商品中篩選包含關鍵字的商品名稱（不區分大小寫）
            const suggestions = this.allProducts
                .filter(product => {
                    const productName = product.name.toLowerCase();
                    return productName.includes(keyword);
                })
                .slice(0, 5) // 最多顯示 5 個
                .map(product => product.name);

            // 去重
            this.searchSuggestions = [...new Set(suggestions)];
            this.showSuggestions = this.searchSuggestions.length > 0;
            this.selectedSuggestionIndex = -1;
        },

        /**
         * 選擇建議項目
         */
        selectSuggestion(suggestion) {
            this.searchKeyword = suggestion;
            this.hideSuggestions();
            this.searchProducts();
        },

        /**
         * 處理鍵盤事件
         */
        handleKeydown(event) {
            if (!this.showSuggestions) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if (this.selectedSuggestionIndex < this.searchSuggestions.length - 1) {
                        this.selectedSuggestionIndex++;
                    }
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    if (this.selectedSuggestionIndex > 0) {
                        this.selectedSuggestionIndex--;
                    }
                    break;

                case 'Enter':
                    event.preventDefault();
                    if (this.selectedSuggestionIndex >= 0) {
                        this.selectSuggestion(this.searchSuggestions[this.selectedSuggestionIndex]);
                    } else {
                        this.hideSuggestions();
                        this.searchProducts();
                    }
                    break;

                case 'Escape':
                    event.preventDefault();
                    this.hideSuggestions();
                    break;
            }
        },

        /**
         * 隱藏建議清單
         */
        hideSuggestions() {
            this.showSuggestions = false;
            this.searchSuggestions = [];
            this.selectedSuggestionIndex = -1;
        },

        /**
         * 高亮顯示匹配的文字
         */
        highlightMatch(text) {
            if (!this.searchKeyword) return text;

            const keyword = this.searchKeyword.trim();
            const regex = new RegExp(`(${keyword})`, 'gi');
            return text.replace(regex, '<strong class="text-primary">$1</strong>');
        },

        /**
         * 搜尋商品
         */
        async searchProducts() {
            try {
                this.loading = true;
                this.hideSuggestions();

                const response = await ApiUtils.get('/products', {
                    search: this.searchKeyword
                });

                if (response.success) {
                    this.allProducts = response.data;
                    this.filterProducts(); // 重新套用分類篩選
                } else {
                    throw new Error(response.message || '搜尋失敗');
                }
            } catch (error) {
                console.error('搜尋商品失敗:', error);
                this.toastMessage = '搜尋失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            } finally {
                this.loading = false;
            }
        },

        /**
         * 篩選商品（前端即時篩選）
         */
        filterProducts() {
            if (this.selectedCategories.length === 0) {
                // 沒有選擇分類，顯示全部商品
                this.filteredProducts = [...this.allProducts];
            } else {
                // 根據選擇的分類篩選
                this.filteredProducts = this.allProducts.filter(product =>
                    this.selectedCategories.includes(product.category)
                );
            }
        },

        /**
         * 清除所有篩選條件
         */
        clearFilters() {
            this.searchKeyword = '';
            this.selectedCategories = [];
            this.filteredProducts = [...this.allProducts];
            this.hideSuggestions();
        },

        /**
         * 加入商品到購物車
         * @param {Object} product - 商品物件
         */
        async addToCart(product) {
            try {
                // 檢查庫存
                if (product.stockQuantity <= 0) {
                    this.toastMessage = '商品已售完';
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                // 檢查購物車中的數量
                const cart = CartUtils.getCart();
                const currentQuantity = cart[product.id] || 0;

                if (currentQuantity >= product.stockQuantity) {
                    this.toastMessage = `商品「${product.name}」庫存不足`;
                    ToastUtils.showError(this.toastMessage);
                    return;
                }

                // 加入購物車
                CartUtils.addToCart(product.id, 1);
                this.updateCartCount();

                this.toastMessage = `已將「${product.name}」加入購物車`;
                ToastUtils.showSuccess(this.toastMessage);

            } catch (error) {
                console.error('加入購物車失敗:', error);
                this.toastMessage = '加入購物車失敗，請稍後再試';
                ToastUtils.showError(this.toastMessage);
            }
        },

        /**
         * 更新購物車數量顯示
         */
        updateCartCount() {
            this.cartItemCount = CartUtils.getCartItemCount();
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
         * 截斷文字
         * @param {string} text - 原始文字
         * @param {number} maxLength - 最大長度
         * @returns {string} 截斷後的文字
         */
        truncateText(text, maxLength = 100) {
            return truncateText(text, maxLength);
        }
    },

    watch: {
        // 監聽分類選擇變化，即時篩選商品
        selectedCategories: {
            handler() {
                this.filterProducts();
            },
            deep: true
        }
    }
});

// 掛載 Vue 應用程式
app.mount('#app');