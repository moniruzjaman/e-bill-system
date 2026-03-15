# -*- coding: utf-8 -*-
"""
API Server for Fertilizer Tracking E-Bill System
Using Python's built-in http.server with JSON responses
"""

import json
import os
import sys
import hashlib
import uuid
import base64
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Set UTF-8 encoding - handle both direct run and import cases
if sys.platform == 'win32':
    try:
        import codecs
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass

# Import data manager
sys.path.insert(0, os.path.dirname(__file__))
from data_manager import (
    save_user, get_user, list_users, update_user, delete_user,
    save_transaction, get_transaction, get_transactions, update_transaction_status,
    save_voucher, get_voucher, validate_voucher, redeem_voucher, get_vouchers_by_farmer,
    save_subsidy, get_subsidy, get_subsidy_rates, get_subsidy_report, calculate_subsidy,
    save_soil_test, get_soil_test, get_soil_tests_by_farmer,
    save_nue, get_nue, get_nue_by_region, get_all_nue,
    get_storage_stats, init_sample_data,
    save_inventory, get_inventory, get_dealer_inventory, adjust_stock
)

# Configuration
HOST = '0.0.0.0'
PORT = 8080

# Simple in-memory session storage
sessions = {}


def _json_response(data, status=200):
    """Create JSON response"""
    body = json.dumps(data, ensure_ascii=False, indent=2)
    return body.encode('utf-8'), status


def _error_response(message, status=400, code=None):
    """Create error response"""
    error_data = {
        'success': False,
        'error': {
            'code': code or 'ERROR',
            'message': message
        },
        'timestamp': datetime.now().astimezone().isoformat()
    }
    return _json_response(error_data, status)


def _success_response(data, message=None):
    """Create success response"""
    response_data = {
        'success': True,
        'data': data,
        'message': message,
        'timestamp': datetime.now().astimezone().isoformat()
    }
    return _json_response(response_data)


def _generate_token(user_id: str) -> str:
    """Generate simple auth token"""
    token_data = f"{user_id}:{datetime.now().isoformat()}"
    return hashlib.sha256(token_data.encode('utf-8')).hexdigest()


def _validate_token(token: str) -> dict:
    """Validate auth token and return user info"""
    if not token:
        return None
    
    session = sessions.get(token)
    if session:
        session_time = datetime.fromisoformat(session.get('created_at'))
        if datetime.now() - session_time > timedelta(hours=24):
            del sessions[token]
            return None
        return session.get('user')
    return None


def _get_json_body(handler):
    """Get JSON body from request"""
    content_length = int(handler.headers.get('Content-Length', 0))
    if content_length > 0:
        body = handler.rfile.read(content_length)
        return json.loads(body.decode('utf-8'))
    return {}


def _check_role(user, *roles):
    """Check if user has required role"""
    if not user:
        return False
    return user.get('role') in roles


# ==================== REQUEST HANDLER ====================

class APIHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the API"""
    
    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {args[0]}")
    
    def send_headers(self, status=200, content_type='application/json'):
        """Send response headers"""
        self.send_response(status)
        self.send_header('Content-Type', f'{content_type}; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_headers(200)
        self.send_header('Content-Length', '0')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        self._handle_request('GET')
    
    def do_POST(self):
        """Handle POST requests"""
        self._handle_request('POST')
    
    def do_PUT(self):
        """Handle PUT requests"""
        self._handle_request('PUT')
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        self._handle_request('DELETE')
    
    def _handle_request(self, method):
        """Route requests to appropriate handlers"""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        # Get current user from token
        auth_header = self.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '')
        current_user = _validate_token(token)
        
        # Route: Authentication (Public)
        if path == '/api/auth/login' and method == 'POST':
            self.handle_login()
            return
        elif path == '/api/auth/logout' and method == 'POST':
            self.handle_logout(current_user)
            return

        # Route: Public Info / Health
        elif path == '/api/health' and method == 'GET':
            self.handle_health()
            return
        elif path == '/' and method == 'GET':
            self.handle_index()
            return

        # Require authentication for other endpoints
        if not current_user:
            body, status = _error_response('Authentication required', 401, 'AUTH_REQUIRED')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        # Route: Profile (Requires Auth)
        if path == '/api/auth/profile' and method == 'GET':
            self.handle_get_profile(current_user)
            return
        
        # Route: Users
        if path == '/api/users' and method == 'GET':
            self.handle_list_users(current_user, query)
            return
        elif path == '/api/users' and method == 'POST':
            self.handle_create_user(current_user)
            return
        elif path.startswith('/api/users/') and method == 'GET':
            user_id = path.split('/')[-1]
            self.handle_get_user(current_user, user_id)
            return
        elif path.startswith('/api/users/') and method == 'PUT':
            user_id = path.split('/')[-1]
            self.handle_update_user(current_user, user_id)
            return
        elif path == '/api/farmers' and method == 'GET':
            self.handle_list_farmers(current_user)
            return
        elif path == '/api/dealers' and method == 'GET':
            self.handle_list_dealers(current_user)
            return
        
        # Route: Transactions
        elif path == '/api/transactions' and method == 'GET':
            self.handle_list_transactions(current_user, query)
            return
        elif path == '/api/transactions' and method == 'POST':
            self.handle_create_transaction(current_user)
            return
        elif path.startswith('/api/transactions/') and method == 'GET':
            tx_id = path.split('/')[-1]
            self.handle_get_transaction(current_user, tx_id)
            return
        elif path.endswith('/status') and method == 'PUT':
            parts = path.split('/')
            tx_id = parts[-2]
            self.handle_update_transaction_status(current_user, tx_id)
            return
        
        # Route: Vouchers
        elif path == '/api/vouchers' and method == 'GET':
            self.handle_list_vouchers(current_user)
            return
        elif path == '/api/vouchers' and method == 'POST':
            self.handle_create_voucher(current_user)
            return
        elif path == '/api/vouchers/validate' and method == 'POST':
            self.handle_validate_voucher(current_user)
            return
        elif path.startswith('/api/vouchers/') and '/redeem' in path:
            voucher_id = path.split('/')[3]
            self.handle_redeem_voucher(current_user, voucher_id)
            return
        elif path.startswith('/api/vouchers/') and method == 'GET':
            voucher_id = path.split('/')[-1]
            self.handle_get_voucher(current_user, voucher_id)
            return
        
        # Route: Subsidies
        elif path == '/api/subsidies' and method == 'GET':
            self.handle_list_subsidies(current_user, query)
            return
        elif path == '/api/subsidies' and method == 'POST':
            self.handle_create_subsidy(current_user)
            return
        elif path == '/api/subsidies/rates' and method == 'GET':
            self.handle_get_subsidy_rates(current_user)
            return
        elif path == '/api/subsidies/calculate' and method == 'POST':
            self.handle_calculate_subsidy(current_user)
            return
        
        # Route: Inventory
        elif path == '/api/inventory' and method == 'GET':
            self.handle_list_inventory(current_user)
            return
        elif path == '/api/inventory' and method == 'POST':
            self.handle_adjust_inventory(current_user)
            return
        
        # Route: Soil Tests
        elif path == '/api/soil-tests' and method == 'GET':
            self.handle_list_soil_tests(current_user)
            return
        elif path == '/api/soil-tests' and method == 'POST':
            self.handle_create_soil_test(current_user)
            return
        elif path.startswith('/api/soil-tests/') and method == 'GET':
            test_id = path.split('/')[-1]
            self.handle_get_soil_test(current_user, test_id)
            return
        
        # Route: NUE
        elif path == '/api/nue' and method == 'GET':
            self.handle_get_nue(current_user, query)
            return
        elif path == '/api/nue' and method == 'POST':
            self.handle_create_nue(current_user)
            return
        elif path.startswith('/api/nue/regional/') and method == 'GET':
            region = path.split('/')[-1]
            self.handle_get_regional_nue(current_user, region)
            return
        
        # Route: Reports
        elif path == '/api/reports/subsidy' and method == 'GET':
            self.handle_subsidy_report(current_user, query)
            return
        elif path == '/api/reports/transactions' and method == 'GET':
            self.handle_transaction_report(current_user, query)
            return
        
        # Route: Utility
        elif path == '/api/health' and method == 'GET':
            self.handle_health()
            return
        elif path == '/api/stats' and method == 'GET':
            self.handle_stats(current_user)
            return
        elif path == '/' and method == 'GET':
            self.handle_index()
            return
        
        # 404
        body, status = _error_response('Endpoint not found', 404)
        self.send_headers(status)
        self.wfile.write(body)
    
    # ==================== HANDLERS ====================
    
    def handle_login(self):
        """POST /api/auth/login"""
        data = _get_json_body(self)
        phone = data.get('phone')
        password = data.get('password')
        
        if not phone or not password:
            body, status = _error_response('Phone and password required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        users = list_users()
        user = None
        for u in users:
            if u.get('phone') == phone:
                user = u
                break
        
        if not user:
            body, status = _error_response('Invalid credentials', 401)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        token = _generate_token(user.get('id'))
        sessions[token] = {
            'user': user,
            'created_at': datetime.now().isoformat()
        }
        
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        user_data['token'] = token
        
        body, status = _success_response(user_data, 'Login successful')
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_logout(self, user):
        """POST /api/auth/logout"""
        if not user:
            body, status = _error_response('Authentication required', 401)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        auth_header = self.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '')
        if token and token in sessions:
            del sessions[token]
        
        body, status = _success_response(None, 'Logout successful')
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_profile(self, user):
        """GET /api/auth/profile"""
        if not user:
            body, status = _error_response('Authentication required', 401)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        body, status = _success_response(user_data)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_users(self, user, query):
        """GET /api/users"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        role = query.get('role', [None])[0]
        users = list_users(role=role)
        body, status = _success_response({'users': users, 'count': len(users)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_user(self, user, user_id):
        """GET /api/users/<id>"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        user_data = get_user(user_id)
        if not user_data:
            body, status = _error_response('User not found', 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        user_data = {k: v for k, v in user_data.items() if k != 'password_hash'}
        body, status = _success_response(user_data)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_user(self, user):
        """POST /api/users"""
        if not _check_role(user, 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['phone', 'role', 'name']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        if 'id' not in data:
            role_prefix = data['role'][:3]
            data['id'] = f"user-{role_prefix}-{uuid.uuid4().hex[:8]}"
        
        user_id = save_user(data)
        if user_id:
            user_data = get_user(user_id)
            user_data = {k: v for k, v in user_data.items() if k != 'password_hash'}
            body, status = _success_response(user_data, 'User created successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to create user', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_update_user(self, user, user_id):
        """PUT /api/users/<id>"""
        if not _check_role(user, 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        if update_user(user_id, data):
            user_data = get_user(user_id)
            user_data = {k: v for k, v in user_data.items() if k != 'password_hash'}
            body, status = _success_response(user_data, 'User updated successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('User not found or update failed', 404)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_farmers(self, user):
        """GET /api/farmers"""
        if not _check_role(user, 'admin', 'officer', 'dealer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        farmers = list_users(role='farmer')
        body, status = _success_response({'farmers': farmers, 'count': len(farmers)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_dealers(self, user):
        """GET /api/dealers"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        dealers = list_users(role='dealer')
        body, status = _success_response({'dealers': dealers, 'count': len(dealers)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_transactions(self, user, query):
        """GET /api/transactions"""
        filters = {}
        
        if query.get('farmer_id'):
            filters['farmer_id'] = query.get('farmer_id', [None])[0]
        if query.get('dealer_id'):
            filters['dealer_id'] = query.get('dealer_id', [None])[0]
        if query.get('transaction_type'):
            filters['transaction_type'] = query.get('transaction_type', [None])[0]
        if query.get('status'):
            filters['status'] = query.get('status', [None])[0]
        if query.get('fertilizer_type'):
            filters['fertilizer_type'] = query.get('fertilizer_type', [None])[0]
        if query.get('date_from'):
            filters['date_from'] = query.get('date_from', [None])[0]
        if query.get('date_to'):
            filters['date_to'] = query.get('date_to', [None])[0]
        
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'farmer':
            filters['farmer_id'] = user_id
        elif role == 'dealer':
            filters['dealer_id'] = user_id
        
        transactions = get_transactions(filters)
        body, status = _success_response({'transactions': transactions, 'count': len(transactions)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_transaction(self, user):
        """POST /api/transactions"""
        if not _check_role(user, 'farmer', 'dealer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['fertilizer_type', 'quantity_kg', 'unit_price']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'farmer':
            data['farmer_id'] = user_id
        elif role == 'dealer':
            data['dealer_id'] = user_id
        
        quantity = float(data.get('quantity_kg', 0))
        unit_price = float(data.get('unit_price', 0))
        data['total_amount'] = quantity * unit_price
        
        if data.get('fertilizer_type'):
            subsidy = calculate_subsidy(data['fertilizer_type'], quantity)
            if subsidy and 'subsidy_amount' in subsidy:
                data['subsidy_amount'] = subsidy['subsidy_amount']
        
        data['transaction_type'] = data.get('transaction_type', 'purchase')
        data['status'] = data.get('status', 'pending')
        
        tx_id = save_transaction(data)
        if tx_id:
            tx = get_transaction(tx_id)
            body, status = _success_response(tx, 'Transaction created successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to create transaction', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_transaction(self, user, tx_id):
        """GET /api/transactions/<id>"""
        tx = get_transaction(tx_id)
        if not tx:
            body, status = _error_response('Transaction not found', 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'farmer' and tx.get('farmer_id') != user_id:
            body, status = _error_response('Access denied', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        if role == 'dealer' and tx.get('dealer_id') != user_id:
            body, status = _error_response('Access denied', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response(tx)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_update_transaction_status(self, user, tx_id):
        """PUT /api/transactions/<id>/status"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        status_value = data.get('status')
        
        if not status_value or status_value not in ['approved', 'rejected', 'completed']:
            body, status = _error_response('Invalid status', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        officer_id = user.get('id')
        
        if update_transaction_status(tx_id, status_value, officer_id):
            tx = get_transaction(tx_id)
            body, status = _success_response(tx, f'Transaction {status_value} successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Transaction not found', 404)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_vouchers(self, user):
        """GET /api/vouchers"""
        role = user.get('role')
        user_id = user.get('id')
        
        vouchers = []
        if role == 'farmer':
            vouchers = get_vouchers_by_farmer(user_id)
        else:
            from data_manager import _read_json, _get_index_path
            index = _read_json(_get_index_path('vouchers'))
            if index:
                for voucher_id in index.get('ids', []):
                    v = get_voucher(voucher_id)
                    if v:
                        vouchers.append(v)
        
        body, status = _success_response({'vouchers': vouchers, 'count': len(vouchers)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_voucher(self, user, voucher_id):
        """GET /api/vouchers/<id>"""
        voucher = get_voucher(voucher_id)
        if not voucher:
            body, status = _error_response('Voucher not found', 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response(voucher)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_voucher(self, user):
        """POST /api/vouchers"""
        if not _check_role(user, 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['farmer_id', 'subsidy_percentage', 'max_amount']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        data['created_by'] = user.get('id')
        data['status'] = data.get('status', 'active')
        
        voucher_id = save_voucher(data)
        if voucher_id:
            voucher = get_voucher(voucher_id)
            body, status = _success_response(voucher, 'Voucher created successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to create voucher', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_validate_voucher(self, user):
        """POST /api/vouchers/validate"""
        if not _check_role(user, 'dealer', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        code = data.get('voucher_code')
        
        if not code:
            body, status = _error_response('Voucher code required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        result = validate_voucher(code)
        if result.get('valid'):
            voucher = result.get('voucher')
            voucher_data = {k: v for k, v in voucher.items() if k != 'hash'}
            body, status = _success_response({'valid': True, 'voucher': voucher_data})
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response({'valid': False, 'error': result.get('error')})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_redeem_voucher(self, user, voucher_id):
        """POST /api/vouchers/<id>/redeem"""
        if not _check_role(user, 'dealer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        transaction_id = data.get('transaction_id')
        
        if not transaction_id:
            body, status = _error_response('Transaction ID required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        if redeem_voucher(voucher_id, transaction_id):
            voucher = get_voucher(voucher_id)
            body, status = _success_response(voucher, 'Voucher redeemed successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to redeem voucher', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_subsidies(self, user, query):
        """GET /api/subsidies"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        filters = {}
        if query.get('fertilizer_type'):
            filters['fertilizer_type'] = query.get('fertilizer_type', [None])[0]
        if query.get('region'):
            filters['region'] = query.get('region', [None])[0]
        if query.get('status'):
            filters['status'] = query.get('status', [None])[0]
        
        report = get_subsidy_report(filters)
        body, status = _success_response(report)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_subsidy(self, user):
        """POST /api/subsidies"""
        if not _check_role(user, 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['fertilizer_type', 'subsidy_percentage', 'per_kg_rate']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        data['created_by'] = user.get('id')
        data['status'] = data.get('status', 'active')
        
        subsidy_id = save_subsidy(data)
        if subsidy_id:
            subsidy = get_subsidy(subsidy_id)
            body, status = _success_response(subsidy, 'Subsidy created successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to create subsidy', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_subsidy_rates(self, user):
        """GET /api/subsidies/rates"""
        rates = get_subsidy_rates()
        body, status = _success_response(rates)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_calculate_subsidy(self, user):
        """POST /api/subsidies/calculate"""
        data = _get_json_body(self)
        fertilizer_type = data.get('fertilizer_type')
        quantity_kg = data.get('quantity_kg')
        
        if not fertilizer_type:
            body, status = _error_response('Fertilizer type required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        if not quantity_kg:
            body, status = _error_response('Quantity required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        try:
            quantity_kg = float(quantity_kg)
        except ValueError:
            body, status = _error_response('Invalid quantity', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        result = calculate_subsidy(fertilizer_type, quantity_kg)
        if 'error' in result:
            body, status = _error_response(result['error'], 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response(result)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_inventory(self, user):
        """GET /api/inventory"""
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'dealer':
            inventory = get_dealer_inventory(user_id)
        elif role in ['admin', 'officer']:
            from data_manager import _read_json, _get_index_path
            index = _read_json(_get_index_path('inventory'))
            inventory = []
            if index:
                for inv_id in index.get('ids', []):
                    inv = get_inventory(inv_id)
                    if inv:
                        inventory.append(inv)
        else:
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return

        body, status = _success_response({'inventory': inventory, 'count': len(inventory)})
        self.send_headers(status)
        self.wfile.write(body)

    def handle_adjust_inventory(self, user):
        """POST /api/inventory"""
        if not _check_role(user, 'dealer', 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
            
        data = _get_json_body(self)
        fertilizer_type = data.get('fertilizer_type')
        delta_kg = data.get('delta_kg')
        dealer_id = user.get('id') if user.get('role') == 'dealer' else data.get('dealer_id')
        
        if not fertilizer_type or delta_kg is None:
            body, status = _error_response('Fertilizer type and delta_kg are required', 400)
            self.send_headers(status)
            self.wfile.write(body)
            return
            
        success = adjust_stock(dealer_id, fertilizer_type, float(delta_kg))
        if success:
            inventory = get_dealer_inventory(dealer_id)
            body, status = _success_response(inventory, 'Inventory updated successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
            
        body, status = _error_response('Failed to adjust inventory (Insufficient stock?)', 400)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_list_soil_tests(self, user):
        """GET /api/soil-tests"""
        role = user.get('role')
        user_id = user.get('id')
        
        if role == 'farmer':
            tests = get_soil_tests_by_farmer(user_id)
        else:
            from data_manager import _read_json, _get_index_path
            index = _read_json(_get_index_path('soil_tests'))
            tests = []
            if index:
                for test_id in index.get('ids', []):
                    t = get_soil_test(test_id)
                    if t:
                        tests.append(t)
        
        body, status = _success_response({'soil_tests': tests, 'count': len(tests)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_soil_test(self, user):
        """POST /api/soil-tests"""
        if not _check_role(user, 'farmer', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['farmer_id', 'region']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        test_id = save_soil_test(data)
        if test_id:
            test = get_soil_test(test_id)
            body, status = _success_response(test, 'Soil test submitted successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to submit soil test', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_soil_test(self, user, test_id):
        """GET /api/soil-tests/<id>"""
        test = get_soil_test(test_id)
        if not test:
            body, status = _error_response('Soil test not found', 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response(test)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_nue(self, user, query):
        """GET /api/nue"""
        region = query.get('region', [None])[0]
        
        if region:
            nue = get_nue_by_region(region)
            if not nue:
                body, status = _error_response('NUE data not found for region', 404)
                self.send_headers(status)
                self.wfile.write(body)
                return
            body, status = _success_response(nue)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        nue_data = get_all_nue()
        body, status = _success_response({'nue_data': nue_data, 'count': len(nue_data)})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_create_nue(self, user):
        """POST /api/nue"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        data = _get_json_body(self)
        required = ['region', 'reporting_period', 'actual_nue_percentage']
        for field in required:
            if not data.get(field):
                body, status = _error_response(f'{field} is required', 400)
                self.send_headers(status)
                self.wfile.write(body)
                return
        
        nue_id = save_nue(data)
        if nue_id:
            nue = get_nue(nue_id)
            body, status = _success_response(nue, 'NUE data saved successfully')
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _error_response('Failed to save NUE data', 500)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_get_regional_nue(self, user, region):
        """GET /api/nue/regional/<region>"""
        nue = get_nue_by_region(region)
        if not nue:
            body, status = _error_response('NUE data not found for region', 404)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        body, status = _success_response(nue)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_subsidy_report(self, user, query):
        """GET /api/reports/subsidy"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        filters = {}
        if query.get('fertilizer_type'):
            filters['fertilizer_type'] = query.get('fertilizer_type', [None])[0]
        if query.get('region'):
            filters['region'] = query.get('region', [None])[0]
        if query.get('status'):
            filters['status'] = query.get('status', [None])[0]
        if query.get('date_from'):
            filters['date_from'] = query.get('date_from', [None])[0]
        if query.get('date_to'):
            filters['date_to'] = query.get('date_to', [None])[0]
        
        report = get_subsidy_report(filters)
        body, status = _success_response(report)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_transaction_report(self, user, query):
        """GET /api/reports/transactions"""
        if not _check_role(user, 'admin', 'officer'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        filters = {}
        if query.get('farmer_id'):
            filters['farmer_id'] = query.get('farmer_id', [None])[0]
        if query.get('dealer_id'):
            filters['dealer_id'] = query.get('dealer_id', [None])[0]
        if query.get('transaction_type'):
            filters['transaction_type'] = query.get('transaction_type', [None])[0]
        if query.get('status'):
            filters['status'] = query.get('status', [None])[0]
        if query.get('fertilizer_type'):
            filters['fertilizer_type'] = query.get('fertilizer_type', [None])[0]
        if query.get('date_from'):
            filters['date_from'] = query.get('date_from', [None])[0]
        if query.get('date_to'):
            filters['date_to'] = query.get('date_to', [None])[0]
        
        transactions = get_transactions(filters)
        
        total_amount = sum(tx.get('total_amount', 0) for tx in transactions)
        total_subsidy = sum(tx.get('subsidy_amount', 0) for tx in transactions)
        
        by_type = {}
        by_status = {}
        for tx in transactions:
            ft = tx.get('fertilizer_type', 'unknown')
            by_type[ft] = by_type.get(ft, 0) + 1
            st = tx.get('status', 'unknown')
            by_status[st] = by_status.get(st, 0) + 1
        
        report = {
            'transactions': transactions,
            'summary': {
                'total_count': len(transactions),
                'total_amount': total_amount,
                'total_subsidy': total_subsidy,
                'by_fertilizer_type': by_type,
                'by_status': by_status
            },
            'generated_at': datetime.now().astimezone().isoformat()
        }
        
        body, status = _success_response(report)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_health(self):
        """GET /api/health"""
        body, status = _success_response({'status': 'healthy', 'timestamp': datetime.now().astimezone().isoformat()})
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_stats(self, user):
        """GET /api/stats"""
        if not _check_role(user, 'admin'):
            body, status = _error_response('Insufficient permissions', 403)
            self.send_headers(status)
            self.wfile.write(body)
            return
        
        stats = get_storage_stats()
        body, status = _success_response(stats)
        self.send_headers(status)
        self.wfile.write(body)
    
    def handle_index(self):
        """GET / - API info"""
        info = {
            'name': 'Fertilizer Tracking E-Bill System API',
            'version': '1.0.0',
            'endpoints': {
                'Authentication': [
                    'POST /api/auth/login',
                    'POST /api/auth/logout',
                    'GET /api/auth/profile'
                ],
                'Users': [
                    'GET /api/users',
                    'GET /api/users/<id>',
                    'POST /api/users',
                    'PUT /api/users/<id>',
                    'GET /api/farmers',
                    'GET /api/dealers'
                ],
                'Transactions': [
                    'GET /api/transactions',
                    'POST /api/transactions',
                    'GET /api/transactions/<id>',
                    'PUT /api/transactions/<id>/status'
                ],
                'Vouchers': [
                    'GET /api/vouchers',
                    'POST /api/vouchers',
                    'GET /api/vouchers/<id>',
                    'POST /api/vouchers/validate',
                    'POST /api/vouchers/<id>/redeem'
                ],
                'Subsidies': [
                    'GET /api/subsidies',
                    'POST /api/subsidies',
                    'GET /api/subsidies/rates',
                    'POST /api/subsidies/calculate'
                ],
                'Inventory': [
                    'GET /api/inventory',
                    'POST /api/inventory'
                ],
                'Soil Tests': [
                    'GET /api/soil-tests',
                    'POST /api/soil-tests',
                    'GET /api/soil-tests/<id>'
                ],
                'NUE': [
                    'GET /api/nue',
                    'POST /api/nue',
                    'GET /api/nue/regional/<region>'
                ],
                'Reports': [
                    'GET /api/reports/subsidy',
                    'GET /api/reports/transactions'
                ],
                'Utility': [
                    'GET /api/health',
                    'GET /api/stats'
                ]
            },
            'timestamp': datetime.now().astimezone().isoformat()
        }
        body, status = _success_response(info)
        self.send_headers(status)
        self.wfile.write(body)


def run_server():
    """Run the HTTP server"""
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"\nServer running on http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()


# ==================== MAIN ====================

if __name__ == '__main__':
    print("=" * 60)
    print("Fertilizer Tracking E-Bill System - API Server")
    print("=" * 60)
    
    # Check for sample data
    from data_manager import _read_json, _get_index_path
    users_index = _read_json(_get_index_path('users'))
    if not users_index or users_index.get('total_count', 0) == 0:
        print("\nInitializing sample data...")
        init_sample_data()
        print("Sample data initialized!")
    
    print(f"\nServer will start on http://{HOST}:{PORT}")
    print("\nAvailable endpoints:")
    print("  Authentication:")
    print("    POST /api/auth/login")
    print("    POST /api/auth/logout")
    print("    GET  /api/auth/profile")
    print("  Users:")
    print("    GET    /api/users")
    print("    GET    /api/users/<id>")
    print("    POST   /api/users")
    print("    PUT    /api/users/<id>")
    print("    GET    /api/farmers")
    print("    GET    /api/dealers")
    print("  Transactions:")
    print("    GET    /api/transactions")
    print("    POST   /api/transactions")
    print("    GET    /api/transactions/<id>")
    print("    PUT    /api/transactions/<id>/status")
    print("  Vouchers:")
    print("    GET    /api/vouchers")
    print("    POST   /api/vouchers")
    print("    GET    /api/vouchers/<id>")
    print("    POST   /api/vouchers/validate")
    print("    POST   /api/vouchers/<id>/redeem")
    print("  Subsidies:")
    print("    GET    /api/subsidies")
    print("    POST   /api/subsidies")
    print("    GET    /api/subsidies/rates")
    print("    POST   /api/subsidies/calculate")
    print("  Inventory (India e-Bill):")
    print("    GET    /api/inventory")
    print("    POST   /api/inventory")
    print("  Soil Tests:")
    print("    GET    /api/soil-tests")
    print("    POST   /api/soil-tests")
    print("    GET    /api/soil-tests/<id>")
    print("  NUE:")
    print("    GET    /api/nue")
    print("    POST   /api/nue")
    print("    GET    /api/nue/regional/<region>")
    print("  Reports:")
    print("    GET    /api/reports/subsidy")
    print("    GET    /api/reports/transactions")
    print("  Utility:")
    print("    GET    /api/health")
    print("    GET    /api/stats")
    print("\n" + "=" * 60)
    
    run_server()
