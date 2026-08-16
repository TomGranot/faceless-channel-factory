#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Estimate monthly channel cost from explicit current provider rates.")
    parser.add_argument("config")
    parser.add_argument("--worker-monthly", type=float, required=True)
    parser.add_argument("--scheduler-monthly", type=float, required=True)
    parser.add_argument("--storage-monthly", type=float, required=True)
    parser.add_argument("--browser-per-video", type=float, required=True)
    parser.add_argument("--voice-per-video", type=float, required=True)
    parser.add_argument("--other-monthly", type=float, default=0)
    args = parser.parse_args()
    values = [args.worker_monthly, args.scheduler_monthly, args.storage_monthly, args.browser_per_video, args.voice_per_video, args.other_monthly]
    if any(value < 0 for value in values):
        raise SystemExit("Cost inputs cannot be negative.")

    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    videos = int(config["publication"]["postsPerDay"]) * 30
    fixed = args.worker_monthly + args.scheduler_monthly + args.storage_monthly + args.other_monthly
    variable = videos * (args.browser_per_video + args.voice_per_video)
    result = {
        "channel": config["slug"],
        "videosPerMonth": videos,
        "fixedUsd": round(fixed, 2),
        "variableUsd": round(variable, 2),
        "estimatedMonthlyUsd": round(fixed + variable, 2),
        "monthlyCeilingUsd": config.get("budget", {}).get("monthlyCeilingUsd"),
        "assumptions": {
            "workerMonthlyUsd": args.worker_monthly,
            "schedulerMonthlyUsd": args.scheduler_monthly,
            "storageMonthlyUsd": args.storage_monthly,
            "browserPerVideoUsd": args.browser_per_video,
            "voicePerVideoUsd": args.voice_per_video,
            "otherMonthlyUsd": args.other_monthly,
            "monthDays": 30,
        },
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
