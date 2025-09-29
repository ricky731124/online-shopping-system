package com.example.repository;

import com.example.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 商品資料存取介面
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * 查詢所有上架的商品，依建立時間倒序排列
     */
    List<Product> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * 依分類查詢上架商品
     */
    List<Product> findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(String category);

    /**
     * 依商品名稱模糊查詢上架商品
     */
    List<Product> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByCreatedAtDesc(String name);

    /**
     * 依分類和名稱模糊查詢上架商品
     */
    List<Product> findByIsActiveTrueAndCategoryAndNameContainingIgnoreCaseOrderByCreatedAtDesc(String category, String name);

    /**
     * 查詢所有不重複的商品分類（只包含上架商品）
     */
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.isActive = true ORDER BY p.category")
    List<String> findDistinctCategoriesByIsActiveTrue();

    /**
     * 複合查詢：依分類、名稱、上架狀態查詢（後台管理用）
     */
    @Query("SELECT p FROM Product p WHERE " +
            "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
            "(:name IS NULL OR :name = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:isActive IS NULL OR p.isActive = :isActive) " +
            "ORDER BY p.createdAt DESC")
    List<Product> findByConditions(@Param("category") String category,
                                   @Param("name") String name,
                                   @Param("isActive") Boolean isActive);

    /**
     * 統計各分類的上架商品數量
     */
    @Query("SELECT p.category as category, COUNT(p) as count FROM Product p WHERE p.isActive = true GROUP BY p.category ORDER BY p.category")
    List<Object[]> countActiveProductsByCategory();

    /**
     * 查詢庫存不足的商品
     */
    List<Product> findByStockQuantityLessThanEqualAndIsActiveTrueOrderByStockQuantityAsc(Integer threshold);

    /**
     * 依商品ID列表查詢上架商品
     */
    @Query("SELECT p FROM Product p WHERE p.id IN :ids AND p.isActive = true")
    List<Product> findByIdsAndActive(@Param("ids") List<Long> ids);

    /**
     * 統計上架商品總數
     */
    long countByIsActiveTrue();

    /**
     * 統計下架商品總數
     */
    long countByIsActiveFalse();
}