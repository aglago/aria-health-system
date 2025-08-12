GitHub workflows are **automation scripts** for your repo, written in `.yml` under `.github/workflows/`. They use **GitHub Actions** to run steps when something happens (push, pull request, schedule, etc.).

Flow:

1. **Trigger** → event (e.g., push to main).
2. **Jobs** → group of steps run in order.
3. **Steps** → commands or actions.

Example:

```yml
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
```

This runs tests every push.
