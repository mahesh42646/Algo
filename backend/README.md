# Backend API

## Setup

1. Make sure MongoDB is running locally or update `MONGODB_URI` in `.env.local`
2. Install dependencies: `npm install`
3. Start the server: `npm run server`

## API Endpoints

### Health Check
```bash
curl http://localhost:4040/api/health
```

### Test Routes

#### Get all test items
```bash
curl http://localhost:4040/api/test
```

#### Get test item by ID
```bash
curl http://localhost:4040/api/test/{id}
```

#### Create new test item
```bash
curl -X POST http://localhost:4040/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "This is a test item",
    "status": "active",
    "value": 100
  }'
```

#### Update test item
```bash
curl -X PUT http://localhost:4040/api/test/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Item",
    "status": "inactive"
  }'
```

#### Delete test item
```bash
curl -X DELETE http://localhost:4040/api/test/{id}
```

## Example Test Commands

### 1. Create a test item
```bash
curl -X POST http://localhost:4040/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Test",
    "description": "Testing the API",
    "status": "active",
    "value": 42
  }'
```

### 2. Get all test items
```bash
curl http://localhost:4040/api/test
```

### 3. Get test items with pagination
```bash
curl "http://localhost:4040/api/test?page=1&limit=5"
```

### 4. Get test items by status
```bash
curl "http://localhost:4040/api/test?status=active"
```

### 5. Update a test item (replace {id} with actual ID from step 1)
```bash
curl -X PUT http://localhost:4040/api/test/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "value": 99
  }'
```

### 6. Delete a test item (replace {id} with actual ID)
```bash
curl -X DELETE http://localhost:4040/api/test/{id}
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```
