#!/bin/bash

# Test API Script
# Make sure the server is running: npm run server

BASE_URL="http://localhost:4040/api"

echo "🧪 Testing AlgoBot API"
echo "===================="
echo ""

# Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq '.' || curl -s "$BASE_URL/health"
echo ""
echo ""

# Create Test Item
echo "2. Creating Test Item:"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/test" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "This is a test item created via curl",
    "status": "active",
    "value": 42
  }')

echo "$CREATE_RESPONSE" | jq '.' || echo "$CREATE_RESPONSE"
ITEM_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // .data._id' 2>/dev/null || echo "")
echo ""
echo "Created Item ID: $ITEM_ID"
echo ""

# Get All Items
echo "3. Getting All Test Items:"
curl -s "$BASE_URL/test" | jq '.' || curl -s "$BASE_URL/test"
echo ""
echo ""

# Get Single Item
if [ ! -z "$ITEM_ID" ]; then
  echo "4. Getting Single Test Item (ID: $ITEM_ID):"
  curl -s "$BASE_URL/test/$ITEM_ID" | jq '.' || curl -s "$BASE_URL/test/$ITEM_ID"
  echo ""
  echo ""
  
  # Update Item
  echo "5. Updating Test Item (ID: $ITEM_ID):"
  curl -s -X PUT "$BASE_URL/test/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test Item",
      "value": 99,
      "status": "inactive"
    }' | jq '.' || curl -s -X PUT "$BASE_URL/test/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -d '{"name": "Updated Test Item", "value": 99, "status": "inactive"}'
  echo ""
  echo ""
  
  # Delete Item
  echo "6. Deleting Test Item (ID: $ITEM_ID):"
  curl -s -X DELETE "$BASE_URL/test/$ITEM_ID" | jq '.' || curl -s -X DELETE "$BASE_URL/test/$ITEM_ID"
  echo ""
  echo ""
fi

echo "✅ API Testing Complete!"
