package com.example.adapter

import com.example.domain.User
import com.example.port.UserRepository
import org.springframework.stereotype.Repository

@Repository
class UserRepositoryImpl : UserRepository {
    override fun findAll(): List<User> = emptyList()
}
