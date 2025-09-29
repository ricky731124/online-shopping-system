package com.example.controller;

import com.example.entity.Order;
import com.example.entity.Product;
import com.example.service.OrderService;
import com.example.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST API 控制器
 * 提供前端所需的所有 API 接口
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    // ===== 商品相關 API =====

    /**
     * 獲取所有上架商品（前台用）
     */
    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        try {
            List<Product> products = productService.searchActiveProducts(category, search);
            List<String> categories = productService.findAllCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("categories", categories);
            response.put("total", products.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取商品失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 根據ID獲取商品詳情
     */
    @GetMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> getProduct(@PathVariable Long id) {
        try {
            Optional<Product> productOpt = productService.findProductById(id);

            if (productOpt.isPresent() && productOpt.get().getIsActive()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", productOpt.get());

                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "商品不存在或已下架");

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取商品詳情失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 獲取商品分類列表
     */
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        try {
            List<String> categories = productService.findAllCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", categories);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取分類失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ===== 訂單相關 API =====

    /**
     * 建立訂單
     */
    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> orderData) {
        try {
            String customerName = (String) orderData.get("customerName");
            String customerEmail = (String) orderData.get("customerEmail");
            String customerPhone = (String) orderData.get("customerPhone");
            String customerAddress = (String) orderData.get("customerAddress");
            String notes = (String) orderData.get("notes");

            @SuppressWarnings("unchecked")
            Map<String, Object> cartItems = (Map<String, Object>) orderData.get("cartItems");

            // 轉換購物車資料格式
            Map<Long, Integer> items = new HashMap<>();
            for (Map.Entry<String, Object> entry : cartItems.entrySet()) {
                Long productId = Long.valueOf(entry.getKey());
                Integer quantity = (Integer) entry.getValue();
                items.put(productId, quantity);
            }

            Order order = orderService.createOrder(customerName, customerEmail, customerPhone,
                    customerAddress, items, notes);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "訂單建立成功");
            response.put("data", order);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "訂單建立失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 查詢客戶訂單
     */
    @GetMapping("/orders/customer")
    public ResponseEntity<Map<String, Object>> getCustomerOrders(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {

        try {
            List<Order> orders = orderService.findCustomerOrders(email, phone);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            response.put("total", orders.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "查詢訂單失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 根據ID獲取訂單詳情
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable Long id) {
        try {
            Optional<Order> orderOpt = orderService.findOrderById(id);

            if (orderOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", orderOpt.get());

                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "訂單不存在");

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取訂單詳情失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ===== 後台管理 API =====

    /**
     * 獲取所有商品（後台用）
     */
    @GetMapping("/admin/products")
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {

        try {
            List<Product> products = productService.findProductsByConditions(category, search, isActive);
            List<String> categories = productService.findAllCategories();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", products);
            response.put("categories", categories);
            response.put("total", products.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取商品失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 新增商品
     */
    @PostMapping("/admin/products")
    public ResponseEntity<Map<String, Object>> createProduct(@Valid @RequestBody Product product) {
        try {
            Product savedProduct = productService.saveProduct(product);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "商品新增成功");
            response.put("data", savedProduct);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "新增商品失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 更新商品
     */
    @PutMapping("/admin/products/{id}")
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable Long id,
                                                             @Valid @RequestBody Product product) {
        try {
            Optional<Product> existingProductOpt = productService.findProductById(id);

            if (!existingProductOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "商品不存在");

                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            product.setId(id);
            Product updatedProduct = productService.saveProduct(product);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "商品更新成功");
            response.put("data", updatedProduct);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "更新商品失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    /**
     * 刪除商品
     */
    @DeleteMapping("/admin/products/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "商品刪除成功");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "刪除商品失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 切換商品上架狀態
     */
    @PatchMapping("/admin/products/{id}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleProductStatus(@PathVariable Long id) {
        try {
            Product product = productService.toggleProductStatus(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "商品狀態更新成功");
            response.put("data", product);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "狀態更新失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 更新商品庫存
     */
    @PatchMapping("/admin/products/{id}/stock")
    public ResponseEntity<Map<String, Object>> updateStock(@PathVariable Long id,
                                                           @RequestBody Map<String, Integer> request) {
        try {
            Integer stock = request.get("stock");
            Product product = productService.updateStock(id, stock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "庫存更新成功");
            response.put("data", product);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "庫存更新失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 獲取所有訂單（後台用）
     */
    @GetMapping("/admin/orders")
    public ResponseEntity<Map<String, Object>> getAllOrders(
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String customerEmail,
            @RequestParam(required = false) String customerPhone,
            @RequestParam(required = false) Order.OrderStatus status) {

        try {
            List<Order> orders = orderService.findOrdersByConditions(customerName, customerEmail, customerPhone, status);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", orders);
            response.put("total", orders.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取訂單失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 更新訂單狀態
     */
    @PatchMapping("/admin/orders/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@PathVariable Long id,
                                                                 @RequestBody Map<String, String> request) {
        try {
            Order.OrderStatus status = Order.OrderStatus.valueOf(request.get("status"));
            Order order = orderService.updateOrderStatus(id, status);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "訂單狀態更新成功");
            response.put("data", order);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "狀態更新失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 取消訂單
     */
    @PatchMapping("/admin/orders/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(@PathVariable Long id) {
        try {
            Order order = orderService.cancelOrder(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "訂單取消成功，庫存已恢復");
            response.put("data", order);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "取消訂單失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 獲取儀表板統計數據
     */
    @GetMapping("/admin/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            // 商品統計
            long activeProducts = productService.countActiveProducts();
            long inactiveProducts = productService.countInactiveProducts();
            List<Product> lowStockProducts = productService.findLowStockProducts(5);

            // 訂單統計
            List<Order> todayOrders = orderService.findTodayOrders();
            List<Order> recentOrders = orderService.findRecentOrders(10);
            BigDecimal todaySales = orderService.calculateTodaySales();
            BigDecimal thisMonthSales = orderService.calculateThisMonthSales();

            // 訂單狀態統計
            List<Object[]> statusStats = orderService.getOrderStatusStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of(
                    "activeProducts", activeProducts,
                    "inactiveProducts", inactiveProducts,
                    "lowStockProducts", lowStockProducts,
                    "todayOrdersCount", todayOrders.size(),
                    "todaySales", todaySales,
                    "thisMonthSales", thisMonthSales,
                    "recentOrders", recentOrders,
                    "statusStats", statusStats
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "獲取統計數據失敗：" + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}