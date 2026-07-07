package com.example.demo.service

import com.example.demo.domain.User
import com.example.demo.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val notifier: Notifier?
) : BaseService(), UserOperations {

    fun findUsers(): List<User> {
        return userRepository.findAll()
    }
}
