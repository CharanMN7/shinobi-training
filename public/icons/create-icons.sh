#!/bin/bash
# Run this script to generate placeholder icons
# In production, replace with real PNG icons

python3 - << 'PYEOF'
import base64
DATA = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
import os; base = os.path.dirname(os.path.abspath(__file__))
for n in ['icon-192.png','icon-256.png','icon-384.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png']:
    open(os.path.join(base,n),'wb').write(DATA)
    print(f'Created {n}')
PYEOF
