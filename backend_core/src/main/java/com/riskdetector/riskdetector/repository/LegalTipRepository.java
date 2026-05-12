package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.LegalTip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LegalTipRepository extends JpaRepository<LegalTip, Long> {

    boolean existsBySourceId(String sourceId);

    Optional<LegalTip> findBySourceId(String sourceId);

    List<LegalTip> findTop5ByOrderByViewCountDescCreatedAtDesc();

    @Query("""
            select distinct t.category from LegalTip t
            where t.category is not null and t.category <> ''
            order by t.category asc
            """)
    List<String> findDistinctCategories();

    @Query("""
            select t from LegalTip t
            where (:category is null or :category = '' or lower(t.category) like lower(concat('%', :category, '%')))
              and (:q is null or :q = ''
                   or lower(t.question) like lower(concat('%', :q, '%'))
                   or lower(t.answer) like lower(concat('%', :q, '%')))
            order by t.viewCount desc, t.createdAt desc
            """)
    Page<LegalTip> search(
            @Param("category") String category,
            @Param("q") String q,
            Pageable pageable);
}
