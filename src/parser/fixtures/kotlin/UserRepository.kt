package com.example.demo.repository

import com.example.demo.domain.User

interface UserRepository {
    fun findAll(): List<User>
    fun findById(id: Long): User?
}
