package com.example.service;

import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.entity.Product;
import com.example.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 訂單服務類別
 */
@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductService productService;

    /**
     * 查詢所有訂單
     */
    public List<Order> findAllOrders() {
        return orderRepository.findAll();
    }

    /**
     * 依ID查詢訂單
     */
    public Optional<Order> findOrderById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return orderRepository.findById(id);
    }

    /**
     * 建立新訂單
     * @param customerName 客戶姓名
     * @param customerEmail 客戶Email
     * @param customerPhone 客戶電話
     * @param customerAddress 客戶地址
     * @param cartItems 購物車項目 (productId -> quantity)
     * @param notes 訂單備註
     * @return 建立的訂單
     */
    public Order createOrder(String customerName, String customerEmail, String customerPhone,
                             String customerAddress, Map<Long, Integer> cartItems, String notes) {

        if (customerName == null || customerName.trim().isEmpty()) {
            throw new IllegalArgumentException("客戶姓名不能為空");
        }
        if (customerPhone == null || customerPhone.trim().isEmpty()) {
            throw new IllegalArgumentException("客戶電話不能為空");
        }
        if (customerAddress == null || customerAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("客戶地址不能為空");
        }
        if (cartItems == null || cartItems.isEmpty()) {
            throw new IllegalArgumentException("購物車不能為空");
        }

        // 建立訂單
        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = new Order(customerName.trim(),
                customerEmail != null ? customerEmail.trim() : null,
                customerPhone.trim(),
                customerAddress.trim(),
                totalAmount);
        order.setNotes(notes != null ? notes.trim() : null);

        // 處理購物車項目
        for (Map.Entry<Long, Integer> entry : cartItems.entrySet()) {
            Long productId = entry.getKey();
            Integer quantity = entry.getValue();

            if (quantity == null || quantity <= 0) {
                continue; // 跳過無效數量
            }

            Optional<Product> optionalProduct = productService.findProductById(productId);
            if (optionalProduct.isPresent()) {
                Product product = optionalProduct.get();

                // 檢查商品是否上架
                if (!product.getIsActive()) {
                    throw new RuntimeException("商品已下架：" + product.getName());
                }

                // 檢查庫存是否足夠
                if (product.getStockQuantity() < quantity) {
                    throw new RuntimeException("庫存不足：商品「" + product.getName() + "」目前庫存 " +
                            product.getStockQuantity() + "，需要 " + quantity);
                }

                // 建立訂單項目
                OrderItem orderItem = new OrderItem(order, product, quantity, product.getPrice());
                order.addOrderItem(orderItem);

                // 累加總金額
                totalAmount = totalAmount.add(orderItem.getSubtotal());

                // 減少庫存
                productService.reduceStock(productId, quantity);
            } else {
                throw new RuntimeException("商品不存在：ID = " + productId);
            }
        }

        if (order.getOrderItems().isEmpty()) {
            throw new RuntimeException("訂單中沒有有效商品");
        }

        order.setTotalAmount(totalAmount);
        return orderRepository.save(order);
    }

    /**
     * 更新訂單狀態
     */
    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        if (orderId == null) {
            throw new IllegalArgumentException("訂單ID不能為空");
        }
        if (status == null) {
            throw new IllegalArgumentException("訂單狀態不能為空");
        }

        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            order.setStatus(status);
            return orderRepository.save(order);
        }
        throw new RuntimeException("訂單不存在：ID = " + orderId);
    }

    /**
     * 取消訂單（恢復庫存）
     */
    public Order cancelOrder(Long orderId) {
        if (orderId == null) {
            throw new IllegalArgumentException("訂單ID不能為空");
        }

        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();

            // 檢查訂單狀態是否可以取消
            if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                throw new RuntimeException("已送達的訂單無法取消");
            }
            if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                throw new RuntimeException("訂單已經是取消狀態");
            }

            // 恢復庫存
            for (OrderItem orderItem : order.getOrderItems()) {
                try {
                    productService.increaseStock(orderItem.getProduct().getId(), orderItem.getQuantity());
                } catch (Exception e) {
                    // 如果商品已被刪除，記錄警告但不中斷流程
                    System.err.println("警告：恢復庫存失敗，商品ID: " + orderItem.getProduct().getId() + ", 原因: " + e.getMessage());
                }
            }

            order.setStatus(Order.OrderStatus.CANCELLED);
            return orderRepository.save(order);
        }
        throw new RuntimeException("訂單不存在：ID = " + orderId);
    }

    /**
     * 依客戶訂單編號或電話查詢訂單
     */
    public List<Order> findCustomerOrders(String orderId, String customerPhone) {
        if ((orderId == null || orderId.trim().isEmpty()) &&
                (customerPhone == null || customerPhone.trim().isEmpty())) {
            throw new IllegalArgumentException("請提供訂單編號或電話號碼");
        }

        String id = orderId != null ? orderId.trim() : "";
        String phone = customerPhone != null ? customerPhone.trim() : "";

        return orderRepository.findCustomerOrders(id, phone);
    }

    /**
     * 依條件查詢訂單（後台管理用）
     */
    public List<Order> findOrdersByConditions(String customerName, String customerEmail,
                                              String customerPhone, Order.OrderStatus status) {
        return orderRepository.findByConditions(customerName, customerEmail, customerPhone, status);
    }

    /**
     * 查詢指定日期範圍的訂單
     */
    public List<Order> findOrdersByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("開始日期和結束日期不能為空");
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        return orderRepository.findByOrderDateBetweenOrderByOrderDateDesc(startDateTime, endDateTime);
    }

    /**
     * 查詢今日訂單
     */
    public List<Order> findTodayOrders() {
        return orderRepository.findTodayOrders();
    }

    /**
     * 查詢本月訂單
     */
    public List<Order> findThisMonthOrders() {
        return orderRepository.findThisMonthOrders();
    }

    /**
     * 查詢最近的訂單
     */
    public List<Order> findRecentOrders(int limit) {
        if (limit <= 0) {
            limit = 10; // 預設10筆
        }
        return orderRepository.findRecentOrders(limit);
    }

    /**
     * 統計各狀態的訂單數量
     */
    public List<Object[]> getOrderStatusStatistics() {
        return orderRepository.countByStatus();
    }

    /**
     * 計算指定日期範圍的總銷售額（排除取消訂單）
     */
    public BigDecimal calculateTotalSales(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return BigDecimal.ZERO;
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        BigDecimal total = orderRepository.sumTotalAmountByDateRangeExcludeCancelled(startDateTime, endDateTime);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * 計算今日銷售額
     */
    public BigDecimal calculateTodaySales() {
        LocalDate today = LocalDate.now();
        return calculateTotalSales(today, today);
    }

    /**
     * 計算本月銷售額
     */
    public BigDecimal calculateThisMonthSales() {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now();
        return calculateTotalSales(startOfMonth, endOfMonth);
    }

    /**
     * 統計指定日期範圍各狀態訂單的金額
     */
    public List<Object[]> getSalesStatisticsByStatus(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return List.of();
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        return orderRepository.sumAmountByStatusAndDateRange(startDateTime, endDateTime);
    }
}