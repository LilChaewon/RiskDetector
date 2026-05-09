package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<Contract, String> {

    @Query("""
            select c from Contract c
            where (:email is not null and c.user.email = :email)
               or (:guestSessionId is not null and c.guestSessionId = :guestSessionId)
            order by c.createdAt desc
            """)
    Page<Contract> findAccessibleContracts(
            @Param("email") String email,
            @Param("guestSessionId") String guestSessionId,
            Pageable pageable);

    @Query("""
            select count(c) from Contract c
            where (:email is not null and c.user.email = :email)
               or (:guestSessionId is not null and c.guestSessionId = :guestSessionId)
            """)
    long countAccessibleContracts(
            @Param("email") String email,
            @Param("guestSessionId") String guestSessionId);
}
