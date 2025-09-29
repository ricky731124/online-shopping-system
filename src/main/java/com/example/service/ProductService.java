package com.example.service;

import com.example.entity.Product;
import com.example.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 商品服務類別
 */
@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    /**
     * 查詢所有商品（後台用）
     */
    public List<Product> findAllProducts() {
        return productRepository.findAll();
    }

    /**
     * 查詢所有上架商品（前台用）
     */
    public List<Product> findActiveProducts() {
        return productRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    /**
     * 依ID查詢商品
     */
    public Optional<Product> findProductById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return productRepository.findById(id);
    }

    /**
     * 儲存商品（新增或更新）
     */
    public Product saveProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("商品資料不能為空");
        }

        // 設定預設值
        if (product.getIsActive() == null) {
            product.setIsActive(true);
        }
        if (product.getStockQuantity() == null) {
            product.setStockQuantity(0);
        }

        return productRepository.save(product);
    }

    /**
     * 刪除商品
     */
    public void deleteProduct(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("商品ID不能為空");
        }

        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            productRepository.deleteById(id);
        } else {
            throw new RuntimeException("商品不存在：ID = " + id);
        }
    }

    /**
     * 切換商品上架狀態
     */
    public Product toggleProductStatus(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("商品ID不能為空");
        }

        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setIsActive(!product.getIsActive());
            return productRepository.save(product);
        }
        throw new RuntimeException("商品不存在：ID = " + id);
    }

    /**
     * 依分類查詢上架商品
     */
    public List<Product> findActiveProductsByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return findActiveProducts();
        }
        return productRepository.findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(category.trim());
    }

    /**
     * 依名稱模糊查詢上架商品
     */
    public List<Product> findActiveProductsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return findActiveProducts();
        }
        return productRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByCreatedAtDesc(name.trim());
    }

    /**
     * 複合搜尋上架商品
     */
    public List<Product> searchActiveProducts(String category, String name) {
        // 處理空字串和null
        String searchCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
        String searchName = (name != null && !name.trim().isEmpty()) ? name.trim() : null;

        if (searchCategory != null && searchName != null) {
            return productRepository.findByIsActiveTrueAndCategoryAndNameContainingIgnoreCaseOrderByCreatedAtDesc(searchCategory, searchName);
        } else if (searchCategory != null) {
            return productRepository.findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(searchCategory);
        } else if (searchName != null) {
            return productRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByCreatedAtDesc(searchName);
        } else {
            return findActiveProducts();
        }
    }

    /**
     * 查詢所有商品分類
     */
    public List<String> findAllCategories() {
        return productRepository.findDistinctCategoriesByIsActiveTrue();
    }

    /**
     * 後台複合查詢商品
     */
    public List<Product> findProductsByConditions(String category, String name, Boolean isActive) {
        return productRepository.findByConditions(category, name, isActive);
    }

    /**
     * 更新商品庫存
     */
    public Product updateStock(Long productId, Integer quantity) {
        if (productId == null) {
            throw new IllegalArgumentException("商品ID不能為空");
        }
        if (quantity == null || quantity < 0) {
            throw new IllegalArgumentException("庫存數量必須大於等於0");
        }

        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            product.setStockQuantity(quantity);
            return productRepository.save(product);
        }
        throw new RuntimeException("商品不存在：ID = " + productId);
    }

    /**
     * 減少商品庫存（下訂時使用）
     */
    public Product reduceStock(Long productId, Integer quantity) {
        if (productId == null) {
            throw new IllegalArgumentException("商品ID不能為空");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("減少的庫存數量必須大於0");
        }

        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            int currentStock = product.getStockQuantity();

            if (currentStock >= quantity) {
                product.setStockQuantity(currentStock - quantity);
                return productRepository.save(product);
            } else {
                throw new RuntimeException("庫存不足：商品「" + product.getName() + "」目前庫存 " + currentStock + "，需要 " + quantity);
            }
        }
        throw new RuntimeException("商品不存在：ID = " + productId);
    }

    /**
     * 增加商品庫存（取消訂單時恢復庫存）
     */
    public Product increaseStock(Long productId, Integer quantity) {
        if (productId == null) {
            throw new IllegalArgumentException("商品ID不能為空");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("增加的庫存數量必須大於0");
        }

        Optional<Product> optionalProduct = productRepository.findById(productId);
        if (optionalProduct.isPresent()) {
            Product product = optionalProduct.get();
            int currentStock = product.getStockQuantity();
            product.setStockQuantity(currentStock + quantity);
            return productRepository.save(product);
        }
        throw new RuntimeException("商品不存在：ID = " + productId);
    }

    /**
     * 查詢庫存不足的商品
     */
    public List<Product> findLowStockProducts(Integer threshold) {
        if (threshold == null || threshold < 0) {
            threshold = 5; // 預設閾值
        }
        return productRepository.findByStockQuantityLessThanEqualAndIsActiveTrueOrderByStockQuantityAsc(threshold);
    }

    /**
     * 依商品ID列表查詢上架商品
     */
    public List<Product> findActiveProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return productRepository.findByIdsAndActive(ids);
    }

    /**
     * 統計商品數量
     */
    public long countActiveProducts() {
        return productRepository.countByIsActiveTrue();
    }

    public long countInactiveProducts() {
        return productRepository.countByIsActiveFalse();
    }

    /**
     * 統計各分類的商品數量
     */
    public List<Object[]> countProductsByCategory() {
        return productRepository.countActiveProductsByCategory();
    }
}