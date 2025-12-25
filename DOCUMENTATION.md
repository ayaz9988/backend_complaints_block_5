# Comprehensive API Documentation: Complaints & Management System

This document outlines the REST API endpoints for managing announcements, achievements, complaints, and users within the system.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Announcements Endpoints](#announcements-endpoints)
- [Achievements Endpoints](#achievements-endpoints)
- [Complaints Endpoints](#complaints-endpoints)
- [Initiatives Endpoints](#initiatives-endpoints)
- [Users Management Endpoints](#users-management-endpoints)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

## Related Documentation

- [README](README.md) - Project overview, setup instructions, and quick start guide
- [Database Indexing Strategy](INDEXING_STRATEGY.md) - Database optimization and indexing approach
- [Validation System](VALIDATION.md) - Input validation and sanitization documentation

---

## Base URL

All endpoints are prefixed with the base URL of your server, e.g., `http://localhost:3000/v1`.

---

## Authentication

Access to protected endpoints requires a valid JSON Web Token (JWT) to be included in the `Authorization` header.

**Header Format:** `Authorization: Bearer <your_jwt_token>`

### Token Types

1. **Access Token**:
   - Short-lived JWT token.
   - Sent in the `Authorization` header as a `Bearer` token.
   - Required for protected endpoints.
   - Example: `Authorization: Bearer <access_token>`

2. **Refresh Token**:
   - Long-lived token stored in an HTTP-only cookie.
   - Used to obtain new access tokens.
   - Automatically sent by the browser with requests.
   - Not accessible via JavaScript (security measure).

### Authentication Flow

1. User logs in or registers → receives access token and refresh token cookie
2. Access token is stored in localStorage/memory for API requests
3. Refresh token is stored automatically in HTTP-only cookie
4. When access token expires → use refresh endpoint to get new access token
5. Browser automatically sends refresh token cookie with refresh request

### Roles & Permissions

| Role             | Permissions                                                                                                                                                                                                |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`manager`**    | **Superuser**: Can perform all actions. Can create, read, update, and delete announcements, achievements, initiatives, and users. Can view and manage all complaints.                                      |
| **`admin`**      | Can create, read, update announcements, achievements, and initiatives. Can view and manage `mid` priority complaints. Can view, update (no password), and deactivate `mukhtar` users and their complaints. |
| **`mukhtar`**    | Can only read (view) announcements and achievements. Can view and manage `low` priority complaints in their assigned neighborhood. Can soft-delete complaints.                                             |
| **Public Users** | Can only read (view) active announcements and achievements. Can submit new complaints, initiatives, and track them.                                                                                        |

---

## Announcements Endpoints

### `POST /v1/announcements`

Creates a new announcement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **Request Body (JSON):**

  ```json
  {
    "title": "string (required)",
    "content": "string (required)",
    "status": "active | inactive (optional, defaults to 'active')"
  }
  ```

- **Success Response (201 Created):** Returns the full announcement object that was created.

  ```json
  {
    "id": "uuid",
    "title": "New Admin Announcement",
    "content": "This is the content for the new announcement.",
    "status": "active",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "createdBy": "uuid_of_the_admin_user"
  }
  ```

- **Error Responses:**
  - `401 Unauthorized`: If no token is provided, the token is invalid, or the user does not exist.
  - `403 Forbidden`: If the user's role is not `admin` or `manager`.
  - `500 Internal Server Error`: If the server fails to create the announcement.

### `GET /v1/announcements`

Retrieves a list of all active announcements. This endpoint is public.

- **Authorization:** Not required.
- **Success Response (200 OK):** Returns an array of active announcement objects.

  ```json
  [
    {
      "id": "uuid",
      "title": "Public Announcement",
      "content": "Content visible to everyone.",
      "status": "active",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "createdBy": "uuid_of_the_admin_user"
    }
    // ... more announcements
  ]
  ```

### `GET /v1/announcements/:id`

Retrieves a single active announcement by its ID. This endpoint is public.

- **Authorization:** Not required.
- **URL Parameters:**
  - `id` (string, required): The UUID of the announcement.
- **Success Response (200 OK):** Returns the announcement object.
- **Error Responses:**
  - `404 Not Found`: If no announcement with the given `id` exists or if it is inactive.

### `PATCH /v1/announcements/:id`

Updates an existing announcement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the announcement to update.
- **Request Body (JSON):** Provide only the fields you want to update.

  ```json
  {
    "title": "Updated Title (optional)",
    "content": "Updated content (optional)",
    "status": "inactive (optional)"
  }
  ```

- **Success Response (200 OK):** Returns the full, updated announcement object.
- **Error Responses:** `401`, `403`, `404`.

### `DELETE /v1/announcements/:id`

Deletes an announcement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the announcement to delete.
- **Success Response (204 No Content):** The server returns no content, indicating a successful deletion.
- **Error Responses:** `401`, `403`, `404`.

---

## Achievements Endpoints

### `POST /v1/achievements`

Creates a new achievement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **Request Body (JSON):**

  ```json
  {
    "title": "string (required)",
    "description": "string (required)",
    "iconUrl": "string (optional)",
    "status": "active | inactive (optional, defaults to 'active')"
  }
  ```

- **Success Response (201 Created):** Returns the full achievement object that was created.

  ```json
  {
    "id": "uuid",
    "title": "First Achievement",
    "description": "Awarded for completing the onboarding.",
    "iconUrl": "http://example.com/icon.png",
    "status": "active",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "createdBy": "uuid_of_the_admin_user"
  }
  ```

- **Error Responses:**
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: User role is not `admin` or `manager`.
  - `500 Internal Server Error`: Server failed to create the achievement.

### `GET /v1/achievements`

Retrieves a list of all active achievements. This endpoint is public.

- **Authorization:** Not required.
- **Success Response (200 OK):** Returns an array of active achievement objects.

  ```json
  [
    {
      "id": "uuid",
      "title": "First Achievement",
      "description": "Awarded for completing the onboarding.",
      "iconUrl": "http://example.com/icon.png",
      "status": "active",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "createdBy": "uuid_of_the_admin_user"
    }
    // ... more achievements
  ]
  ```

### `GET /v1/achievements/:id`

Retrieves a single active achievement by its ID. This endpoint is public.

- **Authorization:** Not required.
- **URL Parameters:**
  - `id` (string, required): The UUID of the achievement.
- **Success Response (200 OK):** Returns the achievement object.
- **Error Responses:**
  - `404 Not Found`: If no achievement with the given `id` exists or if it is inactive.

### `PATCH /v1/achievements/:id`

Updates an existing achievement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the achievement to update.
- **Request Body (JSON):** Provide only the fields you want to update.

  ```json
  {
    "title": "Updated Title (optional)",
    "description": "Updated description (optional)",
    "iconUrl": "http://example.com/new-icon.png (optional)",
    "status": "inactive (optional)"
  }
  ```

- **Success Response (200 OK):** Returns the full, updated achievement object.
- **Error Responses:** `401`, `403`, `404`.

### `DELETE /v1/achievements/:id`

Deletes an achievement. Access is restricted to `admin` and `manager` roles.

- **Authorization:** Required (`Bearer` token with `admin` or `manager` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the achievement to delete.
- **Success Response (204 No Content):** The server returns no content, indicating a successful deletion.
- **Error Responses:** `401`, `403`, `404`.

---

## Complaints Endpoints

### `POST /v1/complaints`

Create a new complaint (public endpoint).

- **Authorization:** None (public).
- **Request Body (JSON):**

  ```json
  {
    "submitterName": "string",
    "contactNumber": "string (required)",
    "description": "string",
    "location": "string",
    "neighborhood": "string (required)",
    "complaint_type": "noise|infrastructure|sanitation|other (required)",
    "priority": "high|mid|low (optional, defaults to 'mid')",
    "suggestedSolution": "string (optional)"
  }
  ```

- **Success Response (201 Created):** Returns the full complaint object, including a unique `trackingTag`.

  ```json
  {
    "id": "123",
    "submitterName": "John Doe",
    "contactNumber": "1234567890",
    "description": "Description of the complaint",
    "location": "123 Main St",
    "neighborhood": "Downtown",
    "complaint_type": "noise",
    "priority": "high",
    "trackingTag": "uuid",
    "estimatedReviewTime": "1-2 business days",
    "complaint_status": "pending",
    "solutionInfo": null,
    "refusalReason": null,
    "suggestedSolution": "Suggested solution",
    "notes": null,
    "deletedAt": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
  ```

- **Error Responses:** `400`, `500`.

### `GET /v1/complaints/track/:trackingTag`

Track a complaint by its tracking tag (public endpoint).

- **Authorization:** None (public).
- **URL Parameters:**
  - `trackingTag` (string, required): The unique tracking tag of the complaint.
- **Success Response (200 OK):** Returns the complaint object (without internal `notes`).
- **Error Responses:** `404`, `500`.

### `GET /v1/complaints`

List complaints based on user role.

- **Authorization:** Required (`Bearer` token with `manager`, `admin`, or `mukhtar` role).
- **Success Response (200 OK):** Returns an array of complaint objects filtered by role:
  - **Manager**: All high priority complaints (including soft-deleted).
  - **Admin**: All mid priority active complaints.
  - **Mukhtar**: All low priority active complaints.
- **Error Responses:** `401`, `403`, `500`.

### `GET /v1/complaints/:id`

Get details of a specific complaint.

- **Authorization:** Required (`Bearer` token with `manager`, `admin`, or `mukhtar` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the complaint.
- **Success Response (200 OK):** Returns the complaint object.
- **Error Responses:** `401`, `403`, `404`, `500`.

### `PATCH /v1/complaints/:id/accept`

Accept a complaint and provide solution info.

- **Authorization:** Required (`Bearer` token with `manager`, `admin`, or `mukhtar` role).
- **Request Body (JSON):**

  ```json
  {
    "solutionInfo": "string (required)"
  }
  ```

- **Success Response (200 OK):** Returns the updated complaint object with status "accepted".
- **Error Responses:** `400`, `401`, `403`, `404`, `500`.

### `PATCH /v1/complaints/:id/refuse`

Refuse a complaint and provide refusal reason.

- **Authorization:** Required (`Bearer` token with `manager`, `admin`, or `mukhtar` role).
- **Request Body (JSON):**

  ```json
  {
    "refusalReason": "string (required)"
  }
  ```

- **Success Response (200 OK):** Returns the updated complaint object with status "refused".
- **Error Responses:** `400`, `401`, `403`, `404`, `500`.

### `PATCH /v1/complaints/:id`

Update complaint details (excluding status).

- **Authorization:** Required (`Bearer` token with `manager`, `admin`, or `mukhtar` role).
- **Request Body (JSON):**

  ```json
  {
    "priority": "high|mid|low (optional)",
    "notes": "string (optional)",
    "estimatedReviewTime": "string (optional)"
  }
  ```

- **Success Response (200 OK):** Returns the updated complaint object.
- **Error Responses:** `401`, `403`, `404`, `500`.

### `PATCH /v1/complaints/:id/priority`

Set the priority of a complaint. Access is restricted to `admin` role only.

- **Authorization:** Required (`Bearer` token with `admin` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the complaint.
- **Request Body (JSON):**

  ```json
  {
    "priority": "high|mid|low (required)"
  }
  ```

- **Success Response (200 OK):** Returns the updated complaint object with the new priority and estimated review time.

  ```json
  {
    "id": "123",
    "priority": "high",
    "estimatedReviewTime": "1-2 business days"
    // ... other complaint fields
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: If priority is missing or invalid.
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: User is not an admin.
  - `404 Not Found`: Complaint not found.
  - `500 Internal Server Error`: Server error.

### `PATCH /v1/complaints/:id/toggle-working-on`

Toggle the working on status of a complaint. If the complaint is not currently being worked on, it sets it to working on by the current user. If it is being worked on, it removes the working on status. Access is restricted to `admin` role only.

- **Authorization:** Required (`Bearer` token with `admin` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the complaint.
- **Request Body:** None.
- **Success Response (200 OK):** Returns the updated complaint object with the toggled `is_working_on` status and `working_on_by` field.

  ```json
  {
    "id": "123",
    "is_working_on": true,
    "working_on_by": "uuid_of_the_admin_user"
    // ... other complaint fields
  }
  ```

- **Error Responses:**
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: User is not an admin.
  - `404 Not Found`: Complaint or user not found.
  - `500 Internal Server Error`: Server error.

### `DELETE /v1/complaints/:id`

Delete a complaint.

- **Authorization:** Required (`Bearer` token with `manager` or `mukhtar` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the complaint to delete.
- **Success Response (200 OK):**
  - **Manager**: Returns `{ "message": "Complaint permanently deleted" }`.
  - **Mukhtar**: Returns `{ "message": "Complaint soft deleted" }`.
- **Error Responses:** `401`, `403`, `404`, `500`.

---

## Initiatives Endpoints

### `POST /v1/initiatives`

Create a new initiative (public endpoint).

- **Authorization:** None (public).
- **Request Body (JSON):**

  ```json
  {
    "title": "string (required)",
    "description": "string (required)",
    "submitterName": "string (optional)",
    "contactNumber": "string (optional)",
    "location": "string (optional)",
    "neighborhood": "string (optional)"
  }
  ```

- **Success Response (201 Created):** Returns the full initiative object.

  ```json
  {
    "id": "123",
    "title": "Community Garden Initiative",
    "description": "Create a community garden in the neighborhood",
    "status": "pending",
    "submitterName": "John Doe",
    "contactNumber": "1234567890",
    "location": "Central Park",
    "neighborhood": "Downtown",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
  ```

- **Error Responses:** `400`, `500`.

### `GET /v1/initiatives`

List all initiatives.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **Success Response (200 OK):** Returns an array of initiative objects.
- **Error Responses:** `401`, `403`, `500`.

### `GET /v1/initiatives/:id`

Get details of a specific initiative.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the initiative.
- **Success Response (200 OK):** Returns the initiative object.
- **Error Responses:** `401`, `403`, `404`, `500`.

### `PATCH /v1/initiatives/:id`

Update an initiative.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the initiative.
- **Request Body (JSON):** Provide only the fields you want to update.

  ```json
  {
    "title": "string (optional)",
    "description": "string (optional)",
    "status": "pending|approved|rejected (optional)",
    "submitterName": "string (optional)",
    "contactNumber": "string (optional)",
    "location": "string (optional)",
    "neighborhood": "string (optional)"
  }
  ```

- **Success Response (200 OK):** Returns the updated initiative object.
- **Error Responses:** `401`, `403`, `404`, `500`.

### `DELETE /v1/initiatives/:id`

Delete an initiative.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The ID of the initiative to delete.
- **Success Response (200 OK):**

  ```json
  { "message": "Initiative deleted successfully" }
  ```

- **Error Responses:** `401`, `403`, `404`, `500`.

---

## Users Management Endpoints

### `GET /v1/users/`

Retrieves a list of users based on their role.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **Query Parameters:**
  - `role` (string, optional): Filter users by role. Can be `admin`, `mukhtar`, or `admin|mukhtar`.
- **Success Response (200 OK):** Returns an array of user objects.
- **Error Responses:**
  - `401 Unauthorized`: If no token is provided or token is invalid.
  - `403 Forbidden`: If the user's role is not `manager` or `admin`.
  - `500 Internal Server Error`: If the server fails to fetch users.

### `GET /v1/users/:id`

Retrieves a specific user's details and the complaints they have handled.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the user.
- **Permissions:**
  - A `manager` can retrieve any user's details.
  - An `admin` can only retrieve `mukhtar` users' details.
- **Success Response (200 OK):** Returns the user object, including an array of `complaintsHandled`.
- **Error Responses:**
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: User lacks the required role or permissions.
  - `404 Not Found`: No user with the given `id` exists.

### `GET /v1/users/:id/complaints`

Retrieves complaints handled by a specific user.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the user.
- **Permissions:**
  - A `manager` can retrieve complaints handled by any user.
  - An `admin` can only retrieve complaints handled by a `mukhtar`.
- **Success Response (200 OK):** Returns an array of complaint objects.
- **Error Responses:** `401`, `403`, `404`.

### `PATCH /v1/users/:id`

Updates a user's information.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the user to update.
- **Permissions:**
  - A `manager` can update any user, including their password.
  - An `admin` can only update `mukhtar` users and **cannot** change their password.
- **Request Body (JSON):** Provide only the fields you want to update.

  ```json
  {
    "name": "string (optional)",
    "email": "string (optional)",
    "password": "string (optional, only for managers)",
    "neighborhood": "string (optional)"
  }
  ```

- **Success Response (200 OK):** Returns the full, updated user object.
- **Error Responses:** `401`, `403`, `404`.

### `PATCH /v1/users/:id/deactivate`

Deactivates a user account by setting `is_active` to `false`.

- **Authorization:** Required (`Bearer` token with `manager` or `admin` role).
- **URL Parameters:**
  - `id` (string, required): The UUID of the user to deactivate.
- **Permissions:**
  - A `manager` can deactivate any user.
  - An `admin` can only deactivate `mukhtar` users.
- **Request Body:** None.
- **Success Response (200 OK):** Returns the updated user object with `is_active: false`.
- **Error Responses:** `401`, `403`, `404`.

### `DELETE /v1/users/:id`

Permanently deletes a user account from the system.

- **Authorization:** Required (`Bearer` token with `manager` role **only**).
- **URL Parameters:**
  - `id` (string, required): The UUID of the user to delete.
- **Permissions:** Only a `manager` can perform this action.
- **Success Response (200 OK):**

  ```json
  { "message": "User deleted successfully" }
  ```

- **Error Responses:**
  - `401 Unauthorized`: Authentication failed.
  - `403 Forbidden`: User is not a `manager`.
  - `404 Not Found`: No user with the given `id` exists.

---

## Authentication Endpoints

### `POST /v1/auth/register`

Register a new user in the system.

- **Method**: `POST`
- **Path**: `/v1/auth/register`
- **Description**: Register a new user in the system
- **Authentication**: None (public)
- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name",
    "role": "admin|manager|mukhtar",
    "neighborhood": "Neighborhood Name" // Required only for mukhtar role
  }
  ```

- **Response**:

  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin",
      "is_active": true,
      "neighborhood": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
  ```

- **Status Codes**:
  - `201` (Created)
  - `400` (Bad Request)
  - `409` (Conflict - email already exists)

### `POST /v1/auth/login`

Authenticate a user and return tokens.

- **Method**: `POST`
- **Path**: `/v1/auth/login`
- **Description**: Authenticate a user and return tokens
- **Authentication**: None (public)
- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Response**:

  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin",
      "is_active": true,
      "neighborhood": null
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
  ```

- **Status Codes**:
  - `200` (OK)
  - `401` (Unauthorized - invalid credentials)
  - `403` (Forbidden - account inactive)

### `POST /v1/auth/refresh`

Get a new access token using a refresh token.

- **Method**: `POST`
- **Path**: `/v1/auth/refresh`
- **Description**: Get a new access token using a refresh token
- **Authentication**: None (uses refresh token cookie)
- **Request Body**: None
- **Response**:

  ```json
  {
    "accessToken": "new_jwt_token"
  }
  ```

- **Status Codes**:
  - `200` (OK)
  - `401` (Unauthorized - invalid or expired refresh token)

### `POST /v1/auth/logout`

Logout a user and invalidate their refresh token.

- **Method**: `POST`
- **Path**: `/v1/auth/logout`
- **Description**: Logout a user and invalidate their refresh token
- **Authentication**: Bearer token
- **Request Body**: None
- **Response**:

  ```json
  {
    "message": "Logged out successfully"
  }
  ```

- **Status Codes**:
  - `200` (OK)
  - `401` (Unauthorized)

---

## Error Handling

### Standard Error Response Format

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Validation Errors

For validation errors, the response may include additional details:

```json
{
  "error": "Validation failed",
  "details": "Specific field validation error"
}
```

### Common HTTP Status Codes

| Status Code | Description                                           |
| ----------- | ----------------------------------------------------- |
| `200`       | OK - Request successful                               |
| `201`       | Created - Resource created successfully               |
| `204`       | No Content - Request successful, no content to return |
| `400`       | Bad Request - Invalid request data                    |
| `401`       | Unauthorized - Authentication required or invalid     |
| `403`       | Forbidden - Insufficient permissions                  |
| `404`       | Not Found - Resource not found                        |
| `409`       | Conflict - Resource already exists                    |
| `429`       | Too Many Requests - Rate limit exceeded               |
| `500`       | Internal Server Error - Server error                  |

---

## Security Considerations

### Rate Limiting

The API implements rate limiting to protect against abuse and ensure fair usage:

- **Anonymous Users**: Limited to 1 request per hour and 5 requests per day
- **Authenticated Users**: No rate limits applied
- **Affected Endpoints**:
  - Authentication endpoints (`/v1/auth/login`, `/v1/auth/register`)
  - Complaint submission (`/v1/complaints`)
  - Complaint tracking (`/v1/complaints/track/:trackingTag`)
- **Response Headers**: Include rate limit information (`RateLimit-*` headers)
- **Error Response**: Returns `429 Too Many Requests` with retry information

### Token Storage

1. **Access Token**:
   - Store in localStorage or memory
   - Short lifespan (typically 15-60 minutes)
   - Sent with each API request in Authorization header

2. **Refresh Token**:
   - Stored in HTTP-only cookie (automatically managed by browser)
   - Long lifespan (typically 7-30 days)
   - Protected from XSS attacks
   - Automatically sent with refresh requests

### Frontend Implementation Example

```javascript
// Login request
const response = await fetch("/v1/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
  credentials: "include", // Important: includes cookies in the request
});

// Store the access token
const { accessToken } = await response.json();
localStorage.setItem("accessToken", accessToken);

// Making authenticated requests
const apiResponse = await fetch("/v1/complaints", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    "Content-Type": "application/json",
  },
  credentials: "include", // Include cookies for refresh token
});

// Refreshing access token
const refreshResponse = await fetch("/v1/auth/refresh", {
  method: "POST",
  credentials: "include", // Automatically sends refresh token cookie
});

const { accessToken: newAccessToken } = await refreshResponse.json();
localStorage.setItem("accessToken", newAccessToken);
```

### Best Practices

1. Always use HTTPS in production
2. Implement proper error handling for token expiration
3. Clear stored tokens on logout
4. Use the `credentials: 'include'` option in fetch requests
5. Validate and sanitize all input data on the frontend
6. Implement proper loading states and user feedback
7. Handle network errors gracefully

---

## Data Models

### Complaint Status Values

| Status     | Description                              |
| ---------- | ---------------------------------------- |
| `pending`  | Complaint is awaiting review             |
| `accepted` | Complaint has been accepted and resolved |
| `refused`  | Complaint has been refused with a reason |

### Initiative Status Values

| Status     | Description                   |
| ---------- | ----------------------------- |
| `pending`  | Initiative is awaiting review |
| `approved` | Initiative has been approved  |
| `rejected` | Initiative has been rejected  |

### Priority Levels

| Priority | Estimated Review Time |
| -------- | --------------------- |
| `high`   | 1-2 business days     |
| `mid`    | 3-5 business days     |
| `low`    | 1 week                |

### User Roles

| Role      | Permissions                                                                               |
| --------- | ----------------------------------------------------------------------------------------- |
| `manager` | Can view all high priority complaints (including deleted), hard delete complaints         |
| `admin`   | Can view and manage mid priority complaints                                               |
| `mukhtar` | Can view and manage low priority complaints in their neighborhood, soft delete complaints |

## Additional Resources

For more detailed information about the system architecture and implementation:

- [Database Indexing Strategy](INDEXING_STRATEGY.md) - Learn about our database optimization strategies and indexing approach
- [Validation System](VALIDATION.md) - Understand our input validation and sanitization mechanisms
- [README](README.md) - Project setup, configuration, and deployment instructions
