"""Udyam Digital API - CSV-backed prototype."""

from __future__ import annotations

import csv
import json
import re
import sqlite3
import uuid

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "udyam_digital.db"

load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# CSV DATA LOADING
# --------------------------------------------------

def read_csv(filename: str) -> list[dict[str, str]]:
    path = DATA_DIR / filename

    if not path.exists():
        raise RuntimeError(f"Required dataset not found: {path}")

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


PRODUCTS = read_csv("product_catalogue.csv")
GSTIN_ROWS = read_csv("mock_gstin_registry.csv")
UDYAM_ROWS = read_csv("mock_udyam_registry.csv")
LEAD_ROWS = read_csv("smb_leads.csv")

PRODUCT_BY_ID = {
    p["product_id"].strip().upper(): p
    for p in PRODUCTS
}

GSTIN_BY_ID = {
    r["gstin"].strip().upper(): r
    for r in GSTIN_ROWS
}

UDYAM_BY_ID = {
    r["udyam_number"].strip().upper(): r
    for r in UDYAM_ROWS
}


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="Udyam Digital API",
    description="Airtel SYNC 2026 - Project Udyam Digital",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:

        conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                order_id TEXT PRIMARY KEY,
                business_name TEXT NOT NULL,
                contact_name TEXT,
                phone TEXT,
                email TEXT,
                status TEXT NOT NULL,
                product_ids TEXT NOT NULL,
                quote_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS order_events (
                event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                status TEXT NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(order_id)
            )
        """)


@app.on_event("startup")
def startup():
    init_db()


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class RecommendRequest(BaseModel):
    business_type: str = "Other"
    city_tier: int = Field(default=1, ge=1, le=3)
    employees: int = Field(default=1, ge=1)
    sites: int = Field(default=1, ge=1)
    gstin_verified: bool = False
    needs: list[str] = Field(default_factory=list)
    quantities: dict[str, int] = Field(default_factory=dict)


class QuoteRequest(BaseModel):
    product_ids: list[str] = Field(min_length=1)
    quantities: dict[str, int] = Field(default_factory=dict)


class OrderRequest(BaseModel):
    business_name: str = Field(min_length=2, max_length=150)
    product_ids: list[str] = Field(min_length=1)
    quantities: dict[str, int] = Field(default_factory=dict)
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None


# --------------------------------------------------
# BUSINESS NEED KEYWORDS
# --------------------------------------------------

NEED_TERMS = {
    "internet": [
        "fibre", "airfiber", "leased line",
        "failover", "sd-wan"
    ],
    "connectivity": [
        "fibre", "airfiber", "leased line",
        "postpaid", "failover", "sd-wan", "static ip"
    ],
    "wi-fi": ["wi-fi", "wifi"],
    "wifi": ["wi-fi", "wifi"],
    "cctv": ["cctv"],
    "cloud": ["cloud", "website", "backup"],
    "security": ["security", "firewall", "antivirus", "wi-fi"],
    "communication": ["telephony", "toll-free", "sms", "whatsapp"],
    "pos": ["pos"],
    "iot": ["iot", "fleet", "machine"],
    "mobile": ["postpaid"],
    "website": ["website"],
    "email": ["email", "office suite"],
}


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def split_values(value: str, separator: str = ";") -> set[str]:
    return {
        part.strip().lower()
        for part in (value or "").split(separator)
        if part.strip()
    }


def public_product(row: dict[str, str]) -> dict[str, Any]:
    return {
        "product_id": row["product_id"],
        "category": row["category"],
        "product_name": row["product_name"],
        "description": row["description"],
        "unit": row["unit"],

        "price_min_inr_per_month": int(
            float(row["price_min_inr_per_month"])
        ),

        "price_max_inr_per_month": int(
            float(row["price_max_inr_per_month"])
        ),

        "one_time_setup_inr": int(
            float(row["one_time_setup_inr"])
        ),

        "min_contract_months": int(
            float(row["min_contract_months"])
        ),

        "available_city_tiers": sorted(
            int(x)
            for x in split_values(row["available_city_tiers"])
        ),

        "min_employees": int(float(row["min_employees"])),
        "min_sites": int(float(row["min_sites"])),

        "requires_gstin": (
            row["requires_gstin"].strip().upper() == "Y"
        ),

        "requires_one_of": [
            x.strip()
            for x in (row["requires_one_of"] or "").split("|")
            if x.strip()
        ],

        "typical_install_days": int(
            float(row["typical_install_days"])
        ),

        "target_segments": sorted(
            split_values(row["target_segments"])
        ),
    }


def eligibility_reasons(
    product: dict[str, str],
    req: RecommendRequest,
    selected_ids: set[str],
) -> list[str]:

    reasons = []

    tiers = {
        int(x)
        for x in split_values(product["available_city_tiers"])
    }

    if req.city_tier not in tiers:
        reasons.append(
            "Not available in the selected city tier"
        )

    if req.employees < int(float(product["min_employees"])):
        reasons.append(
            f"Requires at least {product['min_employees']} employees"
        )

    if req.sites < int(float(product["min_sites"])):
        reasons.append(
            f"Requires at least {product['min_sites']} site(s)"
        )

    if (
        product["requires_gstin"].strip().upper() == "Y"
        and not req.gstin_verified
    ):
        reasons.append("Requires a verified GSTIN")

    dependencies = {
        x.strip()
        for x in (product["requires_one_of"] or "").split("|")
        if x.strip()
    }

    if dependencies and not dependencies.intersection(selected_ids):

        names = [
            PRODUCT_BY_ID[x]["product_name"]
            for x in dependencies
            if x in PRODUCT_BY_ID
        ]

        reasons.append(
            "Requires at least one of: " + ", ".join(names)
        )

    return reasons


# --------------------------------------------------
# QUOTATION ENGINE
# --------------------------------------------------

def get_quote(
    product_ids: list[str],
    quantities: dict[str, int],
) -> dict[str, Any]:

    normalized_ids = [
        pid.strip().upper()
        for pid in product_ids
    ]

    unknown = sorted(
        set(normalized_ids) - set(PRODUCT_BY_ID)
    )

    if unknown:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown product IDs: {', '.join(unknown)}",
        )

    line_items = []

    low_total = 0
    high_total = 0
    setup_total = 0
    contract_months = 0
    install_days = 0

    for pid in dict.fromkeys(normalized_ids):

        product = PRODUCT_BY_ID[pid]

        quantity = int(quantities.get(pid, 1))

        if quantity < 1 or quantity > 1000:
            raise HTTPException(
                status_code=422,
                detail=f"Quantity for {pid} must be between 1 and 1000",
            )

        low = int(float(product["price_min_inr_per_month"])) * quantity
        high = int(float(product["price_max_inr_per_month"])) * quantity
        setup = int(float(product["one_time_setup_inr"])) * quantity

        low_total += low
        high_total += high
        setup_total += setup

        contract_months = max(
            contract_months,
            int(float(product["min_contract_months"])),
        )

        install_days = max(
            install_days,
            int(float(product["typical_install_days"])),
        )

        line_items.append({
            "product_id": pid,
            "product_name": product["product_name"],
            "unit": product["unit"],
            "quantity": quantity,
            "monthly_min_inr": low,
            "monthly_max_inr": high,
            "setup_fee_inr": setup,
        })

    return {
        "currency": "INR",
        "line_items": line_items,
        "monthly_total_min_inr": low_total,
        "monthly_total_max_inr": high_total,
        "one_time_setup_total_inr": setup_total,
        "minimum_contract_months": contract_months,
        "estimated_install_days": install_days,
        "disclaimer": (
            "Indicative estimate from the supplied synthetic catalogue. "
            "Taxes and unlisted charges are not included."
        ),
    }


# --------------------------------------------------
# BASIC ROUTES
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to Udyam Digital API",
        "status": "running",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "datasets": {
            "products": len(PRODUCTS),
            "gstin_records": len(GSTIN_ROWS),
            "udyam_records": len(UDYAM_ROWS),
            "leads": len(LEAD_ROWS),
        },
    }


# --------------------------------------------------
# PRODUCT CATALOGUE
# --------------------------------------------------

@app.get("/products")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
):

    rows = PRODUCTS

    if category:
        rows = [
            p for p in rows
            if p["category"].lower() == category.lower()
        ]

    if search:
        term = search.lower()

        rows = [
            p for p in rows
            if term in (
                p["product_name"]
                + " "
                + p["description"]
                + " "
                + p["category"]
            ).lower()
        ]

    return {
        "count": len(rows),
        "products": [
            public_product(p)
            for p in rows
        ],
    }


@app.get("/products/{product_id}")
def product_detail(product_id: str):

    product = PRODUCT_BY_ID.get(product_id.upper())

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return public_product(product)


# --------------------------------------------------
# PRODUCT RECOMMENDATIONS
# --------------------------------------------------

@app.post("/recommendations")
def recommendations(req: RecommendRequest):

    requested = [
        need.lower().strip()
        for need in req.needs
    ]

    selected_ids = set()

    for product in PRODUCTS:

        product_name = product["product_name"].lower()
        description = product["description"].lower()

        for need in requested:

            terms = NEED_TERMS.get(need, [need])

            if any(
                term in product_name or term in description
                for term in terms
            ):
                selected_ids.add(product["product_id"])

    business = req.business_type.lower()

    segment = None

    if any(
        word in business
        for word in [
            "retail", "shop", "salon",
            "pharmacy", "restaurant", "hospitality"
        ]
    ):
        segment = "micro"

    elif "manufactur" in business:
        segment = "mfg"

    elif any(
        word in business
        for word in [
            "office", "clinic", "health",
            "professional", "coaching"
        ]
    ):
        segment = "prof"

    elif any(
        word in business
        for word in ["multi", "chain"]
    ):
        segment = "multi"

    if segment:

        for product in PRODUCTS:

            target_segments = split_values(
                product["target_segments"]
            )

            if (
                segment in target_segments
                and product["category"] in {
                    "Connectivity",
                    "Cloud & Productivity",
                }
            ):
                selected_ids.add(product["product_id"])

    results = []

    for product in PRODUCTS:

        if selected_ids and product["product_id"] not in selected_ids:
            continue

        reasons = eligibility_reasons(
            product,
            req,
            selected_ids,
        )

        item = public_product(product)

        item["eligible"] = not reasons
        item["ineligibility_reasons"] = reasons

        if not reasons:
            item["recommendation_reason"] = (
                f"Matches your {req.business_type.lower()} profile "
                "and selected business requirements."
            )

        results.append(item)

    results.sort(
        key=lambda item: (
            not item["eligible"],
            item["price_min_inr_per_month"],
        )
    )

    return {
        "business_profile": req.model_dump(),
        "count": len(results),
        "recommendations": results,
        "note": (
            "Recommendations use the supplied synthetic product "
            "catalogue. Required product dependencies must be included."
        ),
    }


# --------------------------------------------------
# QUOTES
# --------------------------------------------------

@app.post("/quotes")
def create_quote(req: QuoteRequest):
    return get_quote(
        req.product_ids,
        req.quantities,
    )


# --------------------------------------------------
# GSTIN VERIFICATION
# --------------------------------------------------

@app.get("/verify/gstin/{gstin}")
def verify_gstin(gstin: str):

    key = gstin.strip().upper()

    # Synthetic dataset intentionally permits X
    # in the PAN entity-type position.

    pattern = r"[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]"

    if not re.fullmatch(pattern, key):
        raise HTTPException(
            status_code=400,
            detail="GSTIN format is invalid",
        )

    row = GSTIN_BY_ID.get(key)

    if not row:
        return {
            "found": False,
            "verified": False,
            "gstin": key,
            "message": "No match in the synthetic GSTIN registry.",
        }

    active = row["status"].strip().lower() == "active"

    return {
        "found": True,
        "verified": active,
        "gstin": key,
        "legal_name": row["legal_name"],
        "trade_name": row["trade_name"],
        "constitution": row["constitution"],
        "principal_place_of_business": row[
            "principal_place_of_business"
        ],
        "state": row["state"],
        "registration_date": row["registration_date"],
        "status": row["status"],
        "message": (
            "Matched against the synthetic registry. "
            "This is not a live government verification."
        ),
    }


# --------------------------------------------------
# UDYAM VERIFICATION
# --------------------------------------------------

@app.get("/verify/udyam/{udyam_number}")
def verify_udyam(udyam_number: str):

    key = udyam_number.strip().upper()

    pattern = r"UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}"

    if not re.fullmatch(pattern, key):
        raise HTTPException(
            status_code=400,
            detail="Udyam number format is invalid",
        )

    row = UDYAM_BY_ID.get(key)

    if not row:
        return {
            "found": False,
            "verified": False,
            "udyam_number": key,
            "message": "No match in the synthetic Udyam registry.",
        }

    return {
        "found": True,
        "verified": True,
        **row,
        "message": (
            "Matched against the synthetic registry. "
            "District code 00 is mock data, not live government verification."
        ),
    }


# --------------------------------------------------
# ADMIN ANALYTICS
# --------------------------------------------------

@app.get("/analytics/overview")
def analytics_overview():

    stages = {}

    for lead in LEAD_ROWS:

        stage = (
            lead.get("funnel_stage") or "Unknown"
        ).strip()

        stages[stage] = stages.get(stage, 0) + 1

    activated = sum(
        1
        for lead in LEAD_ROWS
        if (
            lead.get("funnel_stage") or ""
        ).strip().lower() == "activated"
    )

    return {
        "total_leads": len(LEAD_ROWS),
        "funnel_stages": stages,
        "activated_leads": activated,
        "data_note": (
            "Aggregated from the supplied synthetic SMB leads dataset."
        ),
    }


# --------------------------------------------------
# ORDER CREATION
# --------------------------------------------------

@app.post("/orders", status_code=201)
def create_order(req: OrderRequest):

    quote = get_quote(
        req.product_ids,
        req.quantities,
    )

    order_id = "UDY-" + uuid.uuid4().hex[:10].upper()

    now = datetime.now(timezone.utc).isoformat()

    initial_status = "Application received"

    with db() as conn:

        conn.execute(
            """
            INSERT INTO orders
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                req.business_name,
                req.contact_name,
                req.phone,
                req.email,
                initial_status,
                json.dumps(list(dict.fromkeys(
                    pid.upper() for pid in req.product_ids
                ))),
                json.dumps(quote),
                now,
                now,
            ),
        )

        conn.execute(
            """
            INSERT INTO order_events
            (order_id, status, note, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                order_id,
                initial_status,
                "Your application has been received.",
                now,
            ),
        )

    return {
        "order_id": order_id,
        "status": initial_status,
        "quote": quote,
        "created_at": now,
    }


# --------------------------------------------------
# ORDER TRACKING
# --------------------------------------------------

@app.get("/orders/{order_id}")
def track_order(order_id: str):

    order_id = order_id.upper()

    with db() as conn:

        row = conn.execute(
            "SELECT * FROM orders WHERE order_id = ?",
            (order_id,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        events = conn.execute(
            """
            SELECT status, note, created_at
            FROM order_events
            WHERE order_id = ?
            ORDER BY event_id
            """,
            (order_id,),
        ).fetchall()

    result = dict(row)

    result["product_ids"] = json.loads(
        result["product_ids"]
    )

    result["quote"] = json.loads(
        result.pop("quote_json")
    )

    result["events"] = [
        dict(event)
        for event in events
    ]

    return result


# --------------------------------------------------
# ORDER STATUS UPDATE
# --------------------------------------------------

@app.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    req: StatusUpdate,
):

    allowed = {
        "Application received",
        "KYC pending",
        "KYC under review",
        "KYC approved",
        "Installation scheduled",
        "Installation in progress",
        "Activated",
        "Rejected",
    }

    if req.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail="Invalid order status",
        )

    now = datetime.now(timezone.utc).isoformat()
    order_id = order_id.upper()

    with db() as conn:

        existing = conn.execute(
            "SELECT order_id FROM orders WHERE order_id = ?",
            (order_id,),
        ).fetchone()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        conn.execute(
            """
            UPDATE orders
            SET status = ?, updated_at = ?
            WHERE order_id = ?
            """,
            (
                req.status,
                now,
                order_id,
            ),
        )

        conn.execute(
            """
            INSERT INTO order_events
            (order_id, status, note, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                order_id,
                req.status,
                req.note or "Order status updated.",
                now,
            ),
        )

    return {
        "order_id": order_id,
        "status": req.status,
        "updated_at": now,
    }