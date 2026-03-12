# -*- coding: utf-8 -*-
import json
import os
import sys

# Set UTF-8 encoding for output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def generate_report():
    data_path = 'h:/state/e bill system/.tmp/demo_data.json'
    
    if not os.path.exists(data_path):
        print("Error: Demo data not found.")
        return

    with open(data_path, 'r') as f:
        data = json.load(f)

    print("# Regional Subsidy Audit Report")
    print("| Role | Name | Fertilizer Type | Quantity (kg) | Subsidy (৳) |")
    print("| :--- | :--- | :--- | :--- | :--- |")
    
    total_subsidy = 0
    for item in data:
        if 'subsidy' in item:
            role = item['role'].capitalize()
            name = item['name']
            f_type = item['type']
            qty = item['qty']
            subsidy = item['subsidy']
            total_subsidy += subsidy
            print(f"| {role} | {name} | {f_type} | {qty} | {subsidy} |")
    
    print(f"\n**Total Distributed Subsidy:** ৳{total_subsidy}")
    print("\n*Note: Dealer bulk transactions are listed with 0 subsidy per policy p.104.*")

if __name__ == "__main__":
    generate_report()
