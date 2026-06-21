package com.happyfitness.erp.repository;

import com.happyfitness.erp.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByActifTrue();
    List<Course> findByJourAndActifTrue(String jour);
    List<Course> findByCoachAndActifTrue(String coach);
}
