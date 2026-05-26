# Swigato Database Schema

## Overview
Swigato uses PostgreSQL for its relational data layer and Alembic for schema migrations.

## Core Entities
- **Users**: Authentication and Role-based access control (Admin, Owner, Customer, Delivery)
- **Restaurants**: Multi-tenant restaurant entity with approval status
- **Menus**: Categories and Menu Items associated with restaurants
- **Orders**: Cart snapshots converted into Orders, with Items and Status History
- **Payments**: Transactions and webhook events tracked here
