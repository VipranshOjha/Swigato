import os

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'getRestaurantPath' not in content:
                    if '`/restaurants/' in content or "navigate('/restaurants/" in content or 'to="/restaurants/' in content:
                        print(f"FOUND IN: {filepath}")
