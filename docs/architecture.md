# Target Architecture

## High-Level Components

- **Channel Layer**: branch, digital banking, API gateway.
- **Service Layer**: domain services for customer, product, accounts, lending, payments.
- **Integration Layer**: adapters for payment rails, credit bureaus, AML providers.
- **Data Layer**: relational core store, event log, analytics warehouse.
- **Control Layer**: IAM, audit, policy engine, monitoring, and configuration management.

## Key Design Patterns

- **Domain-driven design (DDD)** with bounded contexts per module.
- **Event sourcing for auditability**, supplemented by strong ledger integrity checks.
- **Workflow engine** to support maker-checker controls and approvals.
- **Policy-as-code** for limits, fees, and compliance rules.

## Non-Functional Requirements

- **Security**: encryption at rest/in transit, HSM integration, least privilege access.
- **Availability**: active-active services, resilient messaging, automated failover.
- **Scalability**: modular services, horizontal scaling for transaction-heavy modules.
- **Observability**: centralized logs, metrics, and audit event traceability.

## Integrations

- BSP reporting systems
- AML/CTF screening services
- Interbank payments networks
- Credit bureau data feeds
