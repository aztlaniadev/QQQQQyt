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