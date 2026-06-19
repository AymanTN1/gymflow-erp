package com.happyfitness.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GymFlowErpApplication {
    public static void main(String[] args) {
        SpringApplication.run(GymFlowErpApplication.class, args);
    }
}
