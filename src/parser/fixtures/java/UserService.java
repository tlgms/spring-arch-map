package com.example.demo.service;

import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService extends BaseService implements UserOperations {

    private final UserRepository userRepository;
    private final Notifier notifier;

    public UserService(UserRepository userRepository, Optional<Notifier> notifier) {
        this.userRepository = userRepository;
        this.notifier = notifier.orElse(null);
    }

    public List<User> findUsers() {
        return userRepository.findAll();
    }
}
