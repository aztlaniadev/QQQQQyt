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
    def __init__(self, base_url="https://codelab-pro.preview.emergentagent.com/api"):
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
            "email": "admin@acodelab.com",
            "password": "Admin123!"
        }
        
        success, response = self.run_test(
            "Admin Login",
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
                self.log(f"   ✅ Admin user confirmed: {response['user']['username']}")
                self.log(f"   Admin ID: {response['user']['id']}")
                return True
            else:
                self.log("   ❌ User is not marked as admin")
                return False
        return False

    def test_admin_get_me(self):
        """Test admin /auth/me endpoint"""
        success, response = self.run_test(
            "Admin Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            if response.get('is_admin', False):
                self.log(f"   ✅ Admin privileges confirmed")
                return True
            else:
                self.log("   ❌ Admin flag not found in response")
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
    return tester.run_full_test_suite()

if __name__ == "__main__":
    sys.exit(main())