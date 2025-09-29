package com.example.config;

import com.example.entity.Product;
import com.example.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * 資料初始化類別
 * 系統啟動時自動建立測試資料
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ProductService productService;

    @Override
    public void run(String... args) throws Exception {
        // 檢查是否已有資料，避免重複初始化
        if (productService.findAllProducts().isEmpty()) {
            System.out.println("🔄 開始初始化測試資料...");
            initializeProducts();
            System.out.println("✅ 測試資料初始化完成！");
            System.out.println("📊 共建立了 " + productService.findAllProducts().size() + " 個商品");
        } else {
            System.out.println("ℹ️  資料庫已有資料，跳過初始化");
        }
    }

    /**
     * 初始化商品資料
     */
    private void initializeProducts() {

        // 電子產品類別
        createProduct("iPhone 15 Pro", "電子產品", new BigDecimal("39900"),
                "Apple iPhone 15 Pro，最新款智慧型手機，搭載A17 Pro晶片", 15);

        createProduct("MacBook Air M2", "電子產品", new BigDecimal("35900"),
                "Apple MacBook Air M2 晶片，13.6吋 Liquid Retina 顯示器", 8);

        createProduct("iPad Pro 12.9", "電子產品", new BigDecimal("32900"),
                "iPad Pro 12.9 吋，搭載 M2 晶片，專業級平板電腦", 10);

        createProduct("AirPods Pro 2", "電子產品", new BigDecimal("7990"),
                "Apple AirPods Pro 第二代，主動降噪無線耳機", 25);

        createProduct("Samsung Galaxy S24", "電子產品", new BigDecimal("28900"),
                "Samsung Galaxy S24，AI 智慧拍照，旗艦級效能", 12);

        // 服飾類別
        createProduct("經典牛仔外套", "服飾", new BigDecimal("1299"),
                "100%純棉經典藍色牛仔外套，百搭時尚單品", 30);

        createProduct("純棉T恤", "服飾", new BigDecimal("399"),
                "100% 純棉材質，舒適透氣，多色可選", 50);

        createProduct("商務襯衫", "服飾", new BigDecimal("899"),
                "高品質免燙商務襯衫，正式場合必備", 35);

        createProduct("休閒長褲", "服飾", new BigDecimal("799"),
                "彈性舒適休閒長褲，日常穿搭首選", 40);

        createProduct("運動外套", "服飾", new BigDecimal("1599"),
                "防風防水運動外套，運動休閒兩相宜", 20);

        // 家居用品類別
        createProduct("義式真皮沙發", "家居用品", new BigDecimal("25900"),
                "進口義大利真皮沙發，奢華舒適，客廳首選", 5);

        createProduct("實木餐桌", "家居用品", new BigDecimal("12900"),
                "北歐風格橡木實木餐桌，環保耐用", 8);

        createProduct("記憶床墊", "家居用品", new BigDecimal("8900"),
                "太空記憶泡棉床墊，完美貼合身型，舒適好眠", 12);

        createProduct("智能空氣清淨機", "家居用品", new BigDecimal("4500"),
                "HEPA濾網，PM2.5檢測，智能淨化空氣", 15);

        createProduct("LED智能檯燈", "家居用品", new BigDecimal("1200"),
                "護眼LED檯燈，無線充電底座，智能調光", 25);

        // 書籍類別
        createProduct("Spring Boot實戰指南", "書籍", new BigDecimal("680"),
                "從入門到精通，Spring Boot 開發完整教學", 30);

        createProduct("Java程式設計", "書籍", new BigDecimal("550"),
                "Java程式設計入門到進階，豐富範例解說", 40);

        createProduct("資料庫系統概論", "書籍", new BigDecimal("720"),
                "資料庫設計與管理完整教學，SQL語法詳解", 25);

        createProduct("Vue.js前端開發", "書籍", new BigDecimal("490"),
                "Vue.js 3.0 完整開發指南，響應式網頁設計", 35);

        createProduct("人工智慧導論", "書籍", new BigDecimal("780"),
                "AI人工智慧基礎理論與實作應用", 20);

        // 美妝保養類別
        createProduct("玻尿酸保濕精華", "美妝保養", new BigDecimal("1580"),
                "高濃度玻尿酸保濕精華液，深度補水鎖水", 40);

        createProduct("防曬乳SPF50", "美妝保養", new BigDecimal("450"),
                "SPF50 PA+++ 高效防曬，輕透不黏膩", 60);

        createProduct("抗老化面霜", "美妝保養", new BigDecimal("2200"),
                "胜肽抗老化面霜，緊緻肌膚，減少細紋", 25);

        createProduct("溫和卸妝油", "美妝保養", new BigDecimal("380"),
                "植物性溫和卸妝油，深層清潔不刺激", 45);

        createProduct("維他命C精華", "美妝保養", new BigDecimal("980"),
                "15%高濃度維他命C精華，亮白淡斑", 30);
    }

    /**
     * 建立商品的便利方法
     */
    private void createProduct(String name, String category, BigDecimal price,
                               String description, Integer stock) {
        try {
            Product product = new Product(name, category, price, description);
            product.setStockQuantity(stock);
            product.setIsActive(true);
            productService.saveProduct(product);
        } catch (Exception e) {
            System.err.println("❌ 建立商品失敗：" + name + "，錯誤：" + e.getMessage());
        }
    }
}