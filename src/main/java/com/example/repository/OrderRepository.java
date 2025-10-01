package com.example.repository;

import com.example.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 訂單資料存取介面
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * 依客戶名稱模糊查詢訂單
     */
    List<Order> findByCustomerNameContainingIgnoreCaseOrderByOrderDateDesc(String customerName);

    /**
     * 依客戶電話查詢訂單
     */
    List<Order> findByCustomerPhoneOrderByOrderDateDesc(String customerPhone);

    /**
     * 依客戶Email查詢訂單
     */
    List<Order> findByCustomerEmailOrderByOrderDateDesc(String customerEmail);

    /**
     * 依訂單狀態查詢，依下單時間倒序排列
     */
    List<Order> findByStatusOrderByOrderDateDesc(Order.OrderStatus status);

    /**
     * 依日期範圍查詢訂單
     */
    List<Order> findByOrderDateBetweenOrderByOrderDateDesc(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 依客戶聯絡資訊查詢訂單（客戶查詢自己的訂單用）
     */
    @Query("SELECT o FROM Order o WHERE " +
            "(CAST(o.id AS string) = :orderId OR o.customerPhone = :phone) " +
            "ORDER BY o.orderDate DESC")
    List<Order> findCustomerOrders(@Param("orderId") String orderId,
                                   @Param("phone") String customerPhone);

    /**
     * 複合查詢：依多個條件查詢訂單（後台管理用）
     */
    @Query("SELECT o FROM Order o WHERE " +
            "(:customerName IS NULL OR :customerName = '' OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
            "(:customerEmail IS NULL OR :customerEmail = '' OR o.customerEmail = :customerEmail) AND " +
            "(:customerPhone IS NULL OR :customerPhone = '' OR o.customerPhone = :customerPhone) AND " +
            "(:status IS NULL OR o.status = :status) " +
            "ORDER BY o.orderDate DESC")
    List<Order> findByConditions(@Param("customerName") String customerName,
                                 @Param("customerEmail") String customerEmail,
                                 @Param("customerPhone") String customerPhone,
                                 @Param("status") Order.OrderStatus status);

    /**
     * 查詢最近的訂單（限制筆數）
     */
    @Query("SELECT o FROM Order o ORDER BY o.orderDate DESC LIMIT :limit")
    List<Order> findRecentOrders(@Param("limit") int limit);

    /**
     * 統計各狀態的訂單數量
     */
    @Query("SELECT o.status as status, COUNT(o) as count FROM Order o GROUP BY o.status")
    List<Object[]> countByStatus();

    /**
     * 查詢今日訂單
     */
    @Query("SELECT o FROM Order o WHERE DATE(o.orderDate) = CURRENT_DATE ORDER BY o.orderDate DESC")
    List<Order> findTodayOrders();

    /**
     * 查詢本月訂單
     */
    @Query("SELECT o FROM Order o WHERE YEAR(o.orderDate) = YEAR(CURRENT_DATE) AND MONTH(o.orderDate) = MONTH(CURRENT_DATE) ORDER BY o.orderDate DESC")
    List<Order> findThisMonthOrders();

    /**
     * 統計指定日期範圍內各狀態訂單的總金額
     */
    @Query("SELECT o.status, SUM(o.totalAmount) FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate GROUP BY o.status")
    List<Object[]> sumAmountByStatusAndDateRange(@Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate") LocalDateTime endDate);

    /**
     * 計算指定日期範圍內的總銷售額（排除已取消的訂單）
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate AND o.status != 'CANCELLED'")
    java.math.BigDecimal sumTotalAmountByDateRangeExcludeCancelled(@Param("startDate") LocalDateTime startDate,
                                                                   @Param("endDate") LocalDateTime endDate);
}