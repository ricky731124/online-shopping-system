package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 線上購物系統主應用程式
 *
 * 功能特色：
 * 1. 商品管理：新增、編輯、刪除、上下架
 * 2. 前台購物：商品瀏覽、搜尋、分類篩選
 * 3. 購物車：LocalStorage 儲存、即時計算
 * 4. 訂單系統：下單流程、歷史查詢
 * 5. 響應式設計：Bootstrap 5 + Vue.js 3
 *
 * 技術架構：
 * - 後端：Spring Boot 3 + JPA/Hibernate + MySQL
 * - 前端：Vue.js 3 + Bootstrap 5 + Axios
 * - 資料庫：MySQL 8.0+
 */
@SpringBootApplication
public class OnlineShoppingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlineShoppingSystemApplication.class, args);

        System.out.println("\n" + "=".repeat(50));
        System.out.println("🚀 線上購物系統啟動成功！");
        System.out.println("📱 前台購物：http://localhost:8080");
        System.out.println("⚙️  後台管理：http://localhost:8080/admin.html");
        System.out.println("🔧 API 文件：http://localhost:8080/api/products");
        System.out.println("=".repeat(50) + "\n");
    }
}