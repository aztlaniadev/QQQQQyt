#!/usr/bin/env python3
"""
Acode Lab Backend API Testing Suite
Tests all endpoints including authentication, questions, answers, voting, and gamification
"""

import requests
import sys
import json
from datetime import datetime
import time

class AcodeLabAPITester:
    def __init__(self, base_url="https://devlab-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {}
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        self.log(f"   URL: {url}")
        self.log(f"   Method: {method}")
        if data:
            self.log(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            self.log(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name}")
                try:
                    response_data = response.json()
                    self.log(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name}")
                self.log(f"   Expected status: {expected_status}, got: {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error response: {json.dumps(error_data, indent=2)}")
                except:
                    self.log(f"   Error text: {response.text}")
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - {name} - Exception: {str(e)}", "ERROR")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_register_user(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "bio": "Desenvolvedor Python especialista em APIs",
            "location": "São Paulo, Brasil"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.test_data['user'] = response['user']
            self.log(f"   Registered user ID: {self.user_id}")
            self.log(f"   Initial PCon points: {response['user']['pcon_points']}")
            return True
        return False

    def test_login_user(self):
        """Test user login with existing credentials"""
        if not self.test_data.get('user'):
            self.log("❌ No user data available for login test", "ERROR")
            return False
            
        login_data = {
            "email": self.test_data['user']['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_question(self):
        """Test creating a question"""
        question_data = {
            "title": "Como implementar autenticação JWT em FastAPI?",
            "content": "Estou desenvolvendo uma API com FastAPI e preciso implementar autenticação JWT. Quais são as melhores práticas?",
            "tags": ["fastapi", "jwt", "python", "authentication"]
        }
        
        success, response = self.run_test(
            "Create Question",
            "POST",
            "questions",
            200,
            data=question_data
        )
        
        if success and 'id' in response:
            self.test_data['question_id'] = response['id']
            self.log(f"   Created question ID: {response['id']}")
            return True
        return False

    def test_get_questions(self):
        """Test getting questions list"""
        success, response = self.run_test(
            "Get Questions List",
            "GET",
            "questions?skip=0&limit=10",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} questions")
            return True
        return False

    def test_get_question_by_id(self):
        """Test getting a specific question"""
        if not self.test_data.get('question_id'):
            self.log("❌ No question ID available", "ERROR")
            return False
            
        success, response = self.run_test(
            "Get Question by ID",
            "GET",
            f"questions/{self.test_data['question_id']}",
            200
        )
        
        if success:
            self.log(f"   Question views: {response.get('views', 0)}")
            return True
        return False

    def test_create_answer(self):
        """Test creating an answer"""
        if not self.test_data.get('question_id'):
            self.log("❌ No question ID available", "ERROR")
            return False
            
        answer_data = {
            "content": "Para implementar JWT em FastAPI, você pode usar a biblioteca python-jose. Primeiro instale: pip install python-jose[cryptography]. Depois crie funções para gerar e verificar tokens...",
            "question_id": self.test_data['question_id']
        }
        
        success, response = self.run_test(
            "Create Answer",
            "POST",
            "answers",
            200,
            data=answer_data
        )
        
        if success and 'id' in response:
            self.test_data['answer_id'] = response['id']
            self.log(f"   Created answer ID: {response['id']}")
            return True
        return False

    def test_get_answers(self):
        """Test getting answers for a question"""
        if not self.test_data.get('question_id'):
            self.log("❌ No question ID available", "ERROR")
            return False
            
        success, response = self.run_test(
            "Get Question Answers",
            "GET",
            f"questions/{self.test_data['question_id']}/answers",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} answers")
            return True
        return False

    def test_vote_on_question(self):
        """Test voting on a question"""
        if not self.test_data.get('question_id'):
            self.log("❌ No question ID available", "ERROR")
            return False
            
        vote_data = {
            "target_id": self.test_data['question_id'],
            "target_type": "question",
            "vote_type": "upvote"
        }
        
        success, response = self.run_test(
            "Vote on Question (Upvote)",
            "POST",
            "vote",
            200,
            data=vote_data
        )
        return success

    def test_vote_on_answer(self):
        """Test voting on an answer"""
        if not self.test_data.get('answer_id'):
            self.log("❌ No answer ID available", "ERROR")
            return False
            
        vote_data = {
            "target_id": self.test_data['answer_id'],
            "target_type": "answer",
            "vote_type": "upvote"
        }
        
        success, response = self.run_test(
            "Vote on Answer (Upvote)",
            "POST",
            "vote",
            200,
            data=vote_data
        )
        return success

    def test_accept_answer(self):
        """Test accepting an answer"""
        if not self.test_data.get('answer_id'):
            self.log("❌ No answer ID available", "ERROR")
            return False
            
        success, response = self.run_test(
            "Accept Answer",
            "POST",
            f"answers/{self.test_data['answer_id']}/accept",
            200
        )
        return success

    def test_get_user_vote(self):
        """Test getting user's vote on a target"""
        if not self.test_data.get('question_id') or not self.user_id:
            self.log("❌ Missing question ID or user ID", "ERROR")
            return False
            
        success, response = self.run_test(
            "Get User Vote",
            "GET",
            f"users/{self.user_id}/votes/{self.test_data['question_id']}",
            200
        )
        
        if success:
            self.log(f"   User vote type: {response.get('vote_type', 'None')}")
            return True
        return False

    def test_get_user_stats(self):
        """Test getting user statistics"""
        if not self.user_id:
            self.log("❌ No user ID available", "ERROR")
            return False
            
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            f"users/{self.user_id}/stats",
            200
        )
        
        if success:
            user = response.get('user', {})
            self.log(f"   PC Points: {user.get('pc_points', 0)}")
            self.log(f"   PCon Points: {user.get('pcon_points', 0)}")
            self.log(f"   Rank: {user.get('rank', 'Unknown')}")
            self.log(f"   Questions: {response.get('questions_count', 0)}")
            self.log(f"   Answers: {response.get('answers_count', 0)}")
            self.log(f"   Accepted Answers: {response.get('accepted_answers', 0)}")
            self.log(f"   Validated Answers: {response.get('validated_answers', 0)}")
            return True
        return False

    # ===== ADMIN VALIDATION SYSTEM TESTS =====
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        admin_login_data = {
            "email": "admin@teste.com",
            "password": "Admin123!"
        }
        
        success, response = self.run_test(
            "Admin Login (admin@teste.com)",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            # Store current user token for later restoration
            self.test_data['user_token'] = self.token
            self.test_data['user_id'] = self.user_id
            
            # Set admin token
            self.token = response['token']
            self.test_data['admin_token'] = response['token']
            self.test_data['admin_id'] = response['user']['id']
            
            # Verify admin flag
            if response['user'].get('is_admin', False):
                self.log(f"   ✅ Admin user confirmed: {response['user'].get('username', response['user'].get('email'))}")
                self.log(f"   Admin ID: {response['user']['id']}")
                self.log(f"   is_admin: {response['user']['is_admin']}")
                return True
            else:
                self.log("   ❌ User is not marked as admin")
                self.log(f"   Response user data: {response['user']}")
                return False
        return False

    def test_normal_user_login(self):
        """Test normal user login with provided credentials"""
        normal_user_login_data = {
            "email": "usuario@teste.com",
            "password": "Usuario123!"
        }
        
        success, response = self.run_test(
            "Normal User Login (usuario@teste.com)",
            "POST",
            "auth/login",
            200,
            data=normal_user_login_data
        )
        
        if success and 'token' in response:
            # Store normal user token
            self.test_data['normal_user_token'] = response['token']
            self.test_data['normal_user_id'] = response['user']['id']
            
            # Verify NOT admin flag
            if not response['user'].get('is_admin', True):
                self.log(f"   ✅ Normal user confirmed: {response['user'].get('username', response['user'].get('email'))}")
                self.log(f"   User ID: {response['user']['id']}")
                self.log(f"   is_admin: {response['user'].get('is_admin', False)}")
                return True
            else:
                self.log("   ❌ User is marked as admin when it shouldn't be")
                self.log(f"   Response user data: {response['user']}")
                return False
        return False

    def test_admin_get_stats(self):
        """Test admin can access stats endpoint"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Get Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success and isinstance(response, dict):
            self.log(f"   Total users: {response.get('total_users', 0)}")
            self.log(f"   Total companies: {response.get('total_companies', 0)}")
            self.log(f"   Total questions: {response.get('total_questions', 0)}")
            self.log(f"   Total answers: {response.get('total_answers', 0)}")
            self.log(f"   Pending answers: {response.get('pending_answers', 0)}")
            self.log(f"   Total articles: {response.get('total_articles', 0)}")
            return True
        return False

    def test_normal_user_cannot_access_admin_stats(self):
        """Test that normal user cannot access admin stats"""
        # Switch to normal user token
        if self.test_data.get('normal_user_token'):
            self.token = self.test_data['normal_user_token']
        
        success, response = self.run_test(
            "Normal User Access Admin Stats (Should Fail)",
            "GET",
            "admin/stats",
            403  # Should be forbidden
        )
        
        if success:
            self.log("   ✅ Normal user correctly denied access to admin stats")
            return True
        return False

    def test_admin_auth_me(self):
        """Test admin /auth/me endpoint returns correct data"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Auth Me",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            if response.get('is_admin', False):
                self.log(f"   ✅ Admin privileges confirmed via /auth/me")
                self.log(f"   Email: {response.get('email')}")
                self.log(f"   is_admin: {response.get('is_admin')}")
                return True
            else:
                self.log("   ❌ Admin flag not found in /auth/me response")
                self.log(f"   Response: {response}")
                return False
        return False

    def test_normal_user_auth_me(self):
        """Test normal user /auth/me endpoint returns correct data"""
        # Switch to normal user token
        if self.test_data.get('normal_user_token'):
            self.token = self.test_data['normal_user_token']
        
        success, response = self.run_test(
            "Normal User Auth Me",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            if not response.get('is_admin', True):
                self.log(f"   ✅ Normal user confirmed via /auth/me")
                self.log(f"   Email: {response.get('email')}")
                self.log(f"   is_admin: {response.get('is_admin', False)}")
                return True
            else:
                self.log("   ❌ User incorrectly marked as admin in /auth/me response")
                self.log(f"   Response: {response}")
                return False
        return False

    def test_normal_user_create_answer_no_points(self):
        """Test that normal user creating answer doesn't get points immediately"""
        # Switch back to normal user
        if self.test_data.get('user_token'):
            self.token = self.test_data['user_token']
            self.user_id = self.test_data['user_id']
        
        # Get current user points before creating answer
        success, user_before = self.run_test(
            "Get User Before Answer",
            "GET",
            "auth/me",
            200
        )
        
        if not success:
            return False
            
        pc_before = user_before.get('pc_points', 0)
        pcon_before = user_before.get('pcon_points', 0)
        
        # Create a new question first for testing
        question_data = {
            "title": "Teste de validação por admin",
            "content": "Esta pergunta é para testar o sistema de validação por administrador.",
            "tags": ["teste", "admin", "validacao"]
        }
        
        success, question_response = self.run_test(
            "Create Test Question for Validation",
            "POST",
            "questions",
            200,
            data=question_data
        )
        
        if not success:
            return False
            
        test_question_id = question_response['id']
        self.test_data['validation_question_id'] = test_question_id
        
        # Create answer
        answer_data = {
            "content": "Esta é uma resposta de teste que deve aguardar validação por um administrador antes de conceder pontos.",
            "question_id": test_question_id
        }
        
        success, answer_response = self.run_test(
            "Create Answer (Should Not Give Points)",
            "POST",
            "answers",
            200,
            data=answer_data
        )
        
        if not success:
            return False
            
        self.test_data['validation_answer_id'] = answer_response['id']
        
        # Check answer is not validated
        if answer_response.get('is_validated', True):  # Should be False
            self.log("   ❌ Answer is marked as validated immediately")
            return False
        else:
            self.log("   ✅ Answer correctly marked as not validated")
        
        # Get user points after creating answer
        success, user_after = self.run_test(
            "Get User After Answer",
            "GET",
            "auth/me",
            200
        )
        
        if not success:
            return False
            
        pc_after = user_after.get('pc_points', 0)
        pcon_after = user_after.get('pcon_points', 0)
        
        # Verify no points were given
        if pc_after == pc_before and pcon_after == pcon_before:
            self.log(f"   ✅ No points given immediately (PC: {pc_before}→{pc_after}, PCon: {pcon_before}→{pcon_after})")
            return True
        else:
            self.log(f"   ❌ Points were given immediately (PC: {pc_before}→{pc_after}, PCon: {pcon_before}→{pcon_after})")
            return False

    def test_admin_get_pending_answers(self):
        """Test admin can get pending answers"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Get Pending Answers",
            "GET",
            "admin/answers/pending",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} pending answers")
            # Check if our test answer is in the list
            test_answer_id = self.test_data.get('validation_answer_id')
            if test_answer_id:
                found_test_answer = any(answer['id'] == test_answer_id for answer in response)
                if found_test_answer:
                    self.log(f"   ✅ Test answer found in pending list")
                else:
                    self.log(f"   ⚠️  Test answer not found in pending list")
            return True
        return False

    def test_normal_user_cannot_access_admin_routes(self):
        """Test that normal user cannot access admin routes"""
        # Switch back to normal user
        if self.test_data.get('user_token'):
            self.token = self.test_data['user_token']
        
        success, response = self.run_test(
            "Normal User Access Admin Route (Should Fail)",
            "GET",
            "admin/answers/pending",
            403  # Should be forbidden
        )
        
        if success:
            self.log("   ✅ Normal user correctly denied access to admin routes")
            return True
        return False

    def test_admin_validate_answer(self):
        """Test admin can validate answer and points are given"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Get the answer author's points before validation
        # Switch to user token to get current points
        if self.test_data.get('user_token'):
            temp_token = self.token
            self.token = self.test_data['user_token']
            
            success, user_before = self.run_test(
                "Get User Points Before Validation",
                "GET",
                "auth/me",
                200
            )
            
            if not success:
                return False
                
            pc_before = user_before.get('pc_points', 0)
            pcon_before = user_before.get('pcon_points', 0)
            
            # Switch back to admin
            self.token = temp_token
        
        # Validate the answer
        answer_id = self.test_data.get('validation_answer_id')
        if not answer_id:
            self.log("❌ No validation answer ID available", "ERROR")
            return False
        
        success, response = self.run_test(
            "Admin Validate Answer",
            "POST",
            f"admin/answers/{answer_id}/validate",
            200
        )
        
        if not success:
            return False
        
        # Check user got points after validation
        if self.test_data.get('user_token'):
            temp_token = self.token
            self.token = self.test_data['user_token']
            
            success, user_after = self.run_test(
                "Get User Points After Validation",
                "GET",
                "auth/me",
                200
            )
            
            if success:
                pc_after = user_after.get('pc_points', 0)
                pcon_after = user_after.get('pcon_points', 0)
                
                # Expected: +5 PC, +10 PCon for validated answer
                if pc_after > pc_before and pcon_after > pcon_before:
                    self.log(f"   ✅ Points awarded after validation (PC: {pc_before}→{pc_after}, PCon: {pcon_before}→{pcon_after})")
                    # Switch back to admin
                    self.token = temp_token
                    return True
                else:
                    self.log(f"   ❌ Points not awarded (PC: {pc_before}→{pc_after}, PCon: {pcon_before}→{pcon_after})")
                    # Switch back to admin
                    self.token = temp_token
                    return False
            
            # Switch back to admin
            self.token = temp_token
        
        return False

    def test_admin_reject_answer(self):
        """Test admin can reject answer"""
        # Create another answer to reject
        if self.test_data.get('user_token'):
            temp_token = self.token
            self.token = self.test_data['user_token']
            
            answer_data = {
                "content": "Esta resposta será rejeitada pelo administrador.",
                "question_id": self.test_data.get('validation_question_id')
            }
            
            success, answer_response = self.run_test(
                "Create Answer to Reject",
                "POST",
                "answers",
                200,
                data=answer_data
            )
            
            if not success:
                return False
                
            reject_answer_id = answer_response['id']
            
            # Switch back to admin
            self.token = temp_token
        
        # Reject the answer
        success, response = self.run_test(
            "Admin Reject Answer",
            "POST",
            f"admin/answers/{reject_answer_id}/reject",
            200
        )
        
        if success:
            self.log("   ✅ Answer rejected successfully")
            return True
        return False

    # ===== ADVANCED ADMIN FUNCTIONALITY TESTS =====
    
    def test_admin_get_users(self):
        """Test admin can get all users with pagination"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Get All Users",
            "GET",
            "admin/users?skip=0&limit=10",
            200
        )
        
        if success and isinstance(response, dict):
            users = response.get('users', [])
            total = response.get('total', 0)
            page = response.get('page', 0)
            total_pages = response.get('total_pages', 0)
            
            self.log(f"   Total users: {total}")
            self.log(f"   Users in page: {len(users)}")
            self.log(f"   Current page: {page}")
            self.log(f"   Total pages: {total_pages}")
            
            if len(users) > 0:
                self.log(f"   First user: {users[0].get('username', 'N/A')} ({users[0].get('email', 'N/A')})")
            
            return True
        return False

    def test_admin_get_companies(self):
        """Test admin can get all companies"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Get All Companies",
            "GET",
            "admin/companies?skip=0&limit=10",
            200
        )
        
        if success and isinstance(response, dict):
            companies = response.get('companies', [])
            total = response.get('total', 0)
            page = response.get('page', 0)
            total_pages = response.get('total_pages', 0)
            
            self.log(f"   Total companies: {total}")
            self.log(f"   Companies in page: {len(companies)}")
            self.log(f"   Current page: {page}")
            self.log(f"   Total pages: {total_pages}")
            
            if len(companies) > 0:
                self.log(f"   First company: {companies[0].get('name', 'N/A')} ({companies[0].get('email', 'N/A')})")
            
            return True
        return False

    def test_admin_get_advanced_stats(self):
        """Test admin can get advanced statistics"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        success, response = self.run_test(
            "Admin Get Advanced Stats",
            "GET",
            "admin/advanced-stats",
            200
        )
        
        if success and isinstance(response, dict):
            basic_stats = response.get('basic_stats', {})
            moderation_stats = response.get('moderation_stats', {})
            activity_stats = response.get('activity_stats', {})
            top_users = response.get('top_users', [])
            
            self.log("   Basic Stats:")
            self.log(f"     Total users: {basic_stats.get('total_users', 0)}")
            self.log(f"     Total companies: {basic_stats.get('total_companies', 0)}")
            self.log(f"     Total questions: {basic_stats.get('total_questions', 0)}")
            self.log(f"     Total answers: {basic_stats.get('total_answers', 0)}")
            self.log(f"     Pending answers: {basic_stats.get('pending_answers', 0)}")
            self.log(f"     Total articles: {basic_stats.get('total_articles', 0)}")
            
            self.log("   Moderation Stats:")
            self.log(f"     Banned users: {moderation_stats.get('banned_users', 0)}")
            self.log(f"     Muted users: {moderation_stats.get('muted_users', 0)}")
            self.log(f"     Silenced users: {moderation_stats.get('silenced_users', 0)}")
            self.log(f"     Bot users: {moderation_stats.get('bot_users', 0)}")
            self.log(f"     Banned companies: {moderation_stats.get('banned_companies', 0)}")
            
            self.log("   Activity Stats:")
            self.log(f"     Active today: {activity_stats.get('active_today', 0)}")
            
            self.log(f"   Top users count: {len(top_users)}")
            
            return True
        return False

    def test_admin_create_bot(self):
        """Test admin can create bot users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        import time
        timestamp = int(time.time())
        
        bot_data = {
            "username": f"bot_engajamento_{timestamp}",
            "email": f"bot_{timestamp}@acodelab.com",
            "pc_points": 250,
            "pcon_points": 150,
            "rank": "Especialista",
            "bio": "Bot criado para aumentar o engajamento da plataforma",
            "location": "São Paulo, Brasil",
            "skills": ["python", "javascript", "react", "fastapi"]
        }
        
        success, response = self.run_test(
            "Admin Create Bot User",
            "POST",
            "admin/create-bot",
            200,
            data=bot_data
        )
        
        if success and 'bot_id' in response:
            self.test_data['created_bot_id'] = response['bot_id']
            self.log(f"   Bot created with ID: {response['bot_id']}")
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_moderate_user_ban(self):
        """Test admin can ban users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the normal user ID for moderation test
        user_id = self.test_data.get('normal_user_id')
        if not user_id:
            self.log("❌ No normal user ID available for moderation test", "ERROR")
            return False
        
        from datetime import datetime, timedelta
        ban_expires = datetime.utcnow() + timedelta(days=7)
        
        moderation_data = {
            "user_id": user_id,
            "action": "ban",
            "reason": "Teste de moderação - comportamento inadequado",
            "expires": ban_expires.isoformat()
        }
        
        success, response = self.run_test(
            "Admin Ban User",
            "POST",
            "admin/moderate-user",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_moderate_user_unban(self):
        """Test admin can unban users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the normal user ID for moderation test
        user_id = self.test_data.get('normal_user_id')
        if not user_id:
            self.log("❌ No normal user ID available for moderation test", "ERROR")
            return False
        
        moderation_data = {
            "user_id": user_id,
            "action": "unban",
            "reason": "Teste concluído - removendo ban"
        }
        
        success, response = self.run_test(
            "Admin Unban User",
            "POST",
            "admin/moderate-user",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_moderate_user_mute(self):
        """Test admin can mute users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the normal user ID for moderation test
        user_id = self.test_data.get('normal_user_id')
        if not user_id:
            self.log("❌ No normal user ID available for moderation test", "ERROR")
            return False
        
        from datetime import datetime, timedelta
        mute_expires = datetime.utcnow() + timedelta(hours=24)
        
        moderation_data = {
            "user_id": user_id,
            "action": "mute",
            "reason": "Teste de moderação - spam em comentários",
            "expires": mute_expires.isoformat()
        }
        
        success, response = self.run_test(
            "Admin Mute User",
            "POST",
            "admin/moderate-user",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_moderate_user_silence(self):
        """Test admin can silence users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the normal user ID for moderation test
        user_id = self.test_data.get('normal_user_id')
        if not user_id:
            self.log("❌ No normal user ID available for moderation test", "ERROR")
            return False
        
        from datetime import datetime, timedelta
        silence_expires = datetime.utcnow() + timedelta(hours=12)
        
        moderation_data = {
            "user_id": user_id,
            "action": "silence",
            "reason": "Teste de moderação - linguagem inadequada",
            "expires": silence_expires.isoformat()
        }
        
        success, response = self.run_test(
            "Admin Silence User",
            "POST",
            "admin/moderate-user",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_update_user_points(self):
        """Test admin can update user points"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the normal user ID for points update test
        user_id = self.test_data.get('normal_user_id')
        if not user_id:
            self.log("❌ No normal user ID available for points update test", "ERROR")
            return False
        
        points_data = {
            "user_id": user_id,
            "pc_points": 500,
            "pcon_points": 300
        }
        
        success, response = self.run_test(
            "Admin Update User Points",
            "POST",
            "admin/update-points",
            200,
            data=points_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_normal_user_cannot_access_admin_endpoints(self):
        """Test that normal user cannot access any admin endpoints"""
        # Switch to normal user token
        if self.test_data.get('normal_user_token'):
            self.token = self.test_data['normal_user_token']
        
        admin_endpoints = [
            ("admin/users", "GET"),
            ("admin/companies", "GET"),
            ("admin/advanced-stats", "GET"),
            ("admin/create-bot", "POST"),
            ("admin/moderate-user", "POST"),
            ("admin/update-points", "POST")
        ]
        
        all_blocked = True
        
        for endpoint, method in admin_endpoints:
            test_data = {"test": "data"} if method == "POST" else None
            
            success, response = self.run_test(
                f"Normal User Access {endpoint} (Should Fail)",
                method,
                endpoint,
                403,  # Should be forbidden
                data=test_data
            )
            
            if not success:
                all_blocked = False
                self.log(f"   ❌ Endpoint {endpoint} not properly protected")
            else:
                self.log(f"   ✅ Endpoint {endpoint} correctly blocked")
        
        return all_blocked

    def test_admin_create_test_company(self):
        """Create a test company for moderation testing"""
        # Create a test company first
        import time
        timestamp = int(time.time())
        
        company_data = {
            "name": f"Empresa Teste {timestamp}",
            "email": f"empresa_{timestamp}@teste.com",
            "password": "EmpresaTeste123!",
            "description": "Empresa criada para testes de moderação",
            "website": "https://empresateste.com",
            "location": "Rio de Janeiro, Brasil",
            "size": "50-100"
        }
        
        # Temporarily remove auth token to register company
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Create Test Company",
            "POST",
            "auth/register-company",
            200,
            data=company_data
        )
        
        # Restore admin token
        self.token = temp_token
        
        if success and 'company' in response:
            self.test_data['test_company_id'] = response['company']['id']
            self.log(f"   Test company created with ID: {response['company']['id']}")
            return True
        return False

    def test_admin_moderate_company_ban(self):
        """Test admin can ban companies"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Create test company first if not exists
        if not self.test_data.get('test_company_id'):
            if not self.test_admin_create_test_company():
                return False
        
        company_id = self.test_data.get('test_company_id')
        if not company_id:
            self.log("❌ No test company ID available for moderation test", "ERROR")
            return False
        
        from datetime import datetime, timedelta
        ban_expires = datetime.utcnow() + timedelta(days=30)
        
        moderation_data = {
            "company_id": company_id,
            "action": "ban",
            "reason": "Teste de moderação - violação dos termos de uso",
            "expires": ban_expires.isoformat()
        }
        
        success, response = self.run_test(
            "Admin Ban Company",
            "POST",
            "admin/moderate-company",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_moderate_company_unban(self):
        """Test admin can unban companies"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        company_id = self.test_data.get('test_company_id')
        if not company_id:
            self.log("❌ No test company ID available for moderation test", "ERROR")
            return False
        
        moderation_data = {
            "company_id": company_id,
            "action": "unban",
            "reason": "Teste concluído - removendo ban da empresa"
        }
        
        success, response = self.run_test(
            "Admin Unban Company",
            "POST",
            "admin/moderate-company",
            200,
            data=moderation_data
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_delete_user(self):
        """Test admin can permanently delete users"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        # Use the created bot for deletion test (safer than deleting real user)
        bot_id = self.test_data.get('created_bot_id')
        if not bot_id:
            self.log("❌ No bot ID available for deletion test", "ERROR")
            return False
        
        success, response = self.run_test(
            "Admin Delete User (Bot)",
            "DELETE",
            f"admin/users/{bot_id}",
            200
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def test_admin_delete_company(self):
        """Test admin can permanently delete companies"""
        # Switch to admin token
        if self.test_data.get('admin_token'):
            self.token = self.test_data['admin_token']
        
        company_id = self.test_data.get('test_company_id')
        if not company_id:
            self.log("❌ No test company ID available for deletion test", "ERROR")
            return False
        
        success, response = self.run_test(
            "Admin Delete Company",
            "DELETE",
            f"admin/companies/{company_id}",
            200
        )
        
        if success:
            self.log(f"   Message: {response.get('message', 'N/A')}")
            return True
        return False

    def run_authentication_test_suite(self):
        """Run focused authentication tests for the specific user credentials"""
        self.log("🚀 Starting Authentication Test Suite for Test Users")
        self.log(f"   Base URL: {self.base_url}")
        
        # Test sequence focused on authentication
        tests = [
            ("Health Check", self.test_health_check),
            ("Admin Login (admin@teste.com)", self.test_admin_login),
            ("Normal User Login (usuario@teste.com)", self.test_normal_user_login),
            ("Admin Auth Me", self.test_admin_auth_me),
            ("Normal User Auth Me", self.test_normal_user_auth_me),
            ("Admin Get Stats", self.test_admin_get_stats),
            ("Admin Get Pending Answers", self.test_admin_get_pending_answers),
            ("Normal User Cannot Access Admin Stats", self.test_normal_user_cannot_access_admin_stats),
            ("Normal User Cannot Access Admin Routes", self.test_normal_user_cannot_access_admin_routes),
        ]
        
        self.log("\n" + "="*60)
        self.log("RUNNING AUTHENTICATION TESTS")
        self.log("="*60)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ FAILED - {test_name} - Exception: {str(e)}", "ERROR")
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Final results
        self.log("\n" + "="*60)
        self.log("AUTHENTICATION TEST RESULTS")
        self.log("="*60)
        self.log(f"📊 Tests Run: {self.tests_run}")
        self.log(f"✅ Tests Passed: {self.tests_passed}")
        self.log(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL AUTHENTICATION TESTS PASSED!")
            return 0
        else:
            self.log("⚠️  SOME AUTHENTICATION TESTS FAILED")
            return 1

    def run_full_test_suite(self):
        """Run the complete test suite"""
        self.log("🚀 Starting Acode Lab API Test Suite")
        self.log(f"   Base URL: {self.base_url}")
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register_user),
            ("User Login", self.test_login_user),
            ("Get Current User", self.test_get_current_user),
            ("Create Question", self.test_create_question),
            ("Get Questions List", self.test_get_questions),
            ("Get Question by ID", self.test_get_question_by_id),
            ("Create Answer", self.test_create_answer),
            ("Get Answers", self.test_get_answers),
            ("Vote on Question", self.test_vote_on_question),
            ("Vote on Answer", self.test_vote_on_answer),
            ("Accept Answer", self.test_accept_answer),
            ("Get User Vote", self.test_get_user_vote),
            ("Get User Stats", self.test_get_user_stats),
            # Admin validation system tests
            ("Admin Login", self.test_admin_login),
            ("Normal User Login", self.test_normal_user_login),
            ("Admin Auth Me", self.test_admin_auth_me),
            ("Normal User Auth Me", self.test_normal_user_auth_me),
            ("Admin Get Stats", self.test_admin_get_stats),
            ("Normal User Create Answer (No Points)", self.test_normal_user_create_answer_no_points),
            ("Admin Get Pending Answers", self.test_admin_get_pending_answers),
            ("Normal User Cannot Access Admin Stats", self.test_normal_user_cannot_access_admin_stats),
            ("Normal User Cannot Access Admin Routes", self.test_normal_user_cannot_access_admin_routes),
            ("Admin Validate Answer", self.test_admin_validate_answer),
            ("Admin Reject Answer", self.test_admin_reject_answer),
        ]
        
        self.log("\n" + "="*60)
        self.log("RUNNING TESTS")
        self.log("="*60)
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ FAILED - {test_name} - Exception: {str(e)}", "ERROR")
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Final results
        self.log("\n" + "="*60)
        self.log("TEST RESULTS")
        self.log("="*60)
        self.log(f"📊 Tests Run: {self.tests_run}")
        self.log(f"✅ Tests Passed: {self.tests_passed}")
        self.log(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!")
            return 0
        else:
            self.log("⚠️  SOME TESTS FAILED")
            return 1

def main():
    """Main test execution"""
    tester = AcodeLabAPITester()
    
    # Check if we should run focused authentication tests
    if len(sys.argv) > 1 and sys.argv[1] == "--auth":
        return tester.run_authentication_test_suite()
    else:
        return tester.run_full_test_suite()

if __name__ == "__main__":
    sys.exit(main())