package com.riskdetector.riskdetector.repository;

import com.riskdetector.riskdetector.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContractRepository extends JpaRepository<Contract, String> {
}
