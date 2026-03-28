# Backup & Restore Strategy

## Database (PostgreSQL)

### Automated Backups
- **RDS automated backups**: enabled, 7-day retention
- **Point-in-time recovery**: available within retention window
- **Daily snapshots**: triggered by CloudWatch Events at 02:00 IST

### Manual Backup
```bash
# From bastion host / CI runner
pg_dump -h $DB_HOST -U katha -d katha_prod --format=custom --file=backup_$(date +%Y%m%d_%H%M%S).dump

# Upload to S3 with server-side encryption
aws s3 cp backup_*.dump s3://katha-backups/postgres/ --sse aws:kms
```

### Restore Procedure
```bash
# 1. Create a new RDS instance from snapshot (do NOT restore over production)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier katha-restore-test \
  --db-snapshot-identifier rds:katha-prod-2025-03-28

# 2. Verify data integrity on the restored instance
psql -h restored-host -U katha -d katha_prod -c "SELECT count(*) FROM users;"

# 3. If verified, swap DNS or update DATABASE_URL and redeploy
```

### What Is Backed Up
| Data | Method | Frequency | Retention |
|------|--------|-----------|-----------|
| PostgreSQL (all tables) | RDS snapshots | Daily + continuous WAL | 7 days |
| Redis (session state) | NOT backed up (ephemeral by design) | - | - |
| Voice enrollment audio | S3 versioning + cross-region replication | Continuous | 90 days |
| Admin audit logs | In PostgreSQL (backed up with DB) | With DB | With DB |
| Feature flag state | In PostgreSQL | With DB | With DB |

### What Is NOT Backed Up (by design)
- Redis story session state (regenerated on demand)
- BullMQ job queues (retried automatically)
- API server logs (shipped to CloudWatch, retained 30 days)

## Disaster Recovery

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Single AZ failure | 5 min | 0 | Multi-AZ failover (automatic) |
| Region failure | 1 hour | < 5 min | Restore from cross-region snapshot in ap-south-2 |
| Accidental data deletion | 30 min | < 1 min | Point-in-time recovery |
| Ransomware / compromise | 2 hours | < 1 hour | Restore from clean snapshot, rotate all secrets |
