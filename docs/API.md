# REST API reference

Base URL (local): `http://localhost:5000/api`

Unless noted, JSON bodies use `Content-Type: application/json`.

Authenticated routes expect:

```http
Authorization: Bearer <jwt>
```

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness |

---

## Authentication

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/register` | `{ name, email, password }` | `{ success, token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ success, token, user }` |
| GET | `/auth/me` | — | `{ success, user }` |

---

## Users

| Method | Path | Body | Description |
|--------|------|------|-------------|
| PATCH | `/users/profile` | `{ name?, currency?, avatarUrl? }` | Update profile |

---

## Expenses

| Method | Path | Description |
|--------|------|-------------|
| GET | `/expenses/meta` | Category enum list |
| GET | `/expenses` | Query: `from`, `to`, `category`, `page`, `limit` |
| GET | `/expenses/:id` | Single expense |
| POST | `/expenses` | Create (see sample JSON) |
| PATCH | `/expenses/:id` | Partial update |
| DELETE | `/expenses/:id` | Delete |

**Create body (typical)**

```json
{
  "amount": 42.5,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-05-18",
  "paymentMethod": "Card",
  "shopName": "Cafe",
  "gstOrTax": 2.5,
  "items": [{ "name": "Sandwich", "quantity": 1, "unitPrice": 40, "lineTotal": 40 }],
  "source": "manual",
  "receipt": null
}
```

---

## Receipts (AI scan)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/receipts/upload` | `multipart/form-data` field **`image`** (JPEG/PNG/WebP/GIF) |
| GET | `/receipts` | List metadata (no raw image) |
| GET | `/receipts/:id` | Metadata for one receipt |
| GET | `/receipts/:id/image` | Raw image bytes (`Content-Type` from upload) |

**Upload response (`201`)** includes `extracted`, `ai` (explanation, insights, savingsTips, unusualFlags), `isDuplicate`, `suggestedExpense` for form prefill.

---

## Analytics

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/analytics/dashboard` | `ai=1` optional | Summary + charts data + recent |
| GET | `/analytics/full` | `ai=1` optional | Extended analytics + top categories |

---

## Reports

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/reports/monthly` | `year=2026` | Per-month totals for a calendar year |
| GET | `/reports/yearly` | `yearsBack=5` | Per-year totals |

---

## Error format

```json
{
  "success": false,
  "message": "Human readable message"
}
```

HTTP status reflects the error (`401` auth, `404` not found, `502` upstream AI failure, etc.).
