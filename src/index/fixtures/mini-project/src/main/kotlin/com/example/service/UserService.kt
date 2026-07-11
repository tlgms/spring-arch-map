package com.example.service

import com.example.port.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(private val userRepository: UserRepository)
