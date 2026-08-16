# Estimate monthly cost

Provider prices change. Look up current rates on each provider's official pricing page, then pass those rates to the estimator.

```bash
python3 scripts/estimate-channel.py channels/source-led-demo/channel.json \
  --worker-monthly 0 \
  --scheduler-monthly 0 \
  --storage-monthly 0 \
  --browser-per-video 0 \
  --voice-per-video 0
```

Replace every zero with the current rate or keep zero only when the service is included in an existing plan. The result separates fixed monthly costs from browser and voice costs that scale with output.

The estimate excludes human editing, account setup, paid promotion, taxes, and overage pricing unless you add them through `--other-monthly`. Compare the result with `budget.monthlyCeilingUsd` in the channel config.
