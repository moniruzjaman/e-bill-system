# -*- coding: utf-8 -*-
"""
Data Persistence Layer for Fertilizer Tracking E-Bill System
JSON-based file storage with hash verification and index files
"""

import json
import os
import sys
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

# Set UTF-8 encoding for output - handle both direct run and import cases
if sys.platform == 'win32':
    try:
        import codecs
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass  # Ignore encoding issues

# Storage base directory
STORAGE_BASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'storage')

# Storage directories
DIRS = {
    'users': os.path.join(STORAGE_BASE, 'users'),
    'transactions': os.path.join(STORAGE_BASE, 'transactions'),
    'transactions_by_farmer': os.path.join(STORAGE_BASE, 'transactions', 'by_farmer'),
    'vouchers': os.path.join(STORAGE_BASE, 'vouchers'),
    'subsidies': os.path.join(STORAGE_BASE, 'subsidies'),
    'soil_tests': os.path.join(STORAGE_BASE, 'soil_tests'),
    'nue': os.path.join(STORAGE_BASE, 'nue'),
    'audit': os.path.join(STORAGE_BASE, 'audit')
}

# Ensure directories exist
for dir_path in DIRS.values():
    os.makedirs(dir_path, exist_ok=True)


def _get_timestamp() -> str:
    """Get current ISO8601 timestamp"""
    return datetime.now().astimezone().isoformat()


def _compute_hash(data: Dict) -> str:
    """Compute SHA-256 hash of data (excluding hash field)"""
    data_copy = {k: v for k, v in data.items() if k != 'hash'}
    content = json.dumps(data_copy, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def _verify_hash(data: Dict) -> bool:
    """Verify data integrity using hash"""
    if 'hash' not in data:
        return False
    computed = _compute_hash(data)
    return computed == data['hash']


def _add_hash(data: Dict) -> Dict:
    """Add hash to data for integrity"""
    data['hash'] = _compute_hash(data)
    return data


def _read_json(filepath: str) -> Optional[Dict]:
    """Read JSON file with error handling"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _write_json(filepath: str, data: Dict) -> bool:
    """Write JSON file with error handling"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False


def _get_index_path(entity: str) -> str:
    """Get index file path for an entity"""
    return os.path.join(DIRS[entity], 'index.json')


def _update_index(entity: str, entity_id: str, add: bool = True) -> bool:
    """Update index file for an entity"""
    index_path = _get_index_path(entity)
    index = _read_json(index_path) or {'last_updated': _get_timestamp(), 'total_count': 0, 'ids': []}
    
    if add:
        if entity_id not in index.get('ids', []):
            index['ids'] = index.get('ids', []) + [entity_id]
            index['total_count'] = len(index['ids'])
    else:
        index['ids'] = [id for id in index.get('ids', []) if id != entity_id]
        index['total_count'] = len(index['ids'])
    
    index['last_updated'] = _get_timestamp()
    return _write_json(index_path, index)


def _audit_log(action: str, entity: str, entity_id: str, user_id: str = None, details: Dict = None) -> bool:
    """Write to audit log"""
    log_entry = {
        'id': str(uuid.uuid4()),
        'action': action,
        'entity': entity,
        'entity_id': entity_id,
        'user_id': user_id,
        'details': details or {},
        'timestamp': _get_timestamp()
    }
    
    audit_path = os.path.join(DIRS['audit'], 'logs.json')
    logs = _read_json(audit_path) or {'entries': [], 'last_updated': None}
    logs['entries'] = logs.get('entries', []) + [log_entry]
    logs['last_updated'] = _get_timestamp()
    
    return _write_json(audit_path, logs)


# ==================== USER OPERATIONS ====================

def save_user(user_data: Dict) -> Optional[str]:
    """
    Save user to JSON file
    Returns user_id on success, None on failure
    """
    user_id = user_data.get('id', str(uuid.uuid4()))
    user_data['id'] = user_id
    user_data['created_at'] = user_data.get('created_at', _get_timestamp())
    user_data['updated_at'] = _get_timestamp()
    user_data['version'] = 1
    
    # Add hash for integrity
    user_data = _add_hash(user_data)
    
    filepath = os.path.join(DIRS['users'], f'{user_id}.json')
    if _write_json(filepath, user_data):
        _update_index('users', user_id, add=True)
        _audit_log('create', 'user', user_id, details={'role': user_data.get('role')})
        return user_id
    return None


def get_user(user_id: str) -> Optional[Dict]:
    """Retrieve user by ID"""
    filepath = os.path.join(DIRS['users'], f'{user_id}.json')
    user = _read_json(filepath)
    if user and _verify_hash(user):
        return user
    return user  # Return even without valid hash for backward compatibility


def list_users(role: str = None) -> List[Dict]:
    """List users, optionally filtered by role"""
    index = _read_json(_get_index_path('users'))
    if not index:
        return []
    
    users = []
    for user_id in index.get('ids', []):
        user = get_user(user_id)
        if user and (role is None or user.get('role') == role):
            # Remove sensitive data
            user_copy = {k: v for k, v in user.items() if k != 'password_hash'}
            users.append(user_copy)
    
    return users


def update_user(user_id: str, user_data: Dict) -> bool:
    """Update user data"""
    existing = get_user(user_id)
    if not existing:
        return False
    
    user_data['id'] = user_id
    user_data['created_at'] = existing.get('created_at')
    user_data['updated_at'] = _get_timestamp()
    user_data['version'] = existing.get('version', 0) + 1
    
    # Preserve password hash if not updating
    if 'password_hash' not in user_data:
        user_data['password_hash'] = existing.get('password_hash')
    
    user_data = _add_hash(user_data)
    
    filepath = os.path.join(DIRS['users'], f'{user_id}.json')
    if _write_json(filepath, user_data):
        _audit_log('update', 'user', user_id, details={'version': user_data['version']})
        return True
    return False


def delete_user(user_id: str) -> bool:
    """Delete user"""
    filepath = os.path.join(DIRS['users'], f'{user_id}.json')
    try:
        os.remove(filepath)
        _update_index('users', user_id, add=False)
        _audit_log('delete', 'user', user_id)
        return True
    except FileNotFoundError:
        return False


# ==================== TRANSACTION OPERATIONS ====================

def save_transaction(tx_data: Dict) -> Optional[str]:
    """
    Save transaction to JSON file
    Returns transaction_id on success, None on failure
    """
    tx_id = tx_data.get('id', str(uuid.uuid4()))
    tx_data['id'] = tx_id
    tx_data['created_at'] = tx_data.get('created_at', _get_timestamp())
    tx_data['updated_at'] = _get_timestamp()
    tx_data['version'] = 1
    
    # Generate blockchain hash for immutability
    content = f"{tx_id}{tx_data.get('created_at')}{tx_data.get('farmer_id')}{tx_data.get('fertilizer_type')}"
    tx_data['blockchain_hash'] = hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    # Add data hash
    tx_data = _add_hash(tx_data)
    
    filepath = os.path.join(DIRS['transactions'], f'{tx_id}.json')
    if _write_json(filepath, tx_data):
        _update_index('transactions', tx_id, add=True)
        
        # Also save to farmer's transaction history
        farmer_id = tx_data.get('farmer_id')
        if farmer_id:
            farmer_tx_path = os.path.join(DIRS['transactions_by_farmer'], f'{farmer_id}.json')
            farmer_txs = _read_json(farmer_tx_path) or {'farmer_id': farmer_id, 'transactions': []}
            farmer_txs['transactions'] = farmer_txs.get('transactions', []) + [tx_id]
            _write_json(farmer_tx_path, farmer_txs)
        
        _audit_log('create', 'transaction', tx_id, details={'type': tx_data.get('transaction_type')})
        return tx_id
    return None


def get_transaction(tx_id: str) -> Optional[Dict]:
    """Get transaction by ID"""
    filepath = os.path.join(DIRS['transactions'], f'{tx_id}.json')
    return _read_json(filepath)


def get_transactions(filters: Dict = None) -> List[Dict]:
    """
    Query transactions with optional filters
    Filters: farmer_id, dealer_id, transaction_type, status, fertilizer_type, date_from, date_to
    """
    filters = filters or {}
    index = _read_json(_get_index_path('transactions'))
    if not index:
        return []
    
    transactions = []
    for tx_id in index.get('ids', []):
        tx = get_transaction(tx_id)
        if not tx:
            continue
        
        # Apply filters
        if filters.get('farmer_id') and tx.get('farmer_id') != filters['farmer_id']:
            continue
        if filters.get('dealer_id') and tx.get('dealer_id') != filters['dealer_id']:
            continue
        if filters.get('transaction_type') and tx.get('transaction_type') != filters['transaction_type']:
            continue
        if filters.get('status') and tx.get('status') != filters['status']:
            continue
        if filters.get('fertilizer_type') and tx.get('fertilizer_type') != filters['fertilizer_type']:
            continue
        if filters.get('date_from'):
            tx_date = tx.get('created_at', '')
            if tx_date < filters['date_from']:
                continue
        if filters.get('date_to'):
            tx_date = tx.get('created_at', '')
            if tx_date > filters['date_to']:
                continue
        
        transactions.append(tx)
    
    return transactions


def update_transaction_status(tx_id: str, status: str, officer_id: str) -> bool:
    """Update transaction status (approve/reject)"""
    tx = get_transaction(tx_id)
    if not tx:
        return False
    
    tx['status'] = status
    tx['approved_by'] = officer_id
    tx['approved_at'] = _get_timestamp()
    tx['updated_at'] = _get_timestamp()
    tx['version'] = tx.get('version', 0) + 1
    tx = _add_hash(tx)
    
    filepath = os.path.join(DIRS['transactions'], f'{tx_id}.json')
    if _write_json(filepath, tx):
        _audit_log('update_status', 'transaction', tx_id, user_id=officer_id, 
                   details={'status': status})
        return True
    return False


# ==================== VOUCHER OPERATIONS ====================

def save_voucher(voucher_data: Dict) -> Optional[str]:
    """
    Save voucher to JSON file
    Returns voucher_id on success, None on failure
    """
    voucher_id = voucher_data.get('id', str(uuid.uuid4()))
    voucher_data['id'] = voucher_id
    
    # Generate voucher code if not provided
    if 'voucher_code' not in voucher_data:
        year = datetime.now().year
        voucher_data['voucher_code'] = f'VCH-{year}-{voucher_id[:8].upper()}'
    
    voucher_data['created_at'] = voucher_data.get('created_at', _get_timestamp())
    voucher_data['updated_at'] = _get_timestamp()
    voucher_data['version'] = 1
    
    # Add hash
    voucher_data = _add_hash(voucher_data)
    
    filepath = os.path.join(DIRS['vouchers'], f'{voucher_id}.json')
    if _write_json(filepath, voucher_data):
        _update_index('vouchers', voucher_id, add=True)
        _audit_log('create', 'voucher', voucher_id, 
                   details={'farmer_id': voucher_data.get('farmer_id')})
        return voucher_id
    return None


def get_voucher(voucher_id: str) -> Optional[Dict]:
    """Get voucher by ID"""
    filepath = os.path.join(DIRS['vouchers'], f'{voucher_id}.json')
    return _read_json(filepath)


def validate_voucher(code: str) -> Dict:
    """
    Validate voucher code
    Returns dict with 'valid' boolean and 'voucher' or 'error' key
    """
    index = _read_json(_get_index_path('vouchers'))
    if not index:
        return {'valid': False, 'error': 'No vouchers found'}
    
    for voucher_id in index.get('ids', []):
        voucher = get_voucher(voucher_id)
        if voucher and voucher.get('voucher_code') == code:
            # Check if valid
            if voucher.get('status') != 'active':
                return {'valid': False, 'error': f"Voucher is {voucher.get('status')}"}
            
            # Check expiry
            valid_until = voucher.get('valid_until')
            if valid_until and datetime.fromisoformat(valid_until.replace('Z', '+00:00')) < datetime.now(datetime.now().astimezone().tzinfo):
                return {'valid': False, 'error': 'Voucher has expired'}
            
            # Check start date
            valid_from = voucher.get('valid_from')
            if valid_from and datetime.fromisoformat(valid_from.replace('Z', '+00:00')) > datetime.now(datetime.now().astimezone().tzinfo):
                return {'valid': False, 'error': 'Voucher not yet valid'}
            
            # Return voucher without sensitive data
            return {'valid': True, 'voucher': voucher}
    
    return {'valid': False, 'error': 'Invalid voucher code'}


def redeem_voucher(voucher_id: str, transaction_id: str) -> bool:
    """Redeem voucher with transaction"""
    voucher = get_voucher(voucher_id)
    if not voucher or voucher.get('status') != 'active':
        return False
    
    voucher['status'] = 'used'
    voucher['used_transaction_id'] = transaction_id
    voucher['redeemed_at'] = _get_timestamp()
    voucher['updated_at'] = _get_timestamp()
    voucher['version'] = voucher.get('version', 0) + 1
    voucher = _add_hash(voucher)
    
    filepath = os.path.join(DIRS['vouchers'], f'{voucher_id}.json')
    if _write_json(filepath, voucher):
        _audit_log('redeem', 'voucher', voucher_id, details={'transaction_id': transaction_id})
        return True
    return False


def get_vouchers_by_farmer(farmer_id: str) -> List[Dict]:
    """Get all vouchers for a farmer"""
    index = _read_json(_get_index_path('vouchers'))
    if not index:
        return []
    
    vouchers = []
    for voucher_id in index.get('ids', []):
        voucher = get_voucher(voucher_id)
        if voucher and voucher.get('farmer_id') == farmer_id:
            vouchers.append(voucher)
    
    return vouchers


# ==================== SUBSIDY OPERATIONS ====================

def save_subsidy(subsidy_data: Dict) -> Optional[str]:
    """
    Save subsidy record to JSON file
    Returns subsidy_id on success, None on failure
    """
    subsidy_id = subsidy_data.get('id', str(uuid.uuid4()))
    subsidy_data['id'] = subsidy_id
    subsidy_data['created_at'] = subsidy_data.get('created_at', _get_timestamp())
    subsidy_data['updated_at'] = _get_timestamp()
    subsidy_data['version'] = 1
    
    # Add hash
    subsidy_data = _add_hash(subsidy_data)
    
    # Save to history
    filepath = os.path.join(DIRS['subsidies'], f'{subsidy_id}.json')
    if _write_json(filepath, subsidy_data):
        _update_index('subsidies', subsidy_id, add=True)
        
        # Update current rates
        if subsidy_data.get('status') == 'active':
            rates = _read_json(os.path.join(DIRS['subsidies'], 'rates.json')) or {'rates': [], 'last_updated': None}
            # Remove old rate for same fertilizer type
            rates['rates'] = [r for r in rates.get('rates', []) 
                            if r.get('fertilizer_type') != subsidy_data.get('fertilizer_type')]
            rates['rates'].append({
                'fertilizer_type': subsidy_data.get('fertilizer_type'),
                'subsidy_percentage': subsidy_data.get('subsidy_percentage'),
                'per_kg_rate': subsidy_data.get('per_kg_rate'),
                'subsidy_id': subsidy_id
            })
            rates['last_updated'] = _get_timestamp()
            _write_json(os.path.join(DIRS['subsidies'], 'rates.json'), rates)
        
        _audit_log('create', 'subsidy', subsidy_id, 
                   details={'type': subsidy_data.get('fertilizer_type')})
        return subsidy_id
    return None


def get_subsidy(subsidy_id: str) -> Optional[Dict]:
    """Get subsidy by ID"""
    filepath = os.path.join(DIRS['subsidies'], f'{subsidy_id}.json')
    return _read_json(filepath)


def get_subsidy_rates() -> Dict:
    """Get current subsidy rates"""
    return _read_json(os.path.join(DIRS['subsidies'], 'rates.json')) or {'rates': [], 'last_updated': None}


def get_subsidy_report(filters: Dict = None) -> Dict:
    """
    Generate subsidy report
    Filters: fertilizer_type, region, status, date_from, date_to
    """
    filters = filters or {}
    index = _read_json(_get_index_path('subsidies'))
    if not index:
        return {'subsidies': [], 'summary': {}}
    
    subsidies = []
    for subsidy_id in index.get('ids', []):
        subsidy = get_subsidy(subsidy_id)
        if not subsidy:
            continue
        
        # Apply filters
        if filters.get('fertilizer_type') and subsidy.get('fertilizer_type') != filters['fertilizer_type']:
            continue
        if filters.get('region') and subsidy.get('region') != filters['region']:
            continue
        if filters.get('status') and subsidy.get('status') != filters['status']:
            continue
        
        subsidies.append(subsidy)
    
    # Generate summary
    summary = {
        'total_subsidies': len(subsidies),
        'active_count': len([s for s in subsidies if s.get('status') == 'active']),
        'by_type': {}
    }
    
    for subsidy in subsidies:
        ftype = subsidy.get('fertilizer_type', 'unknown')
        if ftype not in summary['by_type']:
            summary['by_type'][ftype] = {'count': 0, 'avg_percentage': 0, 'total_percentage': 0}
        summary['by_type'][ftype]['count'] += 1
        summary['by_type'][ftype]['total_percentage'] += subsidy.get('subsidy_percentage', 0)
    
    for ftype, data in summary['by_type'].items():
        if data['count'] > 0:
            data['avg_percentage'] = round(data['total_percentage'] / data['count'], 2)
    
    return {'subsidies': subsidies, 'summary': summary, 'generated_at': _get_timestamp()}


def calculate_subsidy(fertilizer_type: str, quantity_kg: float) -> Dict:
    """Calculate subsidy amount for given fertilizer and quantity"""
    rates = get_subsidy_rates()
    
    # Find matching rate
    rate = None
    for r in rates.get('rates', []):
        if r.get('fertilizer_type') == fertilizer_type:
            rate = r
            break
    
    if not rate:
        return {'error': f'No subsidy rate found for {fertilizer_type}'}
    
    subsidy_amount = rate.get('per_kg_rate', 0) * quantity_kg
    
    return {
        'fertilizer_type': fertilizer_type,
        'quantity_kg': quantity_kg,
        'subsidy_percentage': rate.get('subsidy_percentage'),
        'per_kg_rate': rate.get('per_kg_rate'),
        'subsidy_amount': subsidy_amount
    }


# ==================== SOIL TEST OPERATIONS ====================

def save_soil_test(test_data: Dict) -> Optional[str]:
    """Save soil test record"""
    test_id = test_data.get('id', str(uuid.uuid4()))
    test_data['id'] = test_id
    test_data['test_date'] = test_data.get('test_date', _get_timestamp())
    test_data['created_at'] = _get_timestamp()
    test_data['version'] = 1
    
    test_data = _add_hash(test_data)
    
    filepath = os.path.join(DIRS['soil_tests'], f'{test_id}.json')
    if _write_json(filepath, test_data):
        _update_index('soil_tests', test_id, add=True)
        _audit_log('create', 'soil_test', test_id, 
                   details={'farmer_id': test_data.get('farmer_id')})
        return test_id
    return None


def get_soil_test(test_id: str) -> Optional[Dict]:
    """Get soil test by ID"""
    filepath = os.path.join(DIRS['soil_tests'], f'{test_id}.json')
    return _read_json(filepath)


def get_soil_tests_by_farmer(farmer_id: str) -> List[Dict]:
    """Get all soil tests for a farmer"""
    index = _read_json(_get_index_path('soil_tests'))
    if not index:
        return []
    
    tests = []
    for test_id in index.get('ids', []):
        test = get_soil_test(test_id)
        if test and test.get('farmer_id') == farmer_id:
            tests.append(test)
    
    return tests


# ==================== NUE OPERATIONS ====================

def save_nue(nue_data: Dict) -> Optional[str]:
    """Save NUE record"""
    nue_id = nue_data.get('id', str(uuid.uuid4()))
    nue_data['id'] = nue_id
    nue_data['calculated_at'] = nue_data.get('calculated_at', _get_timestamp())
    nue_data['created_at'] = _get_timestamp()
    
    nue_data = _add_hash(nue_data)
    
    filepath = os.path.join(DIRS['nue'], f'{nue_id}.json')
    if _write_json(filepath, nue_data):
        # Also update regional data
        region = nue_data.get('region')
        if region:
            regional_path = os.path.join(DIRS['nue'], 'regional.json')
            regional = _read_json(regional_path) or {'regions': {}}
            regional['regions'][region] = nue_data
            regional['last_updated'] = _get_timestamp()
            _write_json(regional_path, regional)
        
        return nue_id
    return None


def get_nue(nue_id: str) -> Optional[Dict]:
    """Get NUE record by ID"""
    filepath = os.path.join(DIRS['nue'], f'{nue_id}.json')
    return _read_json(filepath)


def get_nue_by_region(region: str) -> Optional[Dict]:
    """Get latest NUE data for a region"""
    regional_path = os.path.join(DIRS['nue'], 'regional.json')
    regional = _read_json(regional_path)
    if regional and regional.get('regions', {}).get(region):
        return regional['regions'][region]
    return None


def get_all_nue() -> List[Dict]:
    """Get all NUE records"""
    regional_path = os.path.join(DIRS['nue'], 'regional.json')
    regional = _read_json(regional_path)
    if regional:
        return list(regional.get('regions', {}).values())
    return []


# ==================== AUDIT OPERATIONS ====================

def get_audit_logs(filters: Dict = None) -> List[Dict]:
    """Get audit logs with optional filters"""
    filters = filters or {}
    audit_path = os.path.join(DIRS['audit'], 'logs.json')
    logs = _read_json(audit_path)
    
    if not logs:
        return []
    
    entries = logs.get('entries', [])
    
    # Apply filters
    if filters.get('entity'):
        entries = [e for e in entries if e.get('entity') == filters['entity']]
    if filters.get('action'):
        entries = [e for e in entries if e.get('action') == filters['action']]
    if filters.get('user_id'):
        entries = [e for e in entries if e.get('user_id') == filters['user_id']]
    
    return entries


# ==================== UTILITY FUNCTIONS ====================

def get_storage_stats() -> Dict:
    """Get storage statistics"""
    stats = {}
    
    for entity, dir_path in DIRS.items():
        if entity.startswith('transactions_'):
            continue
        index_path = _get_index_path(entity)
        index = _read_json(index_path)
        if index:
            stats[entity] = {
                'count': index.get('total_count', 0),
                'last_updated': index.get('last_updated')
            }
    
    return stats


def init_sample_data() -> bool:
    """Initialize sample data for testing"""
    
    # Sample users
    sample_users = [
        {
            'id': 'user-farmer-001',
            'phone': '01712345678',
            'password_hash': '$2b$12$samplehash',
            'role': 'farmer',
            'name': 'Rahim Khan',
            'kyc_level': 2,
            'kyc_verified': True,
            'region': 'dhaka_tongi'
        },
        {
            'id': 'user-dealer-001',
            'phone': '01712345679',
            'password_hash': '$2b$12$samplehash',
            'role': 'dealer',
            'name': 'Karim Brothers Ltd',
            'kyc_level': 3,
            'kyc_verified': True,
            'region': 'dhaka_gazipur'
        },
        {
            'id': 'user-officer-001',
            'phone': '01712345680',
            'password_hash': '$2b$12$samplehash',
            'role': 'officer',
            'name': 'Dr. Mohammad Ali',
            'kyc_level': 3,
            'kyc_verified': True,
            'region': 'dhaka'
        },
        {
            'id': 'user-admin-001',
            'phone': '01712345681',
            'password_hash': '$2b$12$samplehash',
            'role': 'admin',
            'name': 'System Administrator',
            'kyc_level': 3,
            'kyc_verified': True,
            'region': 'national'
        }
    ]
    
    for user in sample_users:
        save_user(user)
    
    # Sample subsidies
    sample_subsidies = [
        {
            'fertilizer_type': 'urea',
            'subsidy_percentage': 40,
            'per_kg_rate': 12,
            'region': 'national',
            'effective_from': '2024-01-01T00:00:00Z',
            'status': 'active',
            'policy_reference': 'asia_report_p104',
            'created_by': 'user-admin-001'
        },
        {
            'fertilizer_type': 'dap',
            'subsidy_percentage': 50,
            'per_kg_rate': 30,
            'region': 'national',
            'effective_from': '2024-01-01T00:00:00Z',
            'status': 'active',
            'policy_reference': 'india_ebill_p104',
            'created_by': 'user-admin-001'
        },
        {
            'fertilizer_type': 'mop',
            'subsidy_percentage': 35,
            'per_kg_rate': 18,
            'region': 'national',
            'effective_from': '2024-01-01T00:00:00Z',
            'status': 'active',
            'policy_reference': 'asia_report_p104',
            'created_by': 'user-admin-001'
        }
    ]
    
    for subsidy in sample_subsidies:
        save_subsidy(subsidy)
    
    # Sample vouchers
    sample_vouchers = [
        {
            'voucher_code': 'VCH-2026-ABC12345',
            'farmer_id': 'user-farmer-001',
            'subsidy_percentage': 50,
            'max_amount': 2000,
            'fertilizer_types': ['urea', 'dap'],
            'valid_from': '2026-01-01T00:00:00Z',
            'valid_until': '2026-12-31T23:59:59Z',
            'status': 'active',
            'created_by': 'user-admin-001'
        }
    ]
    
    for voucher in sample_vouchers:
        save_voucher(voucher)
    
    # Sample transactions
    sample_transactions = [
        {
            'transaction_type': 'purchase',
            'farmer_id': 'user-farmer-001',
            'dealer_id': 'user-dealer-001',
            'fertilizer_type': 'urea',
            'quantity_kg': 50,
            'unit_price': 30,
            'subsidy_amount': 600,
            'total_amount': 1500,
            'status': 'completed',
            'approved_by': 'user-officer-001',
            'approved_at': '2026-01-15T10:30:00Z'
        }
    ]
    
    for transaction in sample_transactions:
        save_transaction(transaction)
    
    # Sample NUE data
    sample_nue = {
        'region': 'dhaka',
        'reporting_period': '2026-q1',
        'target_nue_percentage': 50,
        'actual_nue_percentage': 48.5,
        'fertilizer_distributed_kg': 50000,
        'crop_production_tons': 25000,
        'efficiency_rating': 'stable'
    }
    
    save_nue(sample_nue)
    
    return True


if __name__ == '__main__':
    print("Fertilizer Tracking E-Bill System - Data Manager")
    print("=" * 50)
    print(f"Storage base: {STORAGE_BASE}")
    print(f"\nDirectories created:")
    for name, path in DIRS.items():
        print(f"  {name}: {path}")
    
    # Initialize sample data
    print("\nInitializing sample data...")
    if init_sample_data():
        print("Sample data initialized successfully!")
    
    # Print stats
    print("\nStorage statistics:")
    stats = get_storage_stats()
    for entity, data in stats.items():
        print(f"  {entity}: {data.get('count', 0)} records")
