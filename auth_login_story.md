# The Day a User Logged In Two Ways

Once upon a time, a user opened the restaurant portal and tried to sign in in two different ways: first with a password, and then with Google OAuth. What looked like two simple logins was actually a well-structured authentication journey powered by backend logic, database checks, token generation, and identity verification.

## The Story

A user typed their email and password into the portal. The frontend collected the credentials and sent them to the backend login endpoint. The backend searched the users table for a matching email, fetched the stored password hash, and compared it with the password supplied by the user. If the match was correct, the system created a signed access token and returned it to the user.

Later, the same user chose the Google login option. The frontend sent the Google ID token to the backend. The backend verified that token with Google’s identity service, extracted the user’s verified email, and checked whether that email existed in the database. If the account was found, the backend created another access token and allowed the user to continue.

## Technical Explanation

### 1. Password Login Flow

The password flow is a classic authentication process:

1. The frontend sends the email and password to the backend.
2. The backend queries the database for the user by email.
3. It fetches the stored password hash from the users table.
4. It verifies the submitted password using bcrypt.
5. If the password is valid, the backend creates a JWT access token.
6. The token is returned to the frontend and stored in the client session.

In technical terms, the system uses:

- A relational database to store user identity information.
- A password hash instead of raw passwords.
- A secure hashing function such as bcrypt for password verification.
- A JWT token for session authentication.

Example code snippet:

```python
stored_hash = user.password_hash
is_valid = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
```

### 2. Google OAuth Login Flow

The Google login flow is based on identity verification:

1. The frontend receives a Google credential from Google Identity Services.
2. The frontend sends that credential to the backend as an ID token.
3. The backend verifies the token using Google’s public key infrastructure.
4. Once verified, the backend extracts the user’s email address.
5. The backend checks whether the email exists in its own user table.
6. If the user exists, a JWT access token is issued.

In technical terms, the system uses:

- OAuth 2.0 / OpenID Connect principles.
- Google-issued ID tokens.
- Token validation against the configured Google client ID.
- Database lookup by verified email.

Example code snippet:

```python
idinfo = id_token.verify_oauth2_token(request.id_token, google_requests.Request(), client_id)
email = idinfo.get("email")
```

## Data Structures and Logic

### User Record Structure

The user record typically includes fields such as:

- id
- email
- full_name
- password_hash
- login_method
- role_id
- corporate_id
- region_id
- district_id
- store_id

This record represents the user’s identity and access context.

### Authentication Logic

The core logic follows a simple decision flow:

- If the user is logging in with a password, verify the password hash.
- If the user is logging in with Google, validate the Google token.
- If the user exists in the database, issue a token.
- If not, reject the login attempt.

This is a form of identity verification where the system checks whether the presented credentials match the stored identity.

## DSA-Style Logic Thinking

If we think of the authentication flow like a data structure problem, it resembles a lookup and validation pipeline:

- Input: credentials
- Lookup: search the users table by email
- Validation: compare password hash or verify OAuth token
- Decision: either authenticate or reject
- Output: issued token

The logic can be viewed as a simple pipeline:

1. Receive request
2. Extract identity input
3. Query user store
4. Validate identity source
5. Generate session token

Example flow snippet:

```python
if user_exists and password_is_valid:
    token = create_access_token(claims)
    return token
```

This is similar to searching a map or hash table: the email acts as a key, and the user record is the value.

## Code Logic Implementation

### Password Login Implementation

In the backend, the password login handler does the following:

- Reads the request body containing email and password
- Queries the users table by email
- Retrieves the stored password hash
- Calls a password verification function such as bcrypt check
- If the password is correct, creates a JWT token with user claims
- Returns the token and user metadata

### Google OAuth Implementation

In the backend, the OAuth login handler does the following:

- Receives an ID token from the frontend
- Verifies the token using Google’s verifier with the application client ID
- Extracts the verified email
- Looks up the user in the database using that email
- Creates a JWT token for the authenticated user

### How the Backend Verifies a Google Token Using Public Keys

When Google issues an ID token, it is signed by Google. The backend does not trust the token just because it looks valid. Instead, it verifies it using Google’s public key infrastructure.

The verification process works like this:

1. The backend receives the Google ID token.
2. It reads the token’s header and payload.
3. It checks the token’s issuer, audience, expiration, and signature.
4. It fetches Google’s public keys from Google’s well-known JWKS endpoint.
5. It uses the correct public key to verify the token signature.
6. If the signature matches and the claims are valid, the token is accepted.

In simple terms, Google signs the token with a private key, and the backend verifies that signature with a public key. This ensures the token came from Google and was not modified by an attacker.

The important checks are:

- Audience check: confirms the token was issued for this application.
- Issuer check: confirms the token came from Google.
- Expiration check: confirms the token is still valid.
- Signature check: confirms the token was not tampered with.

This is why Google login is considered secure. The backend does not rely on the user’s claim alone; it validates the cryptographic proof provided by Google.

Example verification idea:

```python
# Google signs the token; the backend verifies the signature with Google public keys
verified_claims = id_token.verify_oauth2_token(token, requests.Request(), client_id)
```

### Token Generation

Once the user is authenticated, the system creates a JWT containing claims like:

- user_id
- role
- email
- corporate_id
- region_id
- district_id
- store_id

These claims represent the user’s identity and authorization context.

Example snippet:

```python
token_claims = {
    "user_id": f"emp_{user.id}",
    "email": user.email,
    "role": user.role
}
access_token = create_access_token(token_claims)
```

## Why This Design Works

This design works because it separates three important concerns:

- Identity verification: password or Google token
- Authorization context: role and assigned store/district/region
- Session management: signed JWT token

That separation makes the system easier to maintain and more secure.

## Final Moral

The story of a user logging in with password and then with OAuth is not just a login story. It is a story of identity verification, secure data handling, structured logic, and token-based access control. The system proves that one user can be authenticated through more than one path, as long as the identity is valid and the backend can trust the proof provided.
