# Amzat's Master Coding Cheat Sheet (Copy/Paste Library)

> **Last updated:** March 2026
> **Author:** Amzat · Senior Full-Stack / DevOps Engineer
> One-stop reference for daily development, interviews, and production deploys.

---

# 📑 Table of Contents

1. **Python** — Core, data utilities, OOP, decorators, generators, context managers
2. **Django + DRF** — Auth, serializers, viewsets, permissions, pagination, throttling, uploads
3. **Flask** — Blueprints, middleware, error handling
4. **JavaScript + TypeScript** — Types, narrowing, async, error handling
5. **Node.js + Express** — Routers, middleware, JWT auth, validation, file uploads
6. **React** — Forms, hooks, loading/error, optimistic UI, reusable fetch hook
7. **React Native / Expo** — API client, token storage, FlatList + refresh
8. **SQL (PostgreSQL)** — Schema, constraints, indexes, joins, upsert, transactions, window functions, EXPLAIN
9. **Docker** — Dockerfile, multi-stage, compose, debugging
10. **Git** — Daily workflow, undo, stash, rebase, cherry-pick, blame
11. **CI/CD** — Jenkinsfile, GitHub Actions
12. **AWS** — S3, presigned URLs, EC2, RDS, IAM, CloudWatch
13. **Kubernetes** — Deployment, service, commands
14. **Java** — OOP, interfaces, exceptions, collections, streams
15. **PHP** — Routing, JSON, PDO, auth header pattern
16. **MATLAB** — Plots, noise, FFT, matrix solve
17. **Redis** — Caching, rate limiting, queues
18. **Background Jobs** — Celery/RQ, BullMQ
19. **WebSockets** — Real-time server + client
20. **Security** — Hashing, JWT, CSRF/XSS/SQLi, secure uploads
21. **System Design Templates** — Marketplace, file upload pipeline
22. **Project Layouts** — Django+DRF, Node+TS, React, React Native Expo
23. **Checklists** — API endpoint, security, deploy, debugging
24. **Common Snippets** — Pagination, retry/backoff, rate limiting, caching, response envelope, logging, transactions

---

# 1. Python

## ▶ Core Essentials

```python
# ─── LIST COMPREHENSION ───
# Use when you need to transform/filter a list in one line
# Faster than for-loops for simple transforms
squares = [x ** 2 for x in range(10)]                  # [0, 1, 4, 9, ...]
evens   = [x for x in range(20) if x % 2 == 0]        # filter only evens
flat    = [item for sub in nested_list for item in sub] # flatten 2D list

# ─── DICT COMPREHENSION ───
# Great for inverting dicts, transforming values, or building lookups
word_len = {w: len(w) for w in ["hello", "world"]}  # {'hello': 5, 'world': 5}
inverted = {v: k for k, v in original.items()}       # swap keys ↔ values

# ─── SET COMPREHENSION ───
unique_lengths = {len(w) for w in ["hi", "hey", "hi"]}  # {2, 3}
```

```python
# ─── UNPACKING & SWAPPING ───
a, b = b, a                              # swap without temp variable
first, *rest = [1, 2, 3, 4]              # first=1, rest=[2,3,4]
first, *middle, last = [1, 2, 3, 4, 5]   # middle=[2,3,4]

# ─── WALRUS OPERATOR (Python 3.8+) ───
# Assign inside an expression — great for while loops / comprehensions
# Avoids calling the function twice
if (n := len(data)) > 10:
    print(f"Too long: {n}")

# ─── TERNARY ───
status = "active" if user.is_active else "inactive"
```

```python
# ─── F-STRINGS (formatting) ───
name = "Amzat"
print(f"Hello, {name}!")                    # basic interpolation
print(f"{'Price':>10}: ${9.99:.2f}")        # right-align, 2 decimals
print(f"{1_000_000:,}")                     # "1,000,000" with commas
print(f"{0.856:.1%}")                       # "85.6%"
import datetime
now = datetime.datetime.now()
print(f"{now:%Y-%m-%d %H:%M}")              # "2026-03-10 14:01"
```

```python
# ─── ENUMERATE & ZIP ───
# enumerate gives you index + value (no need for range(len(...)))
for i, item in enumerate(["a", "b", "c"], start=1):
    print(i, item)  # 1 a, 2 b, 3 c

# zip pairs elements from multiple iterables
names  = ["Alice", "Bob"]
scores = [95, 87]
for name, score in zip(names, scores):
    print(f"{name}: {score}")

# dict from two lists
lookup = dict(zip(names, scores))  # {'Alice': 95, 'Bob': 87}
```

## ▶ Data Utilities

```python
# ─── COLLECTIONS MODULE ───
from collections import Counter, defaultdict, namedtuple, deque

# Counter — count occurrences, find most common
words = ["apple", "banana", "apple", "cherry", "banana", "apple"]
c = Counter(words)
c.most_common(2)  # [('apple', 3), ('banana', 2)]

# defaultdict — auto-initialise missing keys (no KeyError)
graph = defaultdict(list)    # missing keys default to []
graph["a"].append("b")       # no need to check if "a" exists first
word_count = defaultdict(int)
for w in words:
    word_count[w] += 1       # int() returns 0, so += 1 works

# namedtuple — lightweight immutable data class
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p.x, p.y)  # 3 4 — access by name instead of index

# deque — O(1) append/pop from both ends (list is O(n) for left ops)
q = deque([1, 2, 3])
q.appendleft(0)   # [0, 1, 2, 3]
q.pop()            # 3 — removes from right
q.popleft()        # 0 — removes from left
```

```python
# ─── ITERTOOLS (interview goldmine) ───
from itertools import chain, groupby, product, permutations, combinations, islice

# chain — flatten multiple iterables into one
list(chain([1, 2], [3, 4], [5]))  # [1, 2, 3, 4, 5]

# groupby — group consecutive elements (MUST sort first!)
data = sorted([("a", 1), ("b", 2), ("a", 3)], key=lambda x: x[0])
for key, grp in groupby(data, key=lambda x: x[0]):
    print(key, list(grp))  # a [('a',1),('a',3)]  b [('b',2)]

# product — cartesian product (nested loop replacement)
list(product("AB", "12"))  # [('A','1'),('A','2'),('B','1'),('B','2')]

# combinations / permutations
list(combinations([1, 2, 3], 2))   # [(1,2),(1,3),(2,3)] — order doesn't matter
list(permutations([1, 2, 3], 2))   # [(1,2),(1,3),(2,1),(2,3),...] — order matters
```

## ▶ OOP Patterns

```python
# ─── DATACLASS (Python 3.7+) ───
# Replaces __init__, __repr__, __eq__ boilerplate
from dataclasses import dataclass, field
from typing import List

@dataclass
class User:
    name: str
    email: str
    age: int = 0                                     # default value
    tags: List[str] = field(default_factory=list)     # mutable default
    
    def __post_init__(self):
        # Runs AFTER __init__ — good for validation
        if self.age < 0:
            raise ValueError("Age cannot be negative")

user = User(name="Amzat", email="amzat@example.com", age=25)
print(user)  # User(name='Amzat', email='amzat@example.com', age=25, tags=[])
```

```python
# ─── ABSTRACT BASE CLASS ───
# Forces subclasses to implement specific methods
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def charge(self, amount: float) -> bool:
        """Subclasses MUST implement this."""
        pass
    
    def refund(self, amount: float) -> bool:
        """Optional — has a default implementation."""
        return self.charge(-amount)

class StripeProcessor(PaymentProcessor):
    def charge(self, amount: float) -> bool:
        # real Stripe API call here
        print(f"Charging ${amount} via Stripe")
        return True

# PaymentProcessor() would raise TypeError — can't instantiate abstract class
```

## ▶ Decorators & Context Managers

```python
# ─── DECORATOR: TIMING ───
# Wraps any function to measure execution time
import time
import functools

def timer(func):
    @functools.wraps(func)  # preserves original function name/docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[TIMER] {func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

@timer
def slow_query():
    time.sleep(1)
    return "done"
```

```python
# ─── DECORATOR: RETRY WITH BACKOFF ───
# Production pattern — retries with exponential delay
import random

def retry(max_retries=3, base_delay=1.0, backoff_factor=2.0):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            delay = base_delay
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        raise  # re-raise on last attempt
                    jitter = random.uniform(0, delay * 0.1)
                    sleep_time = delay + jitter
                    print(f"[RETRY] Attempt {attempt} failed: {e}. "
                          f"Retrying in {sleep_time:.1f}s...")
                    time.sleep(sleep_time)
                    delay *= backoff_factor
        return wrapper
    return decorator

@retry(max_retries=5, base_delay=0.5)
def call_external_api():
    # your API call here
    pass
```

```python
# ─── CONTEXT MANAGER (with statement) ───
# Ensures cleanup happens even if an error occurs
from contextlib import contextmanager

@contextmanager
def db_transaction(conn):
    """Usage: with db_transaction(conn) as cursor: ..."""
    cursor = conn.cursor()
    try:
        yield cursor          # code inside 'with' block runs here
        conn.commit()         # only commits if no exception
    except Exception:
        conn.rollback()       # rolls back on any error
        raise                 # re-raise so caller knows it failed
    finally:
        cursor.close()        # always close cursor
```

## ▶ Generators & Async

```python
# ─── GENERATOR ───
# Produces values lazily — memory efficient for huge datasets
# Use instead of returning a giant list
def read_large_file(file_path):
    """Yields one line at a time — never loads entire file into memory."""
    with open(file_path, "r") as f:
        for line in f:
            yield line.strip()

# Usage
for line in read_large_file("huge.csv"):
    process(line)  # processes one line at a time

# Generator expression (like list comp but lazy)
sum_of_squares = sum(x ** 2 for x in range(1_000_000))  # no list in memory
```

```python
# ─── ASYNC/AWAIT (asyncio) ───
# Use for I/O-bound tasks: HTTP calls, DB queries, file I/O
import asyncio
import aiohttp  # pip install aiohttp

async def fetch_url(session, url):
    """Fetch a single URL without blocking other requests."""
    async with session.get(url) as resp:
        return await resp.json()

async def fetch_all(urls):
    """Fetch multiple URLs concurrently — WAY faster than sequential."""
    async with aiohttp.ClientSession() as session:
        # gather runs all coroutines concurrently
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results

# Run it
urls = ["https://api.example.com/1", "https://api.example.com/2"]
results = asyncio.run(fetch_all(urls))
```

## ▶ Type Hints (Interview Tip)

```python
# ─── TYPE HINTS CHEAT SHEET ───
from typing import Optional, Union, Callable, TypeVar, Generic

def greet(name: str, times: int = 1) -> str:
    return f"Hello, {name}! " * times

def find_user(user_id: int) -> Optional[dict]:
    """Optional[X] means X | None — might not find user."""
    return db.get(user_id)  # could return None

def process(data: Union[str, bytes]) -> str:
    """Union means 'could be either type'."""
    if isinstance(data, bytes):
        return data.decode("utf-8")
    return data

# Python 3.10+ — use | instead of Union/Optional
def modern(data: str | bytes) -> str: ...
def maybe(user_id: int) -> dict | None: ...

# Callable type — for functions passed as arguments
def apply(func: Callable[[int, int], int], a: int, b: int) -> int:
    return func(a, b)
```

---

# 2. Django + Django REST Framework

## ▶ Models & Migrations

```python
# ─── models.py ───
# TIP: Always add created_at/updated_at to every model
# TIP: Use UUIDs for public-facing IDs, keep integer PKs for internal FK joins
import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    """Abstract base — inherit this so every model gets timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)  # set once on create
    updated_at = models.DateTimeField(auto_now=True)       # updates on every save
    
    class Meta:
        abstract = True  # won't create a DB table for this model
        ordering = ["-created_at"]  # newest first by default

class Product(TimeStampedModel):
    # UUIDs prevent enumeration attacks (can't guess /products/2, /products/3)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,        # delete products when user is deleted
        related_name="products",          # user.products.all()
    )
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    price       = models.DecimalField(max_digits=10, decimal_places=2)  # never use FloatField for money!
    is_active   = models.BooleanField(default=True, db_index=True)       # index for common filter
    category    = models.CharField(max_length=50, choices=[
        ("electronics", "Electronics"),
        ("clothing", "Clothing"),
        ("books", "Books"),
    ])
    image       = models.ImageField(upload_to="products/%Y/%m/", blank=True)  # organise by date
    
    class Meta(TimeStampedModel.Meta):
        indexes = [
            models.Index(fields=["category", "is_active"]),  # composite index for filtered lists
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name="price_non_negative"),
        ]
    
    def __str__(self):
        return self.title
```

```bash
# ─── MIGRATION COMMANDS ───
python manage.py makemigrations                  # generate migration files
python manage.py migrate                         # apply migrations
python manage.py showmigrations                  # see which are applied
python manage.py sqlmigrate app_name 0001        # see raw SQL a migration will run
python manage.py migrate app_name 0003           # migrate to specific version
python manage.py migrate app_name zero           # rollback ALL migrations for an app
```

## ▶ Serializers (DRF)

```python
# ─── serializers.py ───
from rest_framework import serializers
from .models import Product

class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — fewer fields = faster response."""
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    
    class Meta:
        model = Product
        fields = ["uuid", "title", "price", "category", "owner_name", "created_at"]
        read_only_fields = ["uuid", "created_at"]

class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail/create/update views."""
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())
    # HiddenField: auto-set owner to the request user, don't expose in API input
    
    class Meta:
        model = Product
        fields = [
            "uuid", "title", "description", "price", "category",
            "is_active", "image", "owner", "created_at", "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]
    
    def validate_price(self, value):
        """Custom field-level validation."""
        if value <= 0:
            raise serializers.ValidationError("Price must be positive.")
        return value
    
    def validate(self, attrs):
        """Cross-field validation — runs after individual field validators."""
        if attrs.get("category") == "electronics" and attrs.get("price", 0) < 10:
            raise serializers.ValidationError(
                "Electronics must cost at least $10."
            )
        return attrs
```

## ▶ ViewSets, Permissions & Filtering

```python
# ─── views.py ───
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer
from .permissions import IsOwnerOrReadOnly

class ProductViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Products.
    GET    /products/       → list
    POST   /products/       → create
    GET    /products/{uuid}/ → retrieve
    PUT    /products/{uuid}/ → update
    PATCH  /products/{uuid}/ → partial update
    DELETE /products/{uuid}/ → destroy
    POST   /products/{uuid}/archive/ → custom action
    """
    queryset = Product.objects.select_related("owner").filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    lookup_field = "uuid"  # use UUID in URLs instead of pk
    
    # Filtering, searching, ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_active"]     # ?category=electronics
    search_fields = ["title", "description"]          # ?search=laptop
    ordering_fields = ["price", "created_at"]         # ?ordering=-price
    ordering = ["-created_at"]                        # default ordering
    
    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for everything else."""
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer
    
    def perform_create(self, serializer):
        """Hook that runs during create — set owner automatically."""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, uuid=None):
        """Custom action: POST /products/{uuid}/archive/"""
        product = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
        return Response({"status": "archived"}, status=status.HTTP_200_OK)
```

```python
# ─── permissions.py ───
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """
    Allow read access to anyone.
    Write access only to the object's owner.
    """
    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
```

## ▶ Pagination & Throttling

```python
# ─── settings.py (add to REST_FRAMEWORK config) ───
REST_FRAMEWORK = {
    # Default pagination — cursor is best for real-time feeds
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    
    # Throttling — prevent abuse
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",    # unauthenticated users
        "user": "1000/hour",   # authenticated users
    },
    
    # Auth
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    
    # Exception handling
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
}
```

```python
# ─── pagination.py (custom) ───
from rest_framework.pagination import CursorPagination

class CreatedAtCursorPagination(CursorPagination):
    """
    Cursor pagination — best for infinite scroll / real-time feeds.
    Unlike offset pagination, inserts/deletes won't cause duplicates.
    """
    page_size = 20
    ordering = "-created_at"
    cursor_query_param = "cursor"
    page_size_query_param = "page_size"
    max_page_size = 100
```

## ▶ JWT Auth (Simple JWT)

```python
# ─── urls.py ───
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,   # POST email+password → get access+refresh tokens
    TokenRefreshView,       # POST refresh token → get new access token
)

urlpatterns = [
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
```

```python
# ─── settings.py ───
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),   # short-lived for security
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),        # longer refresh
    "ROTATE_REFRESH_TOKENS": True,                       # new refresh on each use
    "BLACKLIST_AFTER_ROTATION": True,                    # blacklist old refresh tokens
    "AUTH_HEADER_TYPES": ("Bearer",),                    # Authorization: Bearer <token>
}
```

## ▶ Error Handling

```python
# ─── core/exceptions.py ───
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Wraps all DRF errors into a consistent response envelope:
    { "ok": false, "error": { "code": "...", "message": "..." }, "data": null }
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_data = {
            "ok": False,
            "data": None,
            "error": {
                "code": response.status_code,
                "message": response.data,  # original DRF error detail
            },
        }
        response.data = custom_data
    else:
        # Unhandled exception — log it, return 500
        logger.exception("Unhandled exception", exc_info=exc)
        return Response(
            {
                "ok": False,
                "data": None,
                "error": {"code": 500, "message": "Internal server error"},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    
    return response
```

## ▶ File Uploads (DRF)

```python
# ─── serializers.py ───
class FileUploadSerializer(serializers.Serializer):
    """Validates uploaded files — always validate before saving!"""
    file = serializers.FileField()
    
    ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]
    MAX_SIZE_MB = 10
    
    def validate_file(self, value):
        # Check content type
        if value.content_type not in self.ALLOWED_TYPES:
            raise serializers.ValidationError(
                f"Unsupported file type: {value.content_type}. "
                f"Allowed: {', '.join(self.ALLOWED_TYPES)}"
            )
        # Check file size
        max_bytes = self.MAX_SIZE_MB * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f"File too large. Max size: {self.MAX_SIZE_MB}MB"
            )
        return value

# ─── views.py ───
from rest_framework.parsers import MultiPartParser, FormParser

class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["file"]
        # Save file — Django handles storage backend (local/S3)
        instance = Document.objects.create(
            file=uploaded,
            uploaded_by=request.user,
            original_name=uploaded.name,
        )
        return Response(
            {"ok": True, "data": {"id": instance.id, "url": instance.file.url}},
            status=status.HTTP_201_CREATED,
        )
```

---

# 3. Flask

## ▶ App Factory + Blueprints

```python
# ─── app/__init__.py ───
# App Factory pattern — creates the app instance
# Why? Allows multiple configurations (test, dev, prod)
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(f"config.{config_name.capitalize()}Config")
    
    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints (modular route groups)
    from app.auth import auth_bp
    from app.api import api_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(api_bp, url_prefix="/api/v1")
    
    # Register error handlers
    register_error_handlers(app)
    
    return app

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return {"ok": False, "error": "Not found"}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        return {"ok": False, "error": "Internal server error"}, 500
```

```python
# ─── app/api/__init__.py ───
from flask import Blueprint

api_bp = Blueprint("api", __name__)

from . import routes  # import routes AFTER creating blueprint to avoid circular imports
```

```python
# ─── app/api/routes.py ───
from flask import request, jsonify
from . import api_bp
from app.models import Product
from app import db

@api_bp.route("/products", methods=["GET"])
def list_products():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    
    pagination = Product.query.filter_by(is_active=True)\
        .order_by(Product.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "ok": True,
        "data": [p.to_dict() for p in pagination.items],
        "meta": {
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total,
        },
    })

@api_bp.route("/products", methods=["POST"])
def create_product():
    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"ok": False, "error": "Title is required"}), 400
    
    product = Product(title=data["title"], price=data.get("price", 0))
    db.session.add(product)
    db.session.commit()
    return jsonify({"ok": True, "data": product.to_dict()}), 201
```

## ▶ Middleware (Before/After Request)

```python
# ─── app/middleware.py ───
import time
import logging
from flask import request, g

logger = logging.getLogger(__name__)

def register_middleware(app):
    @app.before_request
    def start_timer():
        """Track request duration for performance monitoring."""
        g.start_time = time.perf_counter()
    
    @app.after_request
    def log_request(response):
        """Log every request with method, path, status, and duration."""
        duration = time.perf_counter() - g.get("start_time", 0)
        logger.info(
            "%s %s %s %.3fs",
            request.method,
            request.path,
            response.status_code,
            duration,
        )
        # Add security headers to every response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response
    
    @app.teardown_request
    def cleanup(exception=None):
        """Runs after every request, even if there was an error."""
        if exception:
            logger.error("Request failed", exc_info=exception)
```

---

# 4. JavaScript + TypeScript

## ▶ ES6+ Essentials

```javascript
// ─── DESTRUCTURING ───
// Pull values out of objects/arrays cleanly
const { name, email, role = "user" } = userObj;   // default if missing
const [first, second, ...rest] = [1, 2, 3, 4, 5]; // rest = [3,4,5]

// Nested destructuring
const { address: { city, zip } } = userObj;

// Rename while destructuring
const { name: userName, email: userEmail } = userObj;
```

```javascript
// ─── SPREAD & REST ───
// Spread: expand arrays/objects
const merged = { ...defaults, ...overrides };     // later keys win
const allItems = [...oldItems, newItem];           // append to array

// Rest: collect remaining args
function log(message, ...extras) {
  console.log(message, extras); // extras is an array of remaining args
}

// Shallow clone (careful: nested objects are still references!)
const clone = { ...original };
const deepClone = structuredClone(original); // deep copy (modern browsers/Node 17+)
```

```javascript
// ─── ARRAY METHODS (use these instead of for loops) ───
const users = [
  { name: "Alice", age: 30, active: true },
  { name: "Bob", age: 25, active: false },
  { name: "Carol", age: 35, active: true },
];

// map — transform each element
const names = users.map(u => u.name);  // ["Alice", "Bob", "Carol"]

// filter — keep elements that pass a test
const active = users.filter(u => u.active); // [{Alice}, {Carol}]

// find — first element that passes test (or undefined)
const bob = users.find(u => u.name === "Bob");

// reduce — accumulate into a single value
const totalAge = users.reduce((sum, u) => sum + u.age, 0); // 90

// some / every — boolean checks
const hasInactive = users.some(u => !u.active);   // true
const allActive = users.every(u => u.active);       // false

// flatMap — map + flatten one level
const tags = users.flatMap(u => u.tags || []);

// Chaining — combine methods (very common pattern)
const activeNames = users
  .filter(u => u.active)
  .map(u => u.name)
  .sort();  // ["Alice", "Carol"]
```

```javascript
// ─── PROMISES & ASYNC/AWAIT ───
// RULE: Always use async/await over .then() chains — more readable

// Basic async function
async function fetchUser(id) {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);  // fetch doesn't throw on 4xx/5xx!
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchUser failed:", err.message);
    throw err;  // re-throw so caller can handle it
  }
}

// Parallel requests — WAY faster than sequential awaits
const [users, posts, comments] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json()),
  fetch("/api/comments").then(r => r.json()),
]);

// Promise.allSettled — don't fail if one request fails
const results = await Promise.allSettled([
  fetch("/api/a"),
  fetch("/api/b"),  // even if this fails, you get all results
]);
results.forEach(r => {
  if (r.status === "fulfilled") console.log(r.value);
  else console.log("Failed:", r.reason);
});
```

## ▶ TypeScript Essentials

```typescript
// ─── BASIC TYPES ───
let count: number = 42;
let name: string = "Amzat";
let done: boolean = false;
let items: string[] = ["a", "b"];            // array of strings
let tuple: [string, number] = ["age", 25];   // fixed-length typed array

// ─── INTERFACES vs TYPES ───
// Interface: use for object shapes (extendable)
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "viewer";  // literal union type
  avatar?: string;                      // optional field
  readonly createdAt: Date;             // can't be changed after creation
}

// Type: use for unions, intersections, mapped types
type ID = string | number;
type Nullable<T> = T | null;
type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

// Intersection: combine types
type AdminUser = User & { permissions: string[] };
```

```typescript
// ─── TYPE NARROWING ───
// TypeScript narrows types based on runtime checks

function process(input: string | number | null) {
  if (input === null) return;           // now TS knows: not null
  if (typeof input === "string") {
    console.log(input.toUpperCase());   // TS knows it's string here
  } else {
    console.log(input.toFixed(2));      // TS knows it's number here
  }
}

// Discriminated unions — the best pattern for complex state
type Result<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function handleResult(result: Result<User>) {
  switch (result.status) {
    case "loading": return <Spinner />;
    case "success": return <Profile user={result.data} />;  // TS knows data exists
    case "error":   return <Error message={result.error} />; // TS knows error exists
  }
}
```

```typescript
// ─── GENERICS ───
// Write reusable, type-safe functions/classes

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
// TS infers: first(["a","b"]) → string | undefined
// TS infers: first([1, 2, 3]) → number | undefined

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const userName = getProperty(user, "name"); // TS knows return type is string

// Utility types (built-in, use them!)
type PartialUser = Partial<User>;         // all fields optional
type RequiredUser = Required<User>;       // all fields required
type ReadonlyUser = Readonly<User>;       // all fields readonly
type NameAndEmail = Pick<User, "name" | "email">;  // only these fields
type NoPassword = Omit<User, "password">;           // everything except password
type UserRecord = Record<string, User>;              // { [key: string]: User }
```

---

# 5. Node.js + Express

## ▶ Project Setup & Middleware Stack

```typescript
// ─── src/app.ts ───
import express from "express";
import cors from "cors";
import helmet from "helmet";           // security headers
import morgan from "morgan";           // request logging
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";

const app = express();

// ── MIDDLEWARE ORDER MATTERS ──
app.use(helmet());                     // 1. Security headers first
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") }));
app.use(morgan("combined"));          // 2. Log every request
app.use(express.json({ limit: "10mb" }));  // 3. Parse JSON body (with size limit!)
app.use(express.urlencoded({ extended: true }));

// 4. Rate limiting — prevent brute force & DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,           // 15 minutes
  max: 100,                             // limit each IP to 100 requests per window
  standardHeaders: true,
  message: { ok: false, error: "Too many requests, try again later." },
});
app.use("/api/", limiter);

// 5. Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);

// 6. Error handler MUST be last middleware
app.use(errorHandler);

export default app;
```

## ▶ JWT Auth Middleware

```typescript
// ─── src/middleware/auth.ts ───
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Extract token from "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "No token provided" });
  }

  const token = authHeader.slice(7); // remove "Bearer "
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}

// Role-based authorization
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.userRole || "")) {
      return res.status(403).json({ ok: false, error: "Insufficient permissions" });
    }
    next();
  };
}
```

## ▶ Validation Middleware (Zod)

```typescript
// ─── src/middleware/validate.ts ───
// Zod: runtime schema validation that also generates TypeScript types
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse validates AND strips unknown fields
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: err.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

// ─── Usage in schema file ───
import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  price: z.number().positive("Price must be positive"),
  category: z.enum(["electronics", "clothing", "books"]),
  description: z.string().optional().default(""),
});

// Infer TypeScript type from schema — single source of truth!
export type CreateProductInput = z.infer<typeof createProductSchema>;
```

## ▶ Error Handler & Router

```typescript
// ─── src/middleware/errorHandler.ts ───
import { Request, Response, NextFunction } from "express";

// Custom error class with status code
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true  // true = expected error, false = bug
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: err.message,
    });
  }

  // Unexpected error — log full trace, return generic message
  console.error("UNEXPECTED ERROR:", err);
  res.status(500).json({
    ok: false,
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,  // show details in dev
  });
}
```

```typescript
// ─── src/routes/products.ts ───
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createProductSchema } from "../schemas/product";
import { AppError } from "../middleware/errorHandler";
import { db } from "../db";

export const productsRouter = Router();

// GET /api/products — public
productsRouter.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const [products, [{ count }]] = await Promise.all([
      db.query("SELECT * FROM products WHERE active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]),
      db.query("SELECT COUNT(*) FROM products WHERE active = true"),
    ]);

    res.json({
      ok: true,
      data: products.rows,
      meta: { page, limit, total: parseInt(count) },
    });
  } catch (err) { next(err); }
});

// POST /api/products — auth + validated
productsRouter.post(
  "/",
  authenticate,                           // must be logged in
  validate(createProductSchema),          // body must match schema
  async (req, res, next) => {
    try {
      const { title, price, category, description } = req.body;
      const result = await db.query(
        "INSERT INTO products (title, price, category, description, owner_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [title, price, category, description, req.userId]
      );
      res.status(201).json({ ok: true, data: result.rows[0] });
    } catch (err) { next(err); }
  }
);

// DELETE /api/products/:id — admin only
productsRouter.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const result = await db.query("DELETE FROM products WHERE id = $1 RETURNING id", [req.params.id]);
      if (result.rowCount === 0) throw new AppError(404, "Product not found");
      res.json({ ok: true, data: { deleted: req.params.id } });
    } catch (err) { next(err); }
  }
);
```

## ▶ File Upload (Multer)

```typescript
// ─── src/middleware/upload.ts ───
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "./errorHandler";

// Generate unique filename to prevent collisions & path traversal
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString("hex");
    cb(null, `${hash}${ext}`);  // e.g. "a1b2c3d4...f0.jpg"
  },
});

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new AppError(400, `File type ${file.mimetype} not allowed`));
    }
    cb(null, true);
  },
});

// Usage in route:
// router.post("/upload", authenticate, upload.single("file"), handler);
// req.file contains the uploaded file info
```

---

# 6. React

## ▶ Reusable Fetch Hook

```tsx
// ─── hooks/useFetch.ts ───
// Production-grade data fetching hook with loading, error, and refetch
import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, options?: RequestInit): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is still mounted to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (mountedRef.current) setData(json.data ?? json);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## ▶ Form with Validation

```tsx
// ─── components/ProductForm.tsx ───
import { useState, FormEvent } from "react";

interface FormErrors { [key: string]: string; }

export function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ title: "", price: "", category: "electronics" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Client-side validation
  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Title is required";
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) errs.price = "Price must be a positive number";
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return; // stop if validation fails

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create");
      }
      onSuccess();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.form && <div className="error-banner">{errors.form}</div>}
      
      <label>
        Title
        <input
          value={form.title}
          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>
      
      <label>
        Price
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
        />
        {errors.price && <span className="field-error">{errors.price}</span>}
      </label>
      
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

## ▶ Optimistic UI Pattern

```tsx
// ─── Optimistic UI: update the UI BEFORE the server confirms ───
// Makes the app feel instant. Roll back if the request fails.

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  async function toggleTodo(id: string) {
    // 1. Save previous state for rollback
    const previousTodos = [...todos];

    // 2. Optimistically update UI immediately
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );

    try {
      // 3. Send request to server
      const res = await fetch(`/api/todos/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // 4. Rollback on failure
      setTodos(previousTodos);
      toast.error("Failed to update, reverted.");
    }
  }
  // ...
}
```

## ▶ Custom Hooks Collection

```tsx
// ─── hooks/useDebounce.ts ───
// Delay a value update — great for search inputs
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Usage: const debouncedSearch = useDebounce(searchTerm, 500);
//        useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
```

```tsx
// ─── hooks/useLocalStorage.ts ───
// Persist state in localStorage — survives page refresh
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

---

# 7. React Native / Expo

## ▶ API Client Wrapper

```typescript
// ─── services/api.ts ───
// Centralized API client with token management
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem("auth_token");
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem("auth_token", token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ ok: boolean; data: T | null; error: string | null }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
      });

      // Handle 401 — token expired, force re-login
      if (res.status === 401) {
        await this.clearToken();
        // Navigate to login screen (use your navigation ref)
        throw new Error("Session expired. Please log in again.");
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return { ok: true, data: json.data ?? json, error: null };
    } catch (err) {
      return {
        ok: false,
        data: null,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint); }
  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();
```

## ▶ FlatList with Pull-to-Refresh & Pagination

```tsx
// ─── screens/ProductsScreen.tsx ───
import { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, View, Text, ActivityIndicator } from "react-native";
import { api } from "../services/api";

interface Product { id: string; title: string; price: number; }

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await api.get<{ items: Product[]; total: number }>(
      `/products?page=${pageNum}&limit=20`
    );

    if (res.ok && res.data) {
      const newItems = res.data.items;
      setProducts(prev => (isRefresh ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length === 20);  // if we got full page, there's probably more
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProducts(1); }, []);

  // Pull-to-refresh: reset to page 1
  const onRefresh = () => { setPage(1); fetchProducts(1, true); };

  // Infinite scroll: load next page when reaching end
  const onEndReached = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
          <Text style={{ color: "#666" }}>${item.price.toFixed(2)}</Text>
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}  // trigger when 50% from bottom
      ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 20 }} /> : null}
      ListEmptyComponent={
        !loading ? <Text style={{ textAlign: "center", padding: 40 }}>No products found</Text> : null
      }
    />
  );
}
```

## ▶ Secure Token Storage Pattern

```typescript
// ─── services/secureStorage.ts ───
// Use expo-secure-store for sensitive data (tokens, keys)
// Falls back to AsyncStorage for non-sensitive data
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      // SecureStore not available on web — use localStorage
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Usage:
// await secureStorage.set("access_token", token);
// const token = await secureStorage.get("access_token");
```

---

# 8. SQL (PostgreSQL)

## ▶ Schema & Constraints

```sql
-- ─── TABLE WITH BEST PRACTICES ───
-- Always: UUID or SERIAL PK, timestamps, NOT NULL where appropriate, CHECK constraints
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,               -- auto-incrementing, use BIGSERIAL for scale
    uuid        UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,  -- public-facing ID
    email       VARCHAR(255) UNIQUE NOT NULL,
    username    VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,              -- NEVER store plain text passwords
    role        VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),            -- always use TIMESTAMPTZ, never TIMESTAMP
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- FK with cascade
    title       VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),  -- NUMERIC for money, never FLOAT
    category    VARCHAR(50) NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ───
-- Rule: index columns you WHERE, JOIN, or ORDER BY frequently
CREATE INDEX idx_products_owner     ON products(owner_id);           -- speed up FK lookups
CREATE INDEX idx_products_category  ON products(category) WHERE is_active = TRUE;  -- partial index
CREATE INDEX idx_products_search    ON products USING gin(to_tsvector('english', title || ' ' || description));  -- full-text search
CREATE INDEX idx_users_email_lower  ON users(LOWER(email));          -- case-insensitive email lookup

-- ─── AUTO-UPDATE updated_at ───
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
```

## ▶ Joins & Queries

```sql
-- ─── JOIN TYPES (interview essential) ───
-- INNER JOIN: only rows that match in BOTH tables
SELECT u.username, p.title, p.price
FROM users u
INNER JOIN products p ON p.owner_id = u.id
WHERE p.is_active = TRUE;

-- LEFT JOIN: all rows from LEFT table, NULLs where no match in right
-- Use case: "find users who have NO products"
SELECT u.username, COUNT(p.id) AS product_count
FROM users u
LEFT JOIN products p ON p.owner_id = u.id
GROUP BY u.id, u.username
HAVING COUNT(p.id) = 0;  -- users with zero products

-- SELF JOIN: join a table to itself
-- Use case: "find employees and their managers"
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

## ▶ Upsert, Transactions & CTEs

```sql
-- ─── UPSERT (INSERT ... ON CONFLICT) ───
-- Insert if new, update if exists. Prevents race conditions.
INSERT INTO products (uuid, title, price, category, owner_id)
VALUES ('abc-123', 'Widget', 29.99, 'electronics', 1)
ON CONFLICT (uuid) DO UPDATE SET
    title = EXCLUDED.title,       -- EXCLUDED refers to the row that was rejected
    price = EXCLUDED.price,
    updated_at = NOW();

-- ─── TRANSACTION ───
-- All-or-nothing: if any statement fails, everything rolls back
BEGIN;
    UPDATE accounts SET balance = balance - 100 WHERE id = 1;
    UPDATE accounts SET balance = balance + 100 WHERE id = 2;
    -- If second UPDATE fails, first is rolled back too
COMMIT;

-- ─── CTE (Common Table Expression) ───
-- Break complex queries into readable steps
WITH active_sellers AS (
    SELECT owner_id, COUNT(*) AS product_count, AVG(price) AS avg_price
    FROM products
    WHERE is_active = TRUE
    GROUP BY owner_id
    HAVING COUNT(*) >= 5
)
SELECT u.username, s.product_count, s.avg_price
FROM active_sellers s
JOIN users u ON u.id = s.owner_id
ORDER BY s.product_count DESC;
```

## ▶ Window Functions

```sql
-- ─── WINDOW FUNCTIONS (interview favorite) ───
-- Perform calculations across rows related to the current row

-- ROW_NUMBER: assign unique sequential numbers
-- Use case: "get the most expensive product per category"
SELECT * FROM (
    SELECT
        title, category, price,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rank
    FROM products
    WHERE is_active = TRUE
) ranked
WHERE rank <= 3;  -- top 3 per category

-- RUNNING TOTAL
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- LAG/LEAD: compare with previous/next row
SELECT
    date,
    revenue,
    LAG(revenue) OVER (ORDER BY date) AS prev_day_revenue,
    revenue - LAG(revenue) OVER (ORDER BY date) AS daily_change
FROM daily_sales;
```

## ▶ EXPLAIN Basics

```sql
-- ─── QUERY PERFORMANCE ANALYSIS ───
-- Always run EXPLAIN ANALYZE on slow queries
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'electronics' AND is_active = TRUE;

-- Key things to look for in output:
-- Seq Scan      → no index used, scanning entire table (BAD for large tables)
-- Index Scan    → using an index (GOOD)
-- Bitmap Scan   → using index but fetching many rows (OK)
-- Nested Loop   → for each row in outer, scan inner (can be slow)
-- Hash Join     → builds hash table, fast for large joins (GOOD)
-- Sort          → check if you can add an index to avoid sort
-- actual time   → first row..last row in ms
-- rows          → estimated vs actual (big difference = stale stats, run ANALYZE)

-- TIP: If estimated rows ≠ actual rows, run:
ANALYZE products;  -- updates table statistics for the query planner
```

---

# 9. Docker

## ▶ Dockerfile (Production Multi-Stage)

```dockerfile
# ─── MULTI-STAGE BUILD ───
# Stage 1: build (has dev dependencies, build tools)
# Stage 2: production (only runtime, much smaller image)

# ── Stage 1: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (cached if package.json unchanged)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts       # ci = exact versions from lockfile

# Copy source and build
COPY . .
RUN npm run build                  # outputs to /app/dist

# ── Stage 2: Production ──
FROM node:20-alpine AS production
WORKDIR /app

# Don't run as root in production!
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Only copy what's needed to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

```dockerfile
# ─── PYTHON / DJANGO DOCKERFILE ───
FROM python:3.12-slim AS base
WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*       # clean up to reduce image size

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

RUN adduser --disabled-password --no-create-home appuser
USER appuser
EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

## ▶ Docker Compose

```yaml
# ─── docker-compose.yml ───
# One command to spin up entire stack: docker compose up -d
version: "3.9"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:secret@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy    # wait for DB to be ready
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql   # runs on first start
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret       # use secrets in production!
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:       # named volume — data persists across container restarts
  redisdata:
```

## ▶ Docker Debugging Commands

```bash
# ─── ESSENTIAL DOCKER COMMANDS ───
docker ps                              # list running containers
docker ps -a                           # list ALL containers (including stopped)
docker logs <container> --tail 100 -f  # follow last 100 lines of logs
docker exec -it <container> /bin/sh    # open shell inside running container
docker inspect <container>             # full container details (IP, mounts, env)
docker stats                           # live resource usage (CPU, memory, network)

# ─── BUILD & CLEAN ───
docker build -t myapp:v1 .             # build image with tag
docker build --no-cache -t myapp:v1 .  # rebuild from scratch (ignore cache)
docker system prune -a                 # remove ALL unused images, containers, volumes
docker image ls                        # list images with sizes

# ─── COMPOSE COMMANDS ───
docker compose up -d                   # start all services in background
docker compose down                    # stop and remove containers
docker compose down -v                 # also remove volumes (DESTRUCTIVE)
docker compose logs api -f             # follow logs for specific service
docker compose exec api sh             # shell into running service
docker compose build --no-cache        # rebuild all images
```

---

# 10. Git

## ▶ Daily Workflow

```bash
# ─── START NEW FEATURE ───
git checkout main                       # start from main
git pull origin main                    # get latest
git checkout -b feature/add-auth        # create feature branch

# ─── WORK → STAGE → COMMIT ───
git status                              # what's changed?
git diff                                # see unstaged changes
git add -p                              # interactive staging (review each change) ← BEST PRACTICE
git commit -m "feat: add JWT authentication middleware"
# Commit message format: type(scope): description
# Types: feat, fix, refactor, docs, test, chore, perf, ci

# ─── PUSH & PR ───
git push -u origin feature/add-auth     # -u sets upstream, only needed first time
# Then create PR on GitHub/GitLab
```

## ▶ Undo & Fix Mistakes

```bash
# ─── UNDO LAST COMMIT (keep changes) ───
git reset --soft HEAD~1                 # moves HEAD back, changes stay staged
git reset --mixed HEAD~1                # moves HEAD back, changes unstaged (default)
git reset --hard HEAD~1                 # DELETES changes permanently ⚠️

# ─── UNDO CHANGES TO A FILE ───
git checkout -- path/to/file            # discard unstaged changes
git restore path/to/file               # same thing, newer syntax

# ─── AMEND LAST COMMIT ───
git add forgotten-file.ts
git commit --amend --no-edit            # add to last commit without changing message
git commit --amend -m "new message"     # change last commit message

# ─── REVERT A PUBLISHED COMMIT (safe, creates new commit) ───
git revert <commit-hash>               # undoes the commit with a NEW commit
git revert HEAD                         # revert the latest commit

# ─── RECOVER DELETED BRANCH / LOST COMMITS ───
git reflog                              # shows ALL recent HEAD movements
git checkout -b recovered <hash>       # recover from reflog hash
```

## ▶ Stash, Rebase & Cherry-Pick

```bash
# ─── STASH (save work temporarily) ───
git stash                               # stash tracked changes
git stash -u                            # include untracked files
git stash save "WIP: auth middleware"   # with a description
git stash list                          # see all stashes
git stash pop                           # apply most recent stash + remove it
git stash apply stash@{2}              # apply specific stash, keep it in list
git stash drop stash@{0}               # delete a stash

# ─── REBASE (cleaner than merge, rewrites history) ───
git checkout feature/add-auth
git rebase main                         # replay your commits on top of main
# If conflicts:
#   1. Fix conflicts in files
#   2. git add <resolved-files>
#   3. git rebase --continue
#   OR: git rebase --abort              # cancel and go back to before rebase

# Interactive rebase — squash/reorder commits before PR
git rebase -i HEAD~3                    # interactive for last 3 commits
# In editor: change 'pick' to 'squash' (s), 'reword' (r), 'drop' (d)

# ─── CHERRY-PICK (copy specific commit to current branch) ───
git cherry-pick <commit-hash>           # apply ONE commit from another branch
git cherry-pick --no-commit <hash>     # apply changes without committing
```

## ▶ Blame & Bisect

```bash
# ─── BLAME (who wrote this line?) ───
git blame path/to/file                  # shows author + commit for each line
git blame -L 50,60 path/to/file        # blame specific line range
git log --oneline --follow path/to/file  # full history of a file

# ─── BISECT (find which commit broke something) ───
git bisect start
git bisect bad                          # current commit is broken
git bisect good <known-good-hash>      # last known working commit
# Git checks out middle commit. Test it, then:
git bisect good                         # if this commit works
git bisect bad                          # if this commit is broken
# Repeat until Git finds the exact commit that introduced the bug
git bisect reset                        # return to original branch
```

---

# 11. CI/CD

## ▶ GitHub Actions

```yaml
# ─── .github/workflows/ci.yml ───
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"
  DATABASE_URL: postgresql://test:test@localhost:5432/testdb

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"                    # cache node_modules

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: ${{ env.DATABASE_URL }}

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    needs: test                           # only build if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # only on main branch

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Push image
        run: |
          docker tag myapp:${{ github.sha }} myuser/myapp:latest
          docker push myuser/myapp:latest
```

## ▶ Jenkinsfile

```groovy
// ─── Jenkinsfile (Declarative Pipeline) ───
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "myapp"
        REGISTRY     = "registry.example.com"
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint & Test') {
            parallel {                     // run lint and test at the same time
                stage('Lint') {
                    steps { sh 'npm run lint' }
                }
                stage('Test') {
                    steps { sh 'npm test -- --coverage' }
                }
            }
        }

        stage('Build Docker') {
            when { branch 'main' }         // only on main branch
            steps {
                sh "docker build -t ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} ."
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                sh "docker push ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}"
                sh "kubectl set image deployment/myapp myapp=${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}"
            }
        }
    }

    post {
        always {
            junit 'reports/**/*.xml'       // publish test results
            cleanWs()                       // clean workspace
        }
        failure {
            slackSend channel: '#deploys', message: "Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}
```

---

# 12. AWS

## ▶ S3 & Presigned URLs

```python
# ─── S3 OPERATIONS (boto3) ───
import boto3
from botocore.exceptions import ClientError

s3 = boto3.client("s3", region_name="us-east-1")

# Upload a file
s3.upload_file("local_file.pdf", "my-bucket", "uploads/file.pdf")

# Upload with metadata and content type
s3.upload_file(
    "image.jpg", "my-bucket", "images/photo.jpg",
    ExtraArgs={
        "ContentType": "image/jpeg",
        "Metadata": {"uploaded-by": "amzat"},
        "ServerSideEncryption": "AES256",  # encrypt at rest
    },
)

# Generate presigned URL — allows temporary access without AWS creds
# Use case: let frontend upload directly to S3 (bypass your server)
def generate_presigned_upload(bucket, key, expires_in=3600):
    """Returns a URL the client can PUT to directly."""
    try:
        url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": bucket, "Key": key, "ContentType": "application/octet-stream"},
            ExpiresIn=expires_in,  # seconds
        )
        return url
    except ClientError as e:
        print(f"Error: {e}")
        return None

# Generate presigned download URL
def generate_presigned_download(bucket, key, expires_in=3600):
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in,
    )

# List objects in a bucket
response = s3.list_objects_v2(Bucket="my-bucket", Prefix="uploads/")
for obj in response.get("Contents", []):
    print(f"{obj['Key']} — {obj['Size']} bytes — {obj['LastModified']}")
```

## ▶ EC2, RDS & IAM Basics

```bash
# ─── EC2 COMMANDS ───
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' --output table
aws ec2 start-instances --instance-ids i-1234567890abcdef0
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# SSH into EC2
ssh -i ~/.ssh/my-key.pem ec2-user@<public-ip>

# ─── RDS ───
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' --output table
# Connect to RDS PostgreSQL
psql -h mydb.123456.us-east-1.rds.amazonaws.com -U myuser -d mydb

# ─── IAM ───
aws iam list-users --output table
aws iam create-user --user-name deploy-bot
aws iam attach-user-policy --user-name deploy-bot --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

## ▶ CloudWatch

```python
# ─── CLOUDWATCH LOGGING ───
import boto3
import time

logs_client = boto3.client("logs", region_name="us-east-1")

# Create log group and stream
logs_client.create_log_group(logGroupName="/myapp/api")
logs_client.create_log_stream(logGroupName="/myapp/api", logStreamName="server-1")

# Put log events
logs_client.put_log_events(
    logGroupName="/myapp/api",
    logStreamName="server-1",
    logEvents=[
        {"timestamp": int(time.time() * 1000), "message": "Server started on port 3000"},
        {"timestamp": int(time.time() * 1000), "message": "Connected to database"},
    ],
)
```

```bash
# ─── CLOUDWATCH CLI ───
# View recent logs
aws logs tail /myapp/api --follow --since 1h

# Create alarm for high CPU
aws cloudwatch put-metric-alarm \
    --alarm-name "HighCPU" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:123456:alerts
```

---

# 13. Kubernetes

## ▶ Deployment & Service

```yaml
# ─── deployment.yaml ───
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3                            # run 3 instances
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myregistry/myapp:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:             # pull from K8s secret
                  name: db-credentials
                  key: url
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:                 # is the pod ready to receive traffic?
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:                  # should K8s restart this pod?
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
---
# ─── service.yaml ───
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80                           # external port
      targetPort: 3000                   # container port
  type: LoadBalancer                     # creates an external load balancer (cloud)
```

## ▶ Essential kubectl Commands

```bash
# ─── CLUSTER INFO ───
kubectl cluster-info
kubectl get nodes -o wide

# ─── DEPLOYMENTS ───
kubectl apply -f deployment.yaml          # create/update from file
kubectl get deployments                    # list deployments
kubectl rollout status deployment/myapp   # watch rollout progress
kubectl rollout undo deployment/myapp     # rollback to previous version
kubectl scale deployment/myapp --replicas=5

# ─── PODS ───
kubectl get pods -o wide                   # list pods with node info
kubectl describe pod <pod-name>            # detailed pod info (events, errors)
kubectl logs <pod-name> --tail 100 -f     # follow logs
kubectl logs <pod-name> -c <container>    # logs for specific container
kubectl exec -it <pod-name> -- /bin/sh    # shell into pod

# ─── SERVICES & SECRETS ───
kubectl get services
kubectl get secrets
kubectl create secret generic db-credentials --from-literal=url='postgresql://...'
kubectl port-forward svc/myapp-service 8080:80   # forward local port to service
```

---

# 14. Java

## ▶ OOP & Interfaces

```java
// ─── INTERFACE ───
// Defines a contract. Classes that implement must provide all methods.
public interface PaymentProcessor {
    boolean charge(double amount);
    boolean refund(double amount);
    
    // Default method: provides optional implementation
    default String getProviderName() {
        return "Unknown";
    }
}

// ─── ABSTRACT CLASS ───
// Can have both abstract methods AND concrete methods with state
public abstract class BaseService {
    protected final Logger logger = LoggerFactory.getLogger(getClass());
    
    // Subclasses MUST implement this
    public abstract void process(Request request);
    
    // Shared logic
    protected void logRequest(Request request) {
        logger.info("Processing request: {}", request.getId());
    }
}

// ─── IMPLEMENTATION ───
public class StripeProcessor implements PaymentProcessor {
    @Override
    public boolean charge(double amount) {
        // Stripe API call here
        System.out.printf("Charging $%.2f via Stripe%n", amount);
        return true;
    }

    @Override
    public boolean refund(double amount) {
        return charge(-amount);
    }

    @Override
    public String getProviderName() {
        return "Stripe";
    }
}
```

## ▶ Exceptions

```java
// ─── CUSTOM EXCEPTION ───
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceType;
    private final String resourceId;

    public ResourceNotFoundException(String type, String id) {
        super(String.format("%s not found with id: %s", type, id));
        this.resourceType = type;
        this.resourceId = id;
    }

    public String getResourceType() { return resourceType; }
    public String getResourceId() { return resourceId; }
}

// ─── TRY-WITH-RESOURCES (auto-close) ───
// Any class implementing AutoCloseable is auto-closed
public String readFile(String path) throws IOException {
    try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
        StringBuilder content = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            content.append(line).append("\n");
        }
        return content.toString();
    }
    // reader is automatically closed here, even if exception thrown
}
```

## ▶ Collections & Streams

```java
// ─── COLLECTIONS ───
import java.util.*;

// List — ordered, allows duplicates
List<String> names = new ArrayList<>(List.of("Alice", "Bob", "Carol"));
names.add("Dave");
names.get(0);              // "Alice"
names.contains("Bob");     // true

// Set — unique elements, no duplicates
Set<String> tags = new HashSet<>(Set.of("java", "spring", "docker"));
tags.add("java");          // no effect, already exists

// Map — key-value pairs
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);
scores.getOrDefault("Unknown", 0);  // 0 (instead of null)

// ─── STREAMS (functional operations on collections) ───
import java.util.stream.*;

List<User> users = getUsers();

// Filter + map + collect
List<String> activeEmails = users.stream()
    .filter(User::isActive)                    // keep active users
    .map(User::getEmail)                       // extract email
    .sorted()                                   // alphabetical
    .collect(Collectors.toList());

// Grouping
Map<String, List<User>> byRole = users.stream()
    .collect(Collectors.groupingBy(User::getRole));  // {"admin": [...], "user": [...]}

// Statistics
IntSummaryStatistics stats = users.stream()
    .mapToInt(User::getAge)
    .summaryStatistics();
// stats.getAverage(), stats.getMax(), stats.getMin(), stats.getCount()

// Find first match
Optional<User> admin = users.stream()
    .filter(u -> u.getRole().equals("admin"))
    .findFirst();
admin.ifPresent(u -> System.out.println(u.getName()));  // safe null handling
```

---

# 15. PHP

## ▶ Routing & JSON API

```php
<?php
// ─── Simple Router Pattern ───
// index.php (entry point)

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Simple routing
switch ("$method $path") {
    case 'GET api/products':
        listProducts();
        break;
    case 'POST api/products':
        createProduct();
        break;
    default:
        // Check for parameterized routes
        if (preg_match('#^api/products/(\d+)$#', $path, $matches)) {
            $id = (int) $matches[1];
            if ($method === 'GET') getProduct($id);
            elseif ($method === 'PUT') updateProduct($id);
            elseif ($method === 'DELETE') deleteProduct($id);
            else jsonResponse(['error' => 'Method not allowed'], 405);
        } else {
            jsonResponse(['error' => 'Not found'], 404);
        }
}

function jsonResponse($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody(): array {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonResponse(['error' => 'Invalid JSON'], 400);
    }
    return $data ?? [];
}
```

## ▶ PDO Prepared Statements

```php
<?php
// ─── DATABASE CONNECTION (PDO) ───
// ALWAYS use prepared statements to prevent SQL injection

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'pgsql:host=localhost;dbname=myapp;port=5432';
        $pdo = new PDO($dsn, 'app', 'secret', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,     // throw exceptions on error
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // return arrays, not objects
            PDO::ATTR_EMULATE_PREPARES => false,               // use real prepared statements
        ]);
    }
    return $pdo;
}

// ─── CRUD WITH PREPARED STATEMENTS ───
function listProducts(): void {
    $db = getDB();
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $stmt = $db->prepare('SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC LIMIT :limit OFFSET :offset');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $products = $stmt->fetchAll();

    $countStmt = $db->query('SELECT COUNT(*) FROM products WHERE is_active = TRUE');
    $total = (int) $countStmt->fetchColumn();

    jsonResponse([
        'ok' => true,
        'data' => $products,
        'meta' => ['page' => $page, 'limit' => $limit, 'total' => $total],
    ]);
}

function createProduct(): void {
    $data = getJsonBody();
    if (empty($data['title'])) {
        jsonResponse(['ok' => false, 'error' => 'Title required'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare('INSERT INTO products (title, price, category) VALUES (:title, :price, :category) RETURNING *');
    $stmt->execute([
        ':title' => $data['title'],
        ':price' => (float) ($data['price'] ?? 0),
        ':category' => $data['category'] ?? 'general',
    ]);
    $product = $stmt->fetch();

    jsonResponse(['ok' => true, 'data' => $product], 201);
}
```

## ▶ Auth Header Pattern

```php
<?php
// ─── JWT AUTH MIDDLEWARE ───
function authenticate(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        jsonResponse(['error' => 'No token provided'], 401);
    }

    $token = substr($header, 7);
    try {
        // Using firebase/php-jwt library
        $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(getenv('JWT_SECRET'), 'HS256'));
        return (array) $decoded;
    } catch (\Exception $e) {
        jsonResponse(['error' => 'Invalid token'], 401);
    }
    return []; // unreachable, but satisfies return type
}

// Usage in route:
// $user = authenticate();  // returns user payload or sends 401
```

---

# 16. MATLAB

## ▶ Plots

```matlab
% ─── BASIC PLOTTING ───
x = linspace(0, 2*pi, 200);  % 200 points from 0 to 2π
y1 = sin(x);
y2 = cos(x);

figure('Position', [100 100 800 400]);
subplot(1, 2, 1);             % 1 row, 2 cols, slot 1
plot(x, y1, 'b-', 'LineWidth', 1.5);
hold on;
plot(x, y2, 'r--', 'LineWidth', 1.5);
title('Trig Functions');
xlabel('x (radians)');
ylabel('Amplitude');
legend('sin(x)', 'cos(x)', 'Location', 'best');
grid on;

subplot(1, 2, 2);
bar([1 2 3 4], [10 25 15 30]);
title('Bar Chart');
xlabel('Category');
ylabel('Count');
```

## ▶ Noise & FFT

```matlab
% ─── ADD NOISE & ANALYZE WITH FFT ───
fs = 1000;                              % sampling frequency (Hz)
t = 0:1/fs:1-1/fs;                      % 1 second of data
f_signal = 50;                           % signal frequency
clean_signal = sin(2*pi*f_signal*t);
noisy_signal = clean_signal + 0.5*randn(size(t));  % add Gaussian noise

% FFT — Fast Fourier Transform
N = length(noisy_signal);
Y = fft(noisy_signal);
P2 = abs(Y/N);                          % two-sided spectrum
P1 = P2(1:N/2+1);                       % single-sided spectrum
P1(2:end-1) = 2*P1(2:end-1);
f = fs*(0:(N/2))/N;                     % frequency axis

figure;
subplot(2,1,1);
plot(t(1:200), noisy_signal(1:200));
title('Noisy Signal (Time Domain)');
xlabel('Time (s)'); ylabel('Amplitude');

subplot(2,1,2);
plot(f, P1);
title('FFT — Frequency Domain');
xlabel('Frequency (Hz)'); ylabel('|P1(f)|');
xlim([0 200]);  % zoom into relevant frequencies
```

## ▶ Matrix Solve

```matlab
% ─── SOLVE LINEAR SYSTEM Ax = b ───
A = [2 1 -1; -3 -1 2; -2 1 2];
b = [8; -11; -3];
x = A \ b;                % backslash operator — most efficient way to solve
% x = [2; 3; -1]

% Verify
residual = norm(A*x - b);  % should be ~0

% ─── EIGENVALUES & EIGENVECTORS ───
[V, D] = eig(A);          % V = eigenvectors (columns), D = diagonal eigenvalues

% ─── MATRIX OPERATIONS ───
inv(A)                     % inverse (avoid if possible, use \ instead)
det(A)                     % determinant
rank(A)                    % matrix rank
trace(A)                   % sum of diagonal elements
```

---

# 17. Redis

## ▶ Caching Pattern

```python
# ─── REDIS CACHING (Python) ───
import redis
import json

r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)

def get_product(product_id: int) -> dict:
    """Cache-aside pattern: check cache first, fallback to DB."""
    cache_key = f"product:{product_id}"
    
    # 1. Try cache
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)  # cache HIT
    
    # 2. Cache MISS — fetch from DB
    product = db.query("SELECT * FROM products WHERE id = %s", product_id)
    
    # 3. Store in cache with TTL (time-to-live)
    r.setex(cache_key, 3600, json.dumps(product))  # expires in 1 hour
    
    return product

def invalidate_product_cache(product_id: int):
    """Call this after UPDATE or DELETE."""
    r.delete(f"product:{product_id}")

# ─── CACHE LIST RESULTS ───
def get_products_page(page: int, limit: int = 20) -> list:
    cache_key = f"products:page:{page}:limit:{limit}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    products = db.query("SELECT * FROM products LIMIT %s OFFSET %s", limit, (page-1)*limit)
    r.setex(cache_key, 300, json.dumps(products))  # 5 min TTL for lists
    return products
```

## ▶ Rate Limiting Pattern

```python
# ─── SLIDING WINDOW RATE LIMITER ───
import time

def is_rate_limited(user_id: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
    """Returns True if user has exceeded their rate limit."""
    key = f"ratelimit:{user_id}"
    now = time.time()
    pipe = r.pipeline()
    
    # Remove entries older than the window
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    # Add current request
    pipe.zadd(key, {f"{now}": now})
    # Count requests in window
    pipe.zcard(key)
    # Set expiry on the key itself
    pipe.expire(key, window_seconds)
    
    results = pipe.execute()
    request_count = results[2]
    
    return request_count > max_requests

# Usage in middleware:
# if is_rate_limited(request.user.id):
#     return Response({"error": "Too many requests"}, status=429)
```

## ▶ Queue Concepts

```python
# ─── REDIS AS A SIMPLE QUEUE ───
# Use Redis Lists as a FIFO queue (for simple cases, use Celery/BullMQ for production)

# Producer: add jobs to queue
def enqueue_job(queue_name: str, job_data: dict):
    r.lpush(queue_name, json.dumps(job_data))

# Consumer: process jobs
def process_queue(queue_name: str):
    while True:
        # BRPOP blocks until a job is available (no busy-waiting)
        _, raw = r.brpop(queue_name, timeout=30)
        if raw:
            job = json.loads(raw)
            handle_job(job)

# Pub/Sub — for real-time broadcasting
# Publisher
r.publish("notifications", json.dumps({"type": "new_order", "order_id": 123}))

# Subscriber (in a separate process)
pubsub = r.pubsub()
pubsub.subscribe("notifications")
for message in pubsub.listen():
    if message["type"] == "message":
        data = json.loads(message["data"])
        print(f"Received: {data}")
```

---

# 18. Background Jobs

## ▶ Celery (Python)

```python
# ─── celery_app.py ───
from celery import Celery

app = Celery("myapp", broker="redis://localhost:6379/0", backend="redis://localhost:6379/1")

# Configuration
app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_acks_late=True,               # acknowledge task AFTER completion (safer)
    worker_prefetch_multiplier=1,       # one task at a time per worker
    task_reject_on_worker_lost=True,
    task_time_limit=300,                # hard kill after 5 minutes
    task_soft_time_limit=240,           # raise SoftTimeLimitExceeded after 4 minutes
)
```

```python
# ─── tasks.py ───
from celery_app import app
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(self, to: str, subject: str, body: str):
    """
    Send email asynchronously.
    bind=True gives access to self for retry.
    """
    try:
        logger.info(f"Sending email to {to}")
        # actual email sending logic here
        email_service.send(to=to, subject=subject, body=body)
    except ConnectionError as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)

@app.task
def process_upload(file_id: int):
    """Process uploaded file: scan, resize, generate thumbnails."""
    file = File.objects.get(id=file_id)
    scan_for_malware(file)
    generate_thumbnails(file)
    file.status = "processed"
    file.save()

# ─── Calling tasks ───
# .delay() — fire and forget
send_email.delay("user@example.com", "Welcome!", "Hello there.")

# .apply_async() — more control
send_email.apply_async(
    args=["user@example.com", "Welcome!", "Hello there."],
    countdown=60,         # wait 60 seconds before executing
    expires=3600,          # discard if not processed within 1 hour
    queue="emails",        # route to specific queue
)

# Check result
result = send_email.delay("user@example.com", "Welcome!", "Hello!")
result.status  # "PENDING", "STARTED", "SUCCESS", "FAILURE"
result.get(timeout=10)  # wait for result (blocking)
```

```bash
# ─── RUN CELERY WORKER ───
celery -A celery_app worker --loglevel=info --concurrency=4 -Q default,emails
celery -A celery_app beat --loglevel=info   # periodic task scheduler
celery -A celery_app flower                  # web monitoring UI
```

## ▶ BullMQ (Node.js)

```typescript
// ─── queue.ts ───
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ host: "localhost", port: 6379, maxRetriesPerRequest: null });

// Create queue
export const emailQueue = new Queue("emails", { connection });

// Add job
await emailQueue.add("send-welcome", {
  to: "user@example.com",
  subject: "Welcome!",
  body: "Hello there.",
}, {
  attempts: 3,                     // retry up to 3 times
  backoff: { type: "exponential", delay: 1000 },  // 1s, 2s, 4s
  removeOnComplete: 100,           // keep last 100 completed jobs
  removeOnFail: 50,                // keep last 50 failed jobs
});

// ─── worker.ts ───
const emailWorker = new Worker("emails", async (job: Job) => {
  console.log(`Processing job ${job.id}: ${job.name}`);
  const { to, subject, body } = job.data;
  
  // Update progress
  await job.updateProgress(50);
  
  // Send email
  await sendEmail(to, subject, body);
  
  await job.updateProgress(100);
  return { sent: true };
}, {
  connection,
  concurrency: 5,                  // process 5 jobs concurrently
  limiter: { max: 10, duration: 1000 },  // max 10 jobs per second
});

emailWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
emailWorker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));
```

---

# 19. WebSockets

## ▶ Server (Node.js + ws)

```typescript
// ─── ws-server.ts ───
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8080 });

// Track connected clients by user ID
const clients = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  // Authenticate via query param token
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  
  let userId: string;
  try {
    const payload = jwt.verify(token!, process.env.JWT_SECRET!) as { sub: string };
    userId = payload.sub;
  } catch {
    ws.close(4001, "Unauthorized");
    return;
  }

  // Register client
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ws);
  console.log(`User ${userId} connected. Total: ${wss.clients.size}`);

  // Handle incoming messages
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(userId, msg);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });

  // Cleanup on disconnect
  ws.on("close", () => {
    clients.get(userId)?.delete(ws);
    if (clients.get(userId)?.size === 0) clients.delete(userId);
  });

  // Heartbeat to detect dead connections
  ws.on("pong", () => { (ws as any).isAlive = true; });
  (ws as any).isAlive = true;
});

// Ping all clients every 30 seconds to detect dead connections
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!(ws as any).isAlive) return ws.terminate();
    (ws as any).isAlive = false;
    ws.ping();
  });
}, 30000);

// Send to specific user (across multiple tabs/devices)
function sendToUser(userId: string, data: object) {
  clients.get(userId)?.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

// Broadcast to all connected clients
function broadcast(data: object) {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}
```

## ▶ Client (React)

```typescript
// ─── hooks/useWebSocket.ts ───
import { useEffect, useRef, useCallback, useState } from "react";

interface UseWSOptions {
  url: string;
  token: string;
  onMessage: (data: any) => void;
  reconnectInterval?: number;
}

export function useWebSocket({ url, token, onMessage, reconnectInterval = 3000 }: UseWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      if (event.code !== 4001) {  // don't reconnect if auth failed
        reconnectTimer.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [url, token, onMessage, reconnectInterval]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}

// Usage:
// const { connected, send } = useWebSocket({
//   url: "ws://localhost:8080",
//   token: authToken,
//   onMessage: (data) => { /* handle incoming messages */ },
// });
```

---

# 20. Security

## ▶ Hashing & Password Storage

```python
# ─── PASSWORD HASHING (Python) ───
# NEVER store plain text passwords. Use bcrypt or argon2.
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password with bcrypt (auto-generates salt)."""
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds is a good default
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
```

```typescript
// ─── PASSWORD HASHING (Node.js) ───
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## ▶ JWT Best Practices

```
JWT SECURITY CHECKLIST:
✅ Use short-lived access tokens (15 min max)
✅ Use refresh tokens stored in httpOnly cookies (not localStorage)
✅ Use RS256 (asymmetric) for distributed systems, HS256 for single server
✅ Include iat (issued at), exp (expiry), iss (issuer) claims
✅ Rotate signing keys periodically
✅ Blacklist refresh tokens on logout
✅ Never store sensitive data in JWT payload (it's base64, not encrypted)
❌ Don't use JWT for sessions if you need immediate revocation
❌ Don't put JWTs in URL query parameters (logged in server logs)
❌ Don't use "none" algorithm
```

```typescript
// ─── SECURE JWT SETUP ───
import jwt from "jsonwebtoken";

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { sub: userId, role, type: "access" },
    process.env.JWT_SECRET!,
    { expiresIn: "15m", issuer: "myapp" }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET!,   // different secret for refresh tokens
    { expiresIn: "7d", issuer: "myapp" }
  );

  return { accessToken, refreshToken };
}
```

## ▶ CSRF, XSS & SQL Injection Prevention

```
CSRF PREVENTION:
• Use SameSite=Strict or SameSite=Lax cookies
• Include CSRF tokens in forms (Django has {% csrf_token %} built-in)
• Verify Origin/Referer headers on state-changing requests
• Don't rely solely on cookies for auth in APIs (use Bearer tokens)

XSS PREVENTION:
• Sanitize/escape all user input before rendering in HTML
• Use Content-Security-Policy headers
• React auto-escapes by default — but dangerouslySetInnerHTML bypasses it!
• Use httpOnly cookies for tokens (JavaScript can't read them)
• Validate and sanitize on the SERVER, not just the client

SQL INJECTION PREVENTION:
• ALWAYS use parameterized queries / prepared statements
• NEVER concatenate user input into SQL strings
• Use an ORM (Django ORM, SQLAlchemy, Prisma) — they use parameterized queries
• Validate input types before they reach the query layer
```

```python
# ─── XSS: input sanitization ───
import bleach  # pip install bleach

def sanitize_html(user_input: str) -> str:
    """Allow only safe HTML tags, strip everything else."""
    return bleach.clean(
        user_input,
        tags=["b", "i", "u", "a", "p", "br", "ul", "ol", "li"],
        attributes={"a": ["href", "title"]},
        strip=True,
    )
```

## ▶ Secure File Upload Checklist

```
SECURE FILE UPLOAD CHECKLIST:
✅ Validate file type by content (magic bytes), NOT just extension
✅ Limit file size (server-side, not just client-side)
✅ Generate random filenames (prevent path traversal)
✅ Store outside web root (or use signed URLs for access)
✅ Scan for malware (ClamAV or cloud service)
✅ Strip EXIF data from images (privacy)
✅ Serve uploads from a different domain (prevent XSS)
✅ Set Content-Disposition: attachment (prevent inline execution)
✅ Re-encode images (destroys steganographic payloads)
✅ Rate limit uploads per user
❌ Don't trust Content-Type header (can be spoofed)
❌ Don't allow .php, .jsp, .asp, .exe extensions
❌ Don't serve user uploads with execute permissions
```

---

# 21. System Design Templates

## ▶ Marketplace Architecture

```
MARKETPLACE SYSTEM DESIGN (e.g. Etsy, eBay, RevSync Marketplace)

┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client    │────▶│  API Gateway │────▶│ Auth Service │
│  (Web/App)  │     │  (rate limit │     │   (JWT)      │
└─────────────┘     │   routing)   │     └──────────────┘
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌──────────┐ ┌──────────────┐
     │  Product   │ │  Order   │ │   Payment    │
     │  Service   │ │  Service │ │   Service    │
     └─────┬──────┘ └────┬─────┘ └──────┬───────┘
           │              │              │
     ┌─────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
     │ PostgreSQL │ │ PostgreSQL│ │   Stripe     │
     │ (products) │ │ (orders)  │ │   Webhook    │
     └────────────┘ └──────────┘ └──────────────┘
           │
     ┌─────▼──────┐     ┌──────────────┐
     │   Redis    │     │  S3 / CDN    │
     │  (cache +  │     │  (images,    │
     │  sessions) │     │   assets)    │
     └────────────┘     └──────────────┘

KEY DECISIONS:
• Auth: JWT access tokens (15m) + refresh tokens (7d) in httpOnly cookies
• Product search: Elasticsearch or PostgreSQL full-text search (GIN index)
• File uploads: presigned S3 URLs (client uploads directly to S3)
• Payments: Stripe webhooks for payment confirmation (never trust client-side)
• Caching: Redis cache for product listings, invalidate on write
• Background: Celery/BullMQ for email, image processing, search indexing
• DB: PostgreSQL with read replicas for scale
```

## ▶ File Upload Pipeline (Quarantine → Validate → Sign)

```
FILE UPLOAD SECURITY PIPELINE

User uploads file
        │
        ▼
┌───────────────────┐
│ 1. QUARANTINE     │  ← File goes to temp/quarantine S3 bucket
│    - Random name  │    (NOT the public bucket)
│    - Size check   │
│    - Type check   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 2. VALIDATE       │  ← Background job (Celery/BullMQ)
│    - Magic bytes  │    Check actual file content, not just extension
│    - Malware scan │    ClamAV or cloud antivirus
│    - Image re-enc │    Re-encode images (strips steganography)
│    - Strip EXIF   │    Remove GPS, camera info
│    - Custom rules │    e.g. max resolution, min quality
└────────┬──────────┘
         │
    ┌────┴────┐
    │ PASS?   │
    ├── NO ──▶ Delete from quarantine, notify user, log incident
    │
    ├── YES
    ▼
┌───────────────────┐
│ 3. PROMOTE        │  ← Move from quarantine to production bucket
│    - New path     │    e.g. /uploads/{uuid}/{hash}.{ext}
│    - Set ACL      │    Private by default
│    - Record in DB │    Store metadata, original name, hash
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 4. SERVE          │  ← Generate presigned URLs (time-limited access)
│    - Sign URL     │    Never expose raw S3 paths
│    - CDN cache    │    CloudFront for global delivery
│    - Log access   │    Audit trail
└───────────────────┘
```

---

# 22. Project Layouts

## ▶ Django + DRF API

```
django-api/
├── config/                    # Project-level configuration
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py           # Shared settings
│   │   ├── development.py    # Dev overrides (DEBUG=True)
│   │   └── production.py     # Prod overrides (security, caching)
│   ├── urls.py               # Root URL config
│   ├── wsgi.py               # WSGI entry point (gunicorn)
│   └── asgi.py               # ASGI entry point (daphne/uvicorn)
├── apps/
│   ├── users/                # Each app is a self-contained module
│   │   ├── __init__.py
│   │   ├── models.py         # User model, Profile
│   │   ├── serializers.py    # DRF serializers
│   │   ├── views.py          # ViewSets / API views
│   │   ├── urls.py           # App-level URL patterns
│   │   ├── permissions.py    # Custom permissions
│   │   ├── signals.py        # Post-save signals etc.
│   │   ├── tasks.py          # Celery tasks
│   │   ├── admin.py          # Django admin config
│   │   └── tests/
│   │       ├── test_models.py
│   │       ├── test_views.py
│   │       └── test_serializers.py
│   └── products/             # Another app (same structure)
│       ├── ...
├── core/                      # Shared utilities
│   ├── exceptions.py          # Custom exception handler
│   ├── pagination.py          # Custom pagination classes
│   ├── middleware.py          # Request logging, timing
│   └── utils.py               # Shared helper functions
├── requirements/
│   ├── base.txt               # Shared deps
│   ├── development.txt        # Dev deps (debug toolbar, etc.)
│   └── production.txt         # Prod deps (gunicorn, sentry)
├── manage.py
├── Dockerfile
├── docker-compose.yml
├── .env.example               # Template for env vars
├── .gitignore
└── README.md
```

## ▶ Node + TypeScript API

```
node-ts-api/
├── src/
│   ├── index.ts               # Entry point: starts server
│   ├── app.ts                 # Express app setup (middleware, routes)
│   ├── config/
│   │   ├── index.ts           # Load env vars, validate config
│   │   └── database.ts        # DB connection pool
│   ├── routes/
│   │   ├── index.ts           # Combines all routers
│   │   ├── auth.ts            # POST /login, /register, /refresh
│   │   └── products.ts        # CRUD /products
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── validate.ts        # Zod schema validation
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── upload.ts          # Multer config
│   ├── schemas/               # Zod schemas (single source of truth for types)
│   │   ├── auth.ts
│   │   └── product.ts
│   ├── services/              # Business logic (not in routes!)
│   │   ├── authService.ts
│   │   └── productService.ts
│   ├── models/                # DB models / queries
│   │   ├── user.ts
│   │   └── product.ts
│   ├── utils/
│   │   ├── logger.ts          # Winston / Pino logger
│   │   └── helpers.ts
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── tests/
│   ├── setup.ts               # Test DB setup/teardown
│   ├── auth.test.ts
│   └── products.test.ts
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## ▶ React Web App

```
react-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── index.tsx               # ReactDOM.render entry point
│   ├── App.tsx                 # Root component, routing
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Buttons, inputs, modals (design system)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/             # Page layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── features/           # Feature-specific components
│   │       ├── ProductCard.tsx
│   │       └── ProductForm.tsx
│   ├── pages/                  # Route-level components
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   └── Login.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useFetch.ts
│   │   ├── useAuth.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── services/               # API calls
│   │   ├── api.ts              # Axios/fetch client with interceptors
│   │   ├── authService.ts
│   │   └── productService.ts
│   ├── context/                # React Context providers
│   │   └── AuthContext.tsx
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       ├── globals.css
│       └── variables.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts              # or next.config.js
└── .gitignore
```

## ▶ React Native Expo App

```
expo-app/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout (providers, nav container)
│   ├── index.tsx               # Home screen (/)
│   ├── (auth)/                 # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/                 # Tab navigator (authenticated)
│       ├── _layout.tsx         # Tab bar config
│       ├── home.tsx
│       ├── products.tsx
│       ├── profile.tsx
│       └── products/
│           └── [id].tsx        # Dynamic route: /products/123
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── features/           # Feature-specific components
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useColorScheme.ts
│   ├── services/
│   │   ├── api.ts              # API client (fetch wrapper)
│   │   └── secureStorage.ts    # expo-secure-store wrapper
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── helpers.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json                    # Expo configuration
├── package.json
├── tsconfig.json
├── .env.example
├── eas.json                    # EAS Build config
└── .gitignore
```

---

# 23. Checklists

## ▶ API Endpoint Checklist

```
FOR EVERY API ENDPOINT, VERIFY:

INPUT VALIDATION
□ All required fields validated (Zod, DRF serializer, etc.)
□ Field types checked (string, number, email format, etc.)
□ String lengths limited (max_length)
□ Numeric ranges checked (positive price, valid age)
□ Enum values validated (category ∈ allowed list)
□ Nested objects validated recursively
□ File uploads: type, size, content validated

AUTHENTICATION & AUTHORIZATION
□ Endpoint requires auth (or explicitly public)
□ User can only access/modify their own resources
□ Admin-only endpoints check role
□ Rate limiting applied

ERROR HANDLING
□ Returns proper HTTP status codes:
  • 200 OK — successful GET, PUT, PATCH
  • 201 Created — successful POST
  • 204 No Content — successful DELETE
  • 400 Bad Request — validation error
  • 401 Unauthorized — no/invalid token
  • 403 Forbidden — valid token, insufficient permissions
  • 404 Not Found — resource doesn't exist
  • 409 Conflict — duplicate (email already exists)
  • 422 Unprocessable — semantic error
  • 429 Too Many Requests — rate limited
  • 500 Internal Server Error — unhandled error
□ Error responses follow consistent envelope format
□ Validation errors include field names
□ No stack traces in production error responses

RESPONSE FORMAT
□ Consistent envelope: { ok, data, error, meta? }
□ Pagination metadata included (page, total, hasMore)
□ Sensitive fields excluded (password_hash, tokens)
□ Date/time in ISO 8601 format (2026-03-10T14:01:27Z)

DATABASE
□ N+1 queries avoided (use select_related/prefetch_related or JOINs)
□ Queries use indexes
□ Transactions for multi-step operations
□ Soft delete where appropriate (is_active flag)

OTHER
□ Tested with valid data
□ Tested with invalid data
□ Tested with no auth
□ Tested with wrong user's auth
□ OpenAPI/Swagger documented
```

## ▶ Security Checklist

```
SECURITY CHECKLIST (before every deploy):

AUTHENTICATION
□ Passwords hashed with bcrypt/argon2 (12+ rounds)
□ JWT access tokens short-lived (≤15 min)
□ Refresh tokens stored in httpOnly cookies
□ Refresh tokens rotated on use
□ Logout invalidates/blacklists tokens
□ Account lockout after N failed login attempts
□ Password strength requirements enforced

INPUT & OUTPUT
□ All inputs validated server-side (not just client)
□ SQL queries parameterized (no string concatenation)
□ HTML output escaped (XSS prevention)
□ File uploads validated by content, not just extension
□ JSON responses don't leak internal details

HEADERS & TRANSPORT
□ HTTPS enforced (HSTS header)
□ CORS restricted to known origins
□ Security headers set (X-Content-Type-Options, X-Frame-Options, CSP)
□ Cookies: Secure, HttpOnly, SameSite=Strict

INFRASTRUCTURE
□ Environment variables for secrets (never in code)
□ .env files in .gitignore
□ Docker containers run as non-root
□ Database not exposed to public internet
□ Dependencies audited (npm audit, pip audit)
□ Error pages don't show stack traces in production
□ Logging captures security events (failed logins, permission denials)
```

## ▶ Deploy Checklist

```
DEPLOY CHECKLIST:

PRE-DEPLOY
□ All tests pass (unit, integration, e2e)
□ Linting clean, no TypeScript errors
□ .env.production has all required variables
□ Database migrations tested on staging
□ Dependencies locked (package-lock.json / requirements.txt)
□ Docker image builds successfully
□ No hardcoded secrets in code

DATABASE
□ Migrations reviewed (no data loss, backward compatible)
□ Migration tested on copy of production data
□ Backup taken before migration
□ Rollback plan documented

DOCKER & CI
□ Docker image tagged with commit hash (not just "latest")
□ Health check endpoint works (/health)
□ CI pipeline passes (lint → test → build → deploy)
□ Smoke test after deploy

POST-DEPLOY
□ Verify health check endpoint responds
□ Check error monitoring (Sentry/CloudWatch)
□ Verify critical user flows work
□ Monitor error rates for 15 minutes
□ Rollback if error rate spikes
```

## ▶ Debugging Checklist

```
DEBUGGING CHECKLIST (when something breaks):

GATHER INFO
□ What changed? (git log -5, recent deploys)
□ When did it start? (logs, monitoring)
□ Who is affected? (all users, specific users, specific routes)
□ What's the error? (exact message, status code, stack trace)

COMMON COMMANDS
# Server logs
docker compose logs api --tail 200 -f
kubectl logs <pod> --tail 200 -f
journalctl -u myapp -n 200 -f

# Database
SELECT * FROM pg_stat_activity;        -- active connections
SELECT * FROM pg_locks;                 -- lock contention
EXPLAIN ANALYZE <slow query>;           -- query performance

# Network
curl -v http://localhost:3000/health    -- test endpoint
netstat -tlnp                           -- open ports
ss -tlnp                                -- same, modern syntax

# Docker
docker stats                            -- resource usage
docker exec -it <container> sh          -- shell into container
docker inspect <container>              -- full config

# Node.js
node --inspect src/index.ts             -- debugger
DEBUG=express:* node src/index.ts       -- verbose Express logging

# Python/Django
python manage.py shell                  -- interactive Django shell
python manage.py dbshell                -- direct DB shell

SYSTEMATIC APPROACH
1. Reproduce: can you make it happen consistently?
2. Isolate: which component is failing? (frontend? API? DB? network?)
3. Hypothesize: what could cause this? (code change? data? infra?)
4. Test: verify your hypothesis with minimal changes
5. Fix: make the smallest change that resolves the issue
6. Verify: confirm the fix doesn't break anything else
7. Document: add a comment explaining why (not what) you fixed
```

---

# 24. Common Snippets

## ▶ Standard Response Envelope

```typescript
// ─── STANDARD API RESPONSE FORMAT ───
// Use this EVERYWHERE for consistency

interface ApiResponse<T> {
  ok: boolean;           // quick check: did it work?
  data: T | null;        // the actual payload
  error: string | null;  // human-readable error message
  meta?: {               // pagination/extra info
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// Success
{ ok: true, data: { id: 1, name: "Widget" }, error: null }

// Error
{ ok: false, data: null, error: "Product not found" }

// Paginated
{
  ok: true,
  data: [{ id: 1, name: "Widget" }, ...],
  error: null,
  meta: { page: 1, limit: 20, total: 153, hasMore: true }
}
```

## ▶ Pagination Pattern (Reusable)

```typescript
// ─── CURSOR-BASED PAGINATION (best for feeds) ───
// Avoids the "offset drift" problem when new items are inserted

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;  // null = no more pages
  hasMore: boolean;
}

async function getProducts(cursor?: string, limit = 20): Promise<CursorPage<Product>> {
  let query = `SELECT * FROM products WHERE is_active = true`;
  const params: any[] = [];

  if (cursor) {
    // cursor = base64-encoded "created_at,id" of last item
    const [createdAt, id] = Buffer.from(cursor, "base64").toString().split(",");
    query += ` AND (created_at, id) < ($1, $2)`;
    params.push(createdAt, id);
  }

  query += ` ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1}`;
  params.push(limit + 1);  // fetch one extra to check if there's more

  const rows = await db.query(query, params);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  const lastItem = items[items.length - 1];
  const nextCursor = hasMore
    ? Buffer.from(`${lastItem.created_at},${lastItem.id}`).toString("base64")
    : null;

  return { items, nextCursor, hasMore };
}
```

## ▶ Retry with Exponential Backoff

```typescript
// ─── GENERIC RETRY FUNCTION ───
async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, shouldRetry = () => true } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !shouldRetry(error as Error)) throw error;

      const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
      const jitter = delay * 0.1 * Math.random();  // add randomness to prevent thundering herd
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  throw new Error("Unreachable");
}

// Usage:
const data = await retry(() => fetch("/api/flaky-endpoint").then(r => r.json()), {
  maxRetries: 5,
  shouldRetry: (err) => !err.message.includes("401"),  // don't retry auth errors
});
```

## ▶ Rate Limiting Middleware

```typescript
// ─── IN-MEMORY RATE LIMITER (simple, for single-server) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ ok: false, error: "Too many requests" });
    }

    entry.count++;
    next();
  };
}

// Usage: app.use("/api/", rateLimit(100, 15 * 60 * 1000));
```

## ▶ Caching Middleware

```typescript
// ─── SIMPLE IN-MEMORY CACHE MIDDLEWARE ───
const cache = new Map<string, { data: any; expiresAt: number }>();

function cacheMiddleware(ttlSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();  // only cache GETs

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      return res.json(cached.data);  // serve from cache
    }

    // Override res.json to capture the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(key, { data: body, expiresAt: Date.now() + ttlSeconds * 1000 });
      return originalJson(body);
    };

    next();
  };
}

// Usage: router.get("/products", cacheMiddleware(60), listProducts);
```

## ▶ Logging Pattern

```typescript
// ─── STRUCTURED LOGGING (production-grade) ───
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,  // JSON in production (for log aggregators)
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, ip: req.ip }),
    err: pino.stdSerializers.err,
  },
});

// Usage:
logger.info({ userId: "123", action: "login" }, "User logged in");
logger.warn({ productId: "456", stock: 2 }, "Low stock warning");
logger.error({ err, requestId: req.id }, "Payment processing failed");

// Express middleware
import pinoHttp from "pino-http";
app.use(pinoHttp({ logger }));
```

```python
# ─── PYTHON LOGGING (Django/Flask) ───
import logging
import json

# Structured JSON formatter for production
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        return json.dumps(log_data)

# Setup
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("myapp")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("User logged in", extra={"extra_data": {"user_id": 123, "ip": "1.2.3.4"}})
```

## ▶ Transaction Pattern

```typescript
// ─── DATABASE TRANSACTION WRAPPER (Node.js + pg) ───
import { Pool, PoolClient } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Usage:
const order = await withTransaction(async (client) => {
  // All queries use the same client (same transaction)
  const order = await client.query(
    "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *",
    [userId, total]
  );
  
  await client.query(
    "UPDATE products SET stock = stock - $1 WHERE id = $2",
    [quantity, productId]
  );
  
  await client.query(
    "INSERT INTO order_items (order_id, product_id, qty) VALUES ($1, $2, $3)",
    [order.rows[0].id, productId, quantity]
  );
  
  return order.rows[0];
});
```

```python
# ─── DJANGO TRANSACTION ───
from django.db import transaction

# Decorator: entire function is atomic
@transaction.atomic
def create_order(user, product, quantity):
    order = Order.objects.create(user=user, total=product.price * quantity)
    OrderItem.objects.create(order=order, product=product, quantity=quantity)
    product.stock -= quantity
    product.save()
    return order

# Context manager: more granular control
def transfer_funds(from_account, to_account, amount):
    try:
        with transaction.atomic():
            from_account.balance -= amount
            from_account.save()
            if from_account.balance < 0:
                raise ValueError("Insufficient funds")  # triggers rollback
            to_account.balance += amount
            to_account.save()
    except ValueError as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True}
```

## ▶ File Upload Pattern (Full Stack)

```typescript
// ─── FRONTEND: Upload with progress ───
async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string }> {
  // 1. Get presigned URL from your API
  const { uploadUrl, fileKey } = await api.post("/uploads/presign", {
    filename: file.name,
    contentType: file.type,
  });

  // 2. Upload directly to S3 (bypasses your server)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });

  // 3. Confirm upload with your API
  const result = await api.post("/uploads/confirm", { fileKey });
  return result;
}
```

---

> **End of Amzat's Master Coding Cheat Sheet**
> Total: 24 sections covering Python, Django+DRF, Flask, JavaScript, TypeScript, Node.js, Express, React, React Native, SQL/PostgreSQL, Docker, Git, CI/CD, AWS, Kubernetes, Java, PHP, MATLAB, Redis, Background Jobs, WebSockets, Security, System Design, Project Layouts, Checklists, and Common Snippets.
> **Last updated:** March 2026
