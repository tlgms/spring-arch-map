package com.example.demo.repository;

import com.example.demo.domain.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    List<User> findAll();

    Optional<User> findById(Long id);
}
