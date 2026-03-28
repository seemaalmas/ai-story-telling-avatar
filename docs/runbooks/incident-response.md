# Incident Response Runbook

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| SEV-1 | Service down, all users affected | 15 min | API 5xx > 50%, DB unreachable |
| SEV-2 | Major feature broken | 30 min | Story engine failing, auth broken |
| SEV-3 | Minor feature degraded | 2 hours | Voice synthesis slow, admin panel errors |
| SEV-4 | Cosmetic / non-urgent | Next business day | UI glitch, log noise |

## SEV-1 Playbook

1. **Acknowledge** in #incidents Slack channel
2. **Check health endpoint**: `curl https://api.katha.ai/health/ready`
3. **Check recent deploys**: GitHub Actions → last deployment time
4. **If deploy-related**: rollback to previous image tag
   ```
   # ECS
   aws ecs update-service --cluster katha-prod --service api --task-definition katha-api:<previous-revision>
   ```
5. **If DB-related**: Check RDS console → Events, Performance Insights
6. **If Redis-related**: Check ElastiCache metrics → memory, connections
7. **Activate kill switches** if a specific feature is causing cascading failures:
   ```
   curl -X POST https://api.katha.ai/api/v1/admin/kill-switch/story_engine_enabled/activate \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```
8. **Post-incident**: Write postmortem within 48 hours

## Rollback Procedure

```bash
# 1. Find the last known good image
docker images | grep katha-api

# 2. Re-tag and deploy
docker tag katha-api:<good-sha> katha-api:rollback
# Deploy via CI: workflow_dispatch with the good SHA

# 3. If DB migration was the cause — DO NOT roll back migrations
# Instead, deploy a forward fix or hotfix migration
```

## Kill Switch Reference

| Switch | Effect When Disabled |
|--------|---------------------|
| `story_engine_enabled` | Story creation returns 503 |
| `voice_pipeline_enabled` | TTS/STT returns 503 |
| `self_voice_enrollment` | Voice enrollment blocked |
| `moderation_strict` | Relaxed content filtering (use in emergencies only) |
