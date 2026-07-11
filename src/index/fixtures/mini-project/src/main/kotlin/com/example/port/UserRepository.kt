package com.example.port

import com.example.domain.User

interface UserRepository {
    fun findAll(): List<User>
}
